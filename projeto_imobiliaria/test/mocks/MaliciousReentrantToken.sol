// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {PropertyToken} from "../../src/PropertyToken.sol";

/// @notice Moeda de pagamento maliciosa usada só no teste de reentrancy de
/// `comprarCotas` (SEC-01, contracts/property-token.md). Tenta reentrar
/// `comprarCotas` durante o `transferFrom` chamado pelo próprio `PropertyToken`.
contract MaliciousReentrantToken is ERC20 {
    PropertyToken public alvo;
    bool public reentrar;

    constructor() ERC20("Malicious", "MAL") {}

    function mint(address para, uint256 quantidade) external {
        _mint(para, quantidade);
    }

    function configurarAtaque(PropertyToken alvo_) external {
        alvo = alvo_;
        reentrar = true;
    }

    function transferFrom(address de, address para, uint256 quantidade) public override returns (bool) {
        if (reentrar) {
            reentrar = false;
            alvo.comprarCotas(1);
        }
        return super.transferFrom(de, para, quantidade);
    }
}
