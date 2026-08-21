// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Dublê de `PropertyToken` usado só para exercitar os `require`s de
/// retorno do `Marketplace` (SEC-01/hardening Sprint 4, detector
/// `unchecked-transfer` do Slither). `transfer`/`transferFrom` do
/// `PropertyToken` real nunca retornam `false` (todo caminho de falha
/// reverte), então esse cenário não é alcançável com o contrato real — este
/// mock simula uma implementação de ERC-20 "silenciosa" (retorna `false` em
/// vez de reverter) só para provar que o `Marketplace` trata esse caso.
contract FalsyPropertyToken {
    IERC20 public moedaPagamento;
    bool public sucessoTransferFrom = true;
    bool public sucessoTransfer = true;

    constructor(IERC20 moedaPagamento_) {
        moedaPagamento = moedaPagamento_;
    }

    function configurarRetornos(bool sucessoTransferFrom_, bool sucessoTransfer_) external {
        sucessoTransferFrom = sucessoTransferFrom_;
        sucessoTransfer = sucessoTransfer_;
    }

    function transferFrom(address, address, uint256) external view returns (bool) {
        return sucessoTransferFrom;
    }

    function transfer(address, uint256) external view returns (bool) {
        return sucessoTransfer;
    }
}
