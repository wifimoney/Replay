// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ReplayFeeSplitter.sol";

contract DeployReplayFeeSplitter is Script {
    function run() external {
        // Read from environment
        address platformWallet = vm.envAddress("PLATFORM_WALLET");
        uint256 platformFeeBps = vm.envOr("PLATFORM_FEE_BPS", uint256(500)); // Default 5%

        vm.startBroadcast();

        ReplayFeeSplitter splitter = new ReplayFeeSplitter(platformWallet, platformFeeBps);

        console.log("ReplayFeeSplitter deployed at:", address(splitter));
        console.log("Platform wallet:", platformWallet);
        console.log("Platform fee (bps):", platformFeeBps);

        vm.stopBroadcast();
    }
}
