// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {PropertyToken} from "./PropertyToken.sol";

/// @notice Distribui rendimento (aluguel) de um imóvel entre os holders de
/// `PropertyToken`, proporcionalmente ao saldo de cada um no momento do
/// depósito (RF-12), via modelo pull-payment (ADR-0004): cada holder
/// reivindica sua parte individualmente, então nenhum holder pode bloquear
/// o recebimento dos demais (RNF-06).
///
/// Não é deployado via Factory/clone — frequência de deploy baixa (um por
/// imóvel) não justifica a otimização de gas do EIP-1167 usada em
/// `PropertyToken` (RNF-05). Como passo de deploy, precisa de `SNAPSHOT_ROLE`
/// no `PropertyToken` do imóvel, para poder tirar snapshots a cada depósito.
contract DividendDistributor is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant GESTOR_ROLE = keccak256("GESTOR_ROLE");

    struct Ciclo {
        uint256 snapshotId;
        uint256 valorTotal;
        uint256 totalSupplyNoSnapshot;
    }

    PropertyToken public immutable token;
    IERC20 public immutable moedaPagamento;

    uint256 private _cicloAtual;
    mapping(uint256 idCiclo => Ciclo) private _ciclos;
    mapping(uint256 idCiclo => mapping(address holder => bool)) private _reivindicado;

    event RendimentoDepositado(uint256 indexed idCiclo, uint256 valorTotal, uint256 totalSupplyNoSnapshot);
    event RendimentoReivindicado(address indexed holder, uint256 indexed idCiclo, uint256 valor);

    error ValorInvalido();
    error SemHoldersParaDistribuir();
    error NadaAReivindicar(address holder, uint256 idCiclo);

    constructor(PropertyToken token_) {
        token = token_;
        moedaPagamento = token_.moedaPagamento();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GESTOR_ROLE, msg.sender);
    }

    /// @notice Deposita o rendimento (aluguel) do ciclo, abrindo um novo
    /// snapshot dos saldos de `token` para calcular a parte de cada holder.
    function depositarRendimento(uint256 valor) external onlyRole(GESTOR_ROLE) nonReentrant returns (uint256 idCiclo) {
        if (valor == 0) revert ValorInvalido();

        uint256 snapshotId = token.snapshot();
        uint256 supply = token.totalSupply();
        if (supply == 0) revert SemHoldersParaDistribuir();

        _cicloAtual += 1;
        idCiclo = _cicloAtual;
        _ciclos[idCiclo] = Ciclo({snapshotId: snapshotId, valorTotal: valor, totalSupplyNoSnapshot: supply});

        moedaPagamento.safeTransferFrom(msg.sender, address(this), valor);

        emit RendimentoDepositado(idCiclo, valor, supply);
    }

    /// @notice Reivindica a parte proporcional de `idCiclo` para `msg.sender`.
    /// Independente de outros holders (RNF-06) — cada claim é uma transação
    /// isolada, sem loop sobre a lista de holders.
    function claim(uint256 idCiclo) public nonReentrant {
        uint256 valor = valorReivindicavel(msg.sender, idCiclo);
        if (valor == 0) revert NadaAReivindicar(msg.sender, idCiclo);

        // Effects antes da chamada externa (CEI, SEC-01).
        _reivindicado[idCiclo][msg.sender] = true;

        moedaPagamento.safeTransfer(msg.sender, valor);

        emit RendimentoReivindicado(msg.sender, idCiclo, valor);
    }

    /// @notice Conveniência: reivindica todos os ciclos pendentes do chamador.
    function claimTodos() external {
        uint256 total = _cicloAtual;
        for (uint256 i = 1; i <= total; i++) {
            if (valorReivindicavel(msg.sender, i) > 0) {
                claim(i);
            }
        }
    }

    // ---- Leitura ----

    function cicloAtual() external view returns (uint256) {
        return _cicloAtual;
    }

    function jaReivindicou(address holder, uint256 idCiclo) external view returns (bool) {
        return _reivindicado[idCiclo][holder];
    }

    /// @notice Parte de `holder` em `idCiclo`, proporcional ao saldo no
    /// snapshot daquele ciclo — nunca ao saldo atual. Retorna 0 se o ciclo não
    /// existe ou já foi reivindicado por `holder`.
    function valorReivindicavel(address holder, uint256 idCiclo) public view returns (uint256) {
        if (idCiclo == 0 || idCiclo > _cicloAtual) return 0;
        if (_reivindicado[idCiclo][holder]) return 0;

        Ciclo storage ciclo = _ciclos[idCiclo];
        uint256 saldoNoSnapshot = token.balanceOfAt(holder, ciclo.snapshotId);
        if (saldoNoSnapshot == 0) return 0;

        return (ciclo.valorTotal * saldoNoSnapshot) / ciclo.totalSupplyNoSnapshot;
    }
}
