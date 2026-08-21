// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {IdentityRegistry} from "./IdentityRegistry.sol";
import {ComplianceModule} from "./ComplianceModule.sol";
import {PropertyToken} from "./PropertyToken.sol";

/// @notice Deploya um `PropertyToken` por imóvel, de forma padronizada, e
/// mantém o registro dos imóveis já tokenizados na plataforma. Todo
/// `PropertyToken` criado compartilha a mesma referência de
/// `IdentityRegistry`/`ComplianceModule` (feature 001), para que o KYC de um
/// investidor valha para qualquer imóvel.
///
/// Usa minimal proxy (EIP-1167, `Clones`) para o deploy — imutável por design
/// (ADR-0005): cada clone aponta para sempre à mesma implementação com que
/// foi criado; uma nova versão de `PropertyToken` implica uma nova
/// `PropertyFactory` apontando para ela, sem afetar imóveis já existentes.
///
/// Requer, como passo de deploy, que esta Factory tenha `DEFAULT_ADMIN_ROLE`
/// no `ComplianceModule` — necessário para conceder `TOKEN_ROLE` a cada novo
/// `PropertyToken` que cria (ver `ComplianceModule.registrarTransferencia`).
contract PropertyFactory is AccessControl {
    bytes32 public constant PLATFORM_ADMIN_ROLE = keccak256("PLATFORM_ADMIN_ROLE");

    IdentityRegistry public immutable identityRegistry;
    ComplianceModule public immutable complianceModule;
    address public immutable moedaPagamento;
    address public immutable tesouraria;
    address public immutable propertyTokenImplementacao;

    address[] private _imoveis;

    event ImovelCriado(
        uint256 indexed id, address indexed propertyToken, string nome, uint256 valorTotal, uint256 numeroCotas
    );

    error NumeroCotasInvalido();
    error ValorNaoDivisivelPorCotas(uint256 valorTotal, uint256 numeroCotas);

    constructor(
        IdentityRegistry identityRegistry_,
        ComplianceModule complianceModule_,
        address moedaPagamento_,
        address tesouraria_,
        address propertyTokenImplementacao_
    ) {
        identityRegistry = identityRegistry_;
        complianceModule = complianceModule_;
        moedaPagamento = moedaPagamento_;
        tesouraria = tesouraria_;
        propertyTokenImplementacao = propertyTokenImplementacao_;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PLATFORM_ADMIN_ROLE, msg.sender);
    }

    function criarImovel(string calldata nome, uint256 valorTotal, uint256 numeroCotas)
        external
        onlyRole(PLATFORM_ADMIN_ROLE)
        returns (address propertyToken)
    {
        if (numeroCotas == 0) revert NumeroCotasInvalido();
        if (valorTotal % numeroCotas != 0) revert ValorNaoDivisivelPorCotas(valorTotal, numeroCotas);
        uint256 precoPorCota = valorTotal / numeroCotas;

        propertyToken = Clones.clone(propertyTokenImplementacao);

        complianceModule.grantRole(complianceModule.TOKEN_ROLE(), propertyToken);

        PropertyToken(propertyToken)
            .inicializar(
                nome,
                numeroCotas,
                precoPorCota,
                address(complianceModule),
                address(identityRegistry),
                moedaPagamento,
                tesouraria,
                msg.sender
            );

        uint256 id = _imoveis.length;
        _imoveis.push(propertyToken);

        emit ImovelCriado(id, propertyToken, nome, valorTotal, numeroCotas);
    }

    function imoveis() external view returns (address[] memory) {
        return _imoveis;
    }

    function imovelPorId(uint256 id) external view returns (address) {
        return _imoveis[id];
    }
}
