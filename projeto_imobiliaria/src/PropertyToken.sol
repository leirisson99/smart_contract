// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ComplianceModule} from "./ComplianceModule.sol";
import {IdentityRegistry} from "./IdentityRegistry.sol";

/// @notice Representa as cotas de UM imóvel (ERC-3643 simplificado, ADR-0001).
/// Deployado como minimal proxy (EIP-1167) pela `PropertyFactory` (RNF-05) — por
/// isso usa `inicializar` em vez de `constructor` para o estado do imóvel. A
/// implementação (não-clone) se auto-trava no `constructor` para que
/// `inicializar` só funcione em clones.
///
/// A moeda de liquidação (RISK-08, decisão de negócio ainda em aberto) é
/// desacoplada via `moedaPagamento`, um endereço ERC-20 configurável na
/// inicialização — ver sprints/sprint-02-tokenizacao-imovel.md.
contract PropertyToken is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant PLATFORM_ADMIN_ROLE = keccak256("PLATFORM_ADMIN_ROLE");

    bool private _inicializado;

    string public nome;
    uint256 public totalCotas;
    uint256 public precoPorCota;
    ComplianceModule public complianceModule;
    IdentityRegistry public identityRegistry;
    IERC20 public moedaPagamento;
    address public tesouraria;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    event CotasCompradas(address indexed investidor, uint256 quantidade, uint256 valorPago);
    event Transfer(address indexed de, address indexed para, uint256 quantidade);
    event Approval(address indexed proprietario, address indexed spender, uint256 quantidade);
    event Pausado();
    event Retomado();

    error JaInicializado();
    error QuantidadeInvalida();
    error CotasIndisponiveis(uint256 solicitado, uint256 disponivel);
    error SaldoInsuficiente(address de, uint256 solicitado, uint256 saldo);
    error PermissaoInsuficiente(address proprietario, address spender, uint256 solicitado, uint256 permitido);
    error ComplianceNaoVerificado(string motivo);

    constructor() {
        // Trava a implementação (não-clone) — só clones podem ser inicializados.
        _inicializado = true;
    }

    function inicializar(
        string calldata nome_,
        uint256 totalCotas_,
        uint256 precoPorCota_,
        address complianceModule_,
        address identityRegistry_,
        address moedaPagamento_,
        address tesouraria_,
        address admin_
    ) external {
        if (_inicializado) revert JaInicializado();
        _inicializado = true;

        nome = nome_;
        totalCotas = totalCotas_;
        precoPorCota = precoPorCota_;
        complianceModule = ComplianceModule(complianceModule_);
        identityRegistry = IdentityRegistry(identityRegistry_);
        moedaPagamento = IERC20(moedaPagamento_);
        tesouraria = tesouraria_;

        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(PLATFORM_ADMIN_ROLE, admin_);
    }

    // ---- Emissão primária ----

    function comprarCotas(uint256 quantidade) external nonReentrant whenNotPaused {
        if (quantidade == 0) revert QuantidadeInvalida();

        uint256 disponivel = totalCotas - _totalSupply;
        if (quantidade > disponivel) revert CotasIndisponiveis(quantidade, disponivel);

        if (!complianceModule.canTransfer(address(0), msg.sender, quantidade)) {
            revert ComplianceNaoVerificado(complianceModule.motivoBloqueio(address(0), msg.sender));
        }

        uint256 valorPago = precoPorCota * quantidade;

        // Effects antes de qualquer chamada externa (CEI, SEC-01).
        _totalSupply += quantidade;
        _balances[msg.sender] += quantidade;

        moedaPagamento.safeTransferFrom(msg.sender, tesouraria, valorPago);
        complianceModule.registrarTransferencia(address(0), msg.sender, 0, _balances[msg.sender]);

        emit CotasCompradas(msg.sender, quantidade, valorPago);
        emit Transfer(address(0), msg.sender, quantidade);
    }

    // ---- ERC-20 mínimo com compliance ----

    function transfer(address para, uint256 quantidade) external nonReentrant whenNotPaused returns (bool) {
        _transferirComCompliance(msg.sender, para, quantidade);
        return true;
    }

    function transferFrom(address de, address para, uint256 quantidade)
        external
        nonReentrant
        whenNotPaused
        returns (bool)
    {
        _gastarPermissao(de, msg.sender, quantidade);
        _transferirComCompliance(de, para, quantidade);
        return true;
    }

    function approve(address spender, uint256 quantidade) external returns (bool) {
        _allowances[msg.sender][spender] = quantidade;
        emit Approval(msg.sender, spender, quantidade);
        return true;
    }

    function allowance(address proprietario, address spender) external view returns (uint256) {
        return _allowances[proprietario][spender];
    }

    // ---- Administração ----

    function pausar() external onlyRole(PLATFORM_ADMIN_ROLE) {
        _pause();
        emit Pausado();
    }

    function retomar() external onlyRole(PLATFORM_ADMIN_ROLE) {
        _unpause();
        emit Retomado();
    }

    // ---- Leitura ----

    function balanceOf(address carteira) external view returns (uint256) {
        return _balances[carteira];
    }

    function cotasDisponiveis() external view returns (uint256) {
        return totalCotas - _totalSupply;
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    // ---- Internas ----

    function _transferirComCompliance(address de, address para, uint256 quantidade) private {
        uint256 saldoDe = _balances[de];
        if (quantidade > saldoDe) revert SaldoInsuficiente(de, quantidade, saldoDe);

        if (!complianceModule.canTransfer(de, para, quantidade)) {
            revert ComplianceNaoVerificado(complianceModule.motivoBloqueio(de, para));
        }

        _balances[de] = saldoDe - quantidade;
        _balances[para] += quantidade;

        complianceModule.registrarTransferencia(de, para, _balances[de], _balances[para]);

        emit Transfer(de, para, quantidade);
    }

    function _gastarPermissao(address proprietario, address spender, uint256 quantidade) private {
        uint256 permitido = _allowances[proprietario][spender];
        if (quantidade > permitido) revert PermissaoInsuficiente(proprietario, spender, quantidade, permitido);
        _allowances[proprietario][spender] = permitido - quantidade;
    }
}
