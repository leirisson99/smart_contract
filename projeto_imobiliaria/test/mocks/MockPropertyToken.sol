// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ComplianceModule} from "../../src/ComplianceModule.sol";

/// @notice Mock mínimo do futuro `PropertyToken` (feature 002), usado apenas nos
/// testes de integração desta sprint para validar que `IdentityRegistry` +
/// `ComplianceModule` bloqueiam/permitem transferências corretamente ponta a
/// ponta (SEC-08: nenhum caminho de transferência deve pular `canTransfer`).
/// Não é a implementação real do token ERC-3643 — apenas o suficiente para
/// exercitar mint/transfer passando por `canTransfer`/`registrarTransferencia`.
contract MockPropertyToken {
    ComplianceModule public immutable compliance;
    mapping(address => uint256) public balanceOf;

    error ComplianceNaoVerificado(string motivo);

    constructor(ComplianceModule compliance_) {
        compliance = compliance_;
    }

    function mint(address para, uint256 quantidade) external {
        _transfer(address(0), para, quantidade);
    }

    function transfer(address para, uint256 quantidade) external {
        _transfer(msg.sender, para, quantidade);
    }

    function _transfer(address de, address para, uint256 quantidade) private {
        if (!compliance.canTransfer(de, para, quantidade)) {
            revert ComplianceNaoVerificado(compliance.motivoBloqueio(de, para));
        }

        if (de != address(0)) {
            balanceOf[de] -= quantidade;
        }
        balanceOf[para] += quantidade;

        compliance.registrarTransferencia(de, para, balanceOf[de], balanceOf[para]);
    }
}
