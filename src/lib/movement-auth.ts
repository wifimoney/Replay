import {
    Aptos,
    AptosConfig,
    Network,
    AccountAddress,
    AccountAuthenticatorEd25519,
    Ed25519PublicKey,
    Ed25519Signature,
    generateSigningMessageForTransaction
} from '@aptos-labs/ts-sdk';
import { PrivyClient } from '@privy-io/node';

// Initialize Privy Client
const privy = new PrivyClient({
    appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
    appSecret: process.env.PRIVY_APP_SECRET || ''
});

// Initialize Aptos Client for Movement
const aptosConfig = new AptosConfig({
    network: Network.TESTNET,
    fullnode: process.env.NEXT_PUBLIC_MOVEMENT_RPC_URL || 'https://full.testnet.movementinfra.xyz/v1'
});
const aptos = new Aptos(aptosConfig);

/**
 * Execute a transaction on the Movement (Move VM) chain using a Privy wallet.
 * 
 * @param walletId - The Privy wallet ID (from user.wallet.id or similar)
 * @param publicKey - The public key of the wallet (from user.wallet.publicKey)
 * @param address - The address of the wallet
 * @param recipientAddress - The recipient's address
 * @param amount - Amount to transfer (in Octas)
 * @returns The transaction hash
 */
export async function sendMovementTransaction(
    walletId: string,
    publicKey: string,
    walletAddress: string,
    recipientAddress: string,
    amount: number
) {
    // 1. Convert address string to AccountAddress
    const senderAddress = AccountAddress.from(walletAddress);

    // 2. Build the raw transaction
    const rawTxn = await aptos.transaction.build.simple({
        sender: senderAddress,
        data: {
            function: '0x1::coin::transfer',
            typeArguments: ['0x1::aptos_coin::AptosCoin'],
            functionArguments: [recipientAddress, amount]
        }
    });

    // 3. Generate signing message
    const message = generateSigningMessageForTransaction(rawTxn);

    // 4. Sign with Privy (Server-side)
    // Note: 'hash' param for rawSign expects a hex string.
    const messageHex = `0x${Buffer.from(message).toString('hex')}`;

    // Using simple rpc 'personal_sign' if rawSign isn't exposed properly or using any type
    // But attempting to use the method from docs directly via casting to avoid type issues if definitions are old
    const signatureResponse = await (privy as any).walletApi.rpc({
        walletId,
        method: 'personal_sign',
        params: { message: messageHex }
    });

    const signature = signatureResponse.signature || signatureResponse;

    // 5. Wrap pk + signature
    const senderAuthenticator = new AccountAuthenticatorEd25519(
        new Ed25519PublicKey(publicKey),
        new Ed25519Signature((signature as string).slice(2)) // Remove '0x' prefix if present
    );

    // 6. Submit transaction
    const pending = await aptos.transaction.submit.simple({
        transaction: rawTxn,
        senderAuthenticator
    });

    // 7. Wait for execution
    const executed = await aptos.waitForTransaction({ transactionHash: pending.hash });

    return executed.hash;
}
