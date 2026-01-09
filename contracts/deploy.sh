#!/bin/bash
# Deploy ReplayFeeSplitter to Movement M2 Testnet

set -e

# Movement M2 EVM Testnet RPC
RPC_URL="https://mevm.testnet.imola.movementlabs.xyz/v1"

# Your platform wallet (where fees go)
# Using the account you just funded
PLATFORM_WALLET="0x0501a90a29e631f8a7a9a0d049d586a1584d86d9690b0091349d8c222b675272"

# Platform fee in basis points (500 = 5%)
PLATFORM_FEE_BPS=500

echo "🚀 Deploying ReplayFeeSplitter to Movement M2 Testnet..."
echo "Platform wallet: $PLATFORM_WALLET"
echo "Platform fee: ${PLATFORM_FEE_BPS} bps ($(echo "scale=2; $PLATFORM_FEE_BPS / 100" | bc)%)"
echo ""

# Check for private key
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY environment variable not set"
    echo ""
    echo "Usage:"
    echo "  PRIVATE_KEY=0x... ./deploy.sh"
    echo ""
    echo "Or export it first:"
    echo "  export PRIVATE_KEY=0x..."
    echo "  ./deploy.sh"
    exit 1
fi

cd "$(dirname "$0")"

# Install dependencies if needed
if [ ! -d "lib/forge-std" ]; then
    echo "📦 Installing forge-std..."
    forge install foundry-rs/forge-std --no-commit
fi

if [ ! -d "lib/openzeppelin-contracts" ]; then
    echo "📦 Installing OpenZeppelin..."
    forge install OpenZeppelin/openzeppelin-contracts --no-commit
fi

# Deploy
PLATFORM_WALLET=$PLATFORM_WALLET \
PLATFORM_FEE_BPS=$PLATFORM_FEE_BPS \
forge script script/Deploy.s.sol:DeployReplayFeeSplitter \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    -vvv

echo ""
echo "✅ Deployment complete!"
echo "📋 Copy the deployed address and add it to your .env.local:"
echo "   REPLAY_FEE_SPLITTER_ADDRESS=<deployed_address>"
