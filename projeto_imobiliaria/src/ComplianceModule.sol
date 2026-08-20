// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IdentityRegistry} from "./IdentityRegistry.sol";

/// @notice Compliance Module pluggável do ERC-3643 (ADR-0001). Decide, de forma
/// consultável por outros contratos (`PropertyToken`, `Marketplace`), se uma
/// transferência entre duas carteiras é permitida — hoje, com base em KYC
/// (`IdentityRegistry`) e em um limite opcional de holders.
contract ComplianceModule is AccessControl {
    bytes32 public constant COMPLIANCE_ADMIN_ROLE = keccak256("COMPLIANCE_ADMIN_ROLE");

    /// @notice Papel concedido ao(s) contrato(s) de token autorizados a manter o
    /// contador de holders sincronizado via `registrarTransferencia`.
    bytes32 public constant TOKEN_ROLE = keccak256("TOKEN_ROLE");

    IdentityRegistry public immutable identityRegistry;

    /// @notice Limite de holders distintos permitido; `0` = sem limite.
    uint256 public limiteHolders;
    uint256 public holderCount;
    mapping(address carteira => bool ehHolder) public isHolder;

    event LimiteHoldersDefinido(uint256 limite);

    constructor(IdentityRegistry identityRegistry_) {
        identityRegistry = identityRegistry_;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(COMPLIANCE_ADMIN_ROLE, msg.sender);
    }

    function definirLimiteHolders(uint256 limite) external onlyRole(COMPLIANCE_ADMIN_ROLE) {
        limiteHolders = limite;
        emit LimiteHoldersDefinido(limite);
    }

    /// @notice Chamado pelo token (`TOKEN_ROLE`) após cada transferência bem-sucedida,
    /// para manter o contador de holders sincronizado sem que `canTransfer` precise
    /// fazer chamadas externas mutáveis — mantendo-o `view`, conforme invariante
    /// de `contracts/compliance-module.md`.
    function registrarTransferencia(address de, address para, uint256 saldoDeApos, uint256 saldoParaApos)
        external
        onlyRole(TOKEN_ROLE)
    {
        if (saldoDeApos == 0 && isHolder[de]) {
            isHolder[de] = false;
            holderCount -= 1;
        }
        if (saldoParaApos > 0 && !isHolder[para]) {
            isHolder[para] = true;
            holderCount += 1;
        }
    }

    /// @notice Chamada pelo `PropertyToken` antes de qualquer transferência.
    function canTransfer(address de, address para, uint256 quantidade) public view returns (bool) {
        if (!identityRegistry.isVerified(para)) return false;
        if (_limiteHoldersAtingidoPara(para)) return false;
        return true;
    }

    /// @notice Motivo legível do bloqueio, para mensagens de erro/UX na plataforma.
    /// Retorna string vazia quando a transferência é permitida.
    function motivoBloqueio(address de, address para) external view returns (string memory) {
        if (!identityRegistry.isVerified(para)) return "destino sem KYC verificado";
        if (_limiteHoldersAtingidoPara(para)) return "limite de holders atingido";
        return "";
    }

    function _limiteHoldersAtingidoPara(address para) private view returns (bool) {
        return limiteHolders > 0 && !isHolder[para] && holderCount >= limiteHolders;
    }
}
