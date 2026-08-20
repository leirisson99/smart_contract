// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {IdentityRegistry} from "../src/IdentityRegistry.sol";
import {ComplianceModule} from "../src/ComplianceModule.sol";

/// @notice Deploy da feature 001-identidade-kyc: `IdentityRegistry` + `ComplianceModule`.
/// Uso local (Anvil): forge script script/DeployIdentityKyc.s.sol --rpc-url http://127.0.0.1:8545 --private-key <key> --broadcast
/// Uso testnet (Amoy): forge script script/DeployIdentityKyc.s.sol --rpc-url amoy --private-key $PRIVATE_KEY --broadcast --verify
contract DeployIdentityKyc is Script {
    function run() external returns (IdentityRegistry identityRegistry, ComplianceModule compliance) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);
        identityRegistry = new IdentityRegistry();
        compliance = new ComplianceModule(identityRegistry);
        vm.stopBroadcast();

        console.log("IdentityRegistry:", address(identityRegistry));
        console.log("ComplianceModule:", address(compliance));
    }
}
