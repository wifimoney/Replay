/// ReplayFeeSplitter - Fee splitting for x402 payments on Movement
/// 
/// This module handles payment splitting between the platform and content creators.
module replay_fee_splitter::fee_splitter {
    use std::signer;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::event;

    /// Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_INVALID_FEE: u64 = 2;
    const E_NOT_INITIALIZED: u64 = 3;
    const E_ZERO_AMOUNT: u64 = 4;
    const E_ALREADY_INITIALIZED: u64 = 5;
    const E_INVALID_CREATOR: u64 = 6;

    /// Platform configuration stored at the module address
    struct PlatformConfig has key {
        platform_wallet: address,
        platform_fee_bps: u64,  // Basis points (500 = 5%)
        admin: address,
    }

    /// Event emitted when a payment is processed
    #[event]
    struct PaymentEvent has drop, store {
        payer: address,
        creator: address,
        total_amount: u64,
        platform_fee: u64,
        creator_amount: u64,
    }

    /// Event emitted when config is updated
    #[event]
    struct ConfigUpdatedEvent has drop, store {
        admin: address,
        platform_wallet: address,
        platform_fee_bps: u64,
    }

    /// Initialize the fee splitter with platform wallet and fee
    /// Must be called by the module deployer (@replay_fee_splitter)
    public entry fun initialize(
        deployer: &signer,
        platform_wallet: address,
        platform_fee_bps: u64,
    ) {
        let deployer_addr = signer::address_of(deployer);
        
        // Ensure only the module deployer can initialize
        assert!(deployer_addr == @replay_fee_splitter, E_NOT_AUTHORIZED);
        
        // Ensure not already initialized
        assert!(!exists<PlatformConfig>(@replay_fee_splitter), E_ALREADY_INITIALIZED);
        
        // Validate fee is within bounds (0-100%)
        assert!(platform_fee_bps <= 10000, E_INVALID_FEE);
        
        move_to(deployer, PlatformConfig {
            platform_wallet,
            platform_fee_bps,
            admin: deployer_addr,
        });

        event::emit(ConfigUpdatedEvent {
            admin: deployer_addr,
            platform_wallet,
            platform_fee_bps,
        });
    }

    /// Split a payment between platform and creator
    /// Called when processing an x402 payment
    public entry fun split_payment(
        payer: &signer,
        creator: address,
        amount: u64,
    ) acquires PlatformConfig {
        // Ensure config exists
        assert!(exists<PlatformConfig>(@replay_fee_splitter), E_NOT_INITIALIZED);
        
        // Validate amount
        assert!(amount > 0, E_ZERO_AMOUNT);
        
        let config = borrow_global<PlatformConfig>(@replay_fee_splitter);
        
        // Calculate platform fee
        let platform_fee = (amount * config.platform_fee_bps) / 10000;
        let creator_amount = amount - platform_fee;
        
        // Transfer platform fee (only if > 0)
        if (platform_fee > 0) {
            coin::transfer<AptosCoin>(payer, config.platform_wallet, platform_fee);
        };
        
        // Transfer creator payment (only if > 0)
        if (creator_amount > 0) {
            coin::transfer<AptosCoin>(payer, creator, creator_amount);
        };

        // Emit event
        event::emit(PaymentEvent {
            payer: signer::address_of(payer),
            creator,
            total_amount: amount,
            platform_fee,
            creator_amount,
        });
    }

    /// Update platform wallet (admin only)
    public entry fun set_platform_wallet(
        admin: &signer,
        new_wallet: address,
    ) acquires PlatformConfig {
        assert!(exists<PlatformConfig>(@replay_fee_splitter), E_NOT_INITIALIZED);
        
        let config = borrow_global_mut<PlatformConfig>(@replay_fee_splitter);
        assert!(signer::address_of(admin) == config.admin, E_NOT_AUTHORIZED);
        
        config.platform_wallet = new_wallet;

        event::emit(ConfigUpdatedEvent {
            admin: config.admin,
            platform_wallet: new_wallet,
            platform_fee_bps: config.platform_fee_bps,
        });
    }

    /// Update platform fee (admin only)
    public entry fun set_platform_fee(
        admin: &signer,
        new_fee_bps: u64,
    ) acquires PlatformConfig {
        assert!(new_fee_bps <= 10000, E_INVALID_FEE);
        assert!(exists<PlatformConfig>(@replay_fee_splitter), E_NOT_INITIALIZED);
        
        let config = borrow_global_mut<PlatformConfig>(@replay_fee_splitter);
        assert!(signer::address_of(admin) == config.admin, E_NOT_AUTHORIZED);
        
        config.platform_fee_bps = new_fee_bps;

        event::emit(ConfigUpdatedEvent {
            admin: config.admin,
            platform_wallet: config.platform_wallet,
            platform_fee_bps: new_fee_bps,
        });
    }

    /// Transfer admin rights to a new address (admin only)
    public entry fun transfer_admin(
        admin: &signer,
        new_admin: address,
    ) acquires PlatformConfig {
        assert!(exists<PlatformConfig>(@replay_fee_splitter), E_NOT_INITIALIZED);
        
        let config = borrow_global_mut<PlatformConfig>(@replay_fee_splitter);
        assert!(signer::address_of(admin) == config.admin, E_NOT_AUTHORIZED);
        
        config.admin = new_admin;
    }

    /// Calculate the fee split for a given amount (helper for frontend)
    #[view]
    public fun calculate_split(amount: u64): (u64, u64) acquires PlatformConfig {
        assert!(exists<PlatformConfig>(@replay_fee_splitter), E_NOT_INITIALIZED);
        
        let config = borrow_global<PlatformConfig>(@replay_fee_splitter);