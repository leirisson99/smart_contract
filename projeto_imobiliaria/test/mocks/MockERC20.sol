// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Mock de moeda de liquidação (stablecoin) para testes da feature
/// 002-tokenizacao-imovel. A escolha real (BRZ, USDC etc.) é uma decisão de
/// negócio ainda em aberto (RISK-08) — `PropertyToken`/`PropertyFactory` são
/// desacoplados da moeda via endereço ERC-20 configurável, então qualquer
/// ERC-20 (este mock incluso) funciona sem alterar o contrato.
contract MockERC20 is ERC20 {
    constructor(string memory nome, string memory simbolo) ERC20(nome, simbolo) {}

    function mint(address para, uint256 quantidade) external {
        _mint(para, quantidade);
    }
}
