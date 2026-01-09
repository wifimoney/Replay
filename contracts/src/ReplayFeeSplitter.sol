// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReplayFeeSplitter
 * @notice Simple stateless fee splitter for x402 payments.
 * @dev Takes a payment, takes a cut for the platform, sends the rest to the creator.
 */
contract ReplayFeeSplitter is Ownable {
    address public platformWallet;
    uint256 public platformFeeBps; // Basis points (e.g. 500 = 5%)

    event PaymentProcessed(address indexed payer, address indexed creator, uint256 totalAmount, uint256 platformFee);

    constructor(address _platformWallet, uint256 _platformFeeBps) Ownable(msg.sender) {
        require(_platformWallet != address(0), "Invalid platform wallet");
        require(_platformFeeBps <= 10000, "Fee too high");
        platformWallet = _platformWallet;
        platformFeeBps = _platformFeeBps;
    }

    /**
     * @notice Process a payment, splitting it between platform and creator.
     * @dev The caller (usually the x402 facilitator) must have allowance from the payer.
     *      Or if using transferWithAuthorization, this contract would be the 'to' 
     *      and call receiveWithAuthorization? No, that's EIP-3009 specific.
     *      
     *      For x402 Mode B with EIP-3009 transferWithAuthorization:
     *      The 'to' address in the signed message is THIS contract.
     *      The facilitator calls a function on the USDC contract to execute the transfer.
     *      Wait, USDC's transferWithAuthorization sends funds TO the destination.
     *      So funds arrive here. Then we need a function to sweep/distribute.
     *      
     *      Alternatively, this contract exposes `pay(token, creator, amount)` 
     *      and pulls funds using `transferFrom`? 
     *      But x402 relies on EIP-3009 signatures which transfer TO a specific address.
     *      
     *      If the signed message is "pay TO Splitter", the funds sit in the Splitter.
     *      Then we call `distribute(token, creator)`?
     *      
     *      Simpler Mode B for EIP-3009:
     *      The user signs a message to pay the Splitter.
     *      The functionality here assumes the funds have arrived or are arriving.
     */
    function splitPayment(address token, address creator, uint256 amount) external {
        IERC20(token).transfer(platformWallet, (amount * platformFeeBps) / 10000);
        IERC20(token).transfer(creator, amount - ((amount * platformFeeBps) / 10000));
    }
    
    // Admin functions
    function setPlatformWallet(address _platformWallet) external onlyOwner {
        platformWallet = _platformWallet;
    }

    function setPlatformFee(uint256 _platformFeeBps) external onlyOwner {
        platformFeeBps = _platformFeeBps;
    }
}
