# Solana P2P Swap Program

This Solana program, built using the Anchor framework, enables peer-to-peer (P2P) token swaps for both intra-chain (Solana-to-Solana) and inter-chain (Solana-to-EVM) trades. It supports swapping native SOL and SPL tokens, with secure vaults, deadline enforcement, and event emission for transparency.


## User-Side Functions

### Intra-Chain Swaps

#### deposit_seller_native
- **Description:** Deposits native SOL into a system-owned vault to create a trade offer. Transfers SOL from the seller to a PDA vault.
- **Parameters:**
    - **id:** Unique trade identifier (u64)
    - **token_b_wanted_amount:** Amount of tokens wanted in return (u64)
    - **sol_offered_amount:** Amount of SOL offered (u64)
    - **is_taker_native:** Whether the taker must pay with native SOL (bool)
    - **deadline:** Unix timestamp for trade expiration (i64)
- **Emits:** CreateTradeEvent

#### deposit_seller_spl
- **Description:** Deposits SPL tokens into an Associated Token Account (ATA) vault to create a trade offer. Transfers SPL tokens from the seller’s ATA to a vault.
- **Parameters:**
    - **id:** Unique trade identifier (u64)
    - **token_b_wanted_amount:** Amount of tokens wanted in return (u64)
    - **token_a_offered_amount:** Amount of SPL tokens offered (u64)
    - **is_taker_native:** Whether the taker must pay with native SOL (bool)
    - **deadline:** Unix timestamp for trade expiration (i64)
- **Emits:** CreateTradeEvent

#### finalize_intrachain_offer
- **Description:** Allows a buyer to take an intra-chain offer by depositing the requested tokens and receiving the seller’s assets, then closes the vault and offer accounts.
- **Parameters:**
    - **id:** Unique trade identifier (u64)
- **Constraints:**
    - Offer must not be completed.
    - Buyer cannot be the seller.
    - Trade must not be expired.
    - Vault must have sufficient funds.
- **Emits:** SwapCompletedEvent

### Inter-Chain Swaps (Origin: Solana)

#### interchain_origin_sol_deposit_seller_native
- **Description:** Deposits native SOL into a system-owned vault for an inter-chain trade (origin: Solana). Transfers SOL to a vault and creates an offer.
- **Parameters:**
    - **id:** Unique trade identifier (u64)
    - **seller_evm:** Seller’s EVM address ([u8; 20])
    - **token_b_wanted_amount:** Amount of tokens wanted (u64)
    - **sol_offered_amount:** Amount of SOL offered (u64)
    - **is_taker_native:** Whether the taker must pay with native tokens (bool)
    - **deadline:** Unix timestamp for trade expiration (i64)
- **Emits:** InterchainOriginSolCreateTradeEvent

#### interchain_origin_sol_deposit_seller_spl
- **Description:** Deposits SPL tokens into an ATA vault for an inter-chain trade (origin: Solana). Transfers SPL tokens to a vault and creates an offer.
- **Parameters:**
    - **id:** Unique trade identifier (u64)
    - **seller_evm:** Seller’s EVM address ([u8; 20])
    - **token_b_wanted_amount:** Amount of tokens wanted (u64)
    - **token_a_offered_amount:** Amount of SPL tokens offered (u64)
    - **is_taker_native:** Whether the taker must pay with native tokens (bool)
    - **deadline:** Unix timestamp for trade expiration (i64)
- **Emits:** InterchainOriginSolCreateTradeEvent

#### finalize_interchain_origin_sol_offer
- **Description:** Finalizes an inter-chain trade (origin: Solana) by transferring the seller’s assets (SOL or SPL) to the buyer’s Solana address and closing the relevant accounts.
- **Parameters:**
    - **id:** Unique trade identifier (u64)
- **Constraints:**
    - Offer must not be completed.
    - Buyer cannot be the seller.
    - Trade must not be expired.
    - Vault must have sufficient funds.
- **Emits:** InterchainSwapCompletedEvent

### Inter-Chain Swaps (Origin: EVM)

#### interchain_origin_evm_deposit_seller_native
- **Description:** Deposits native SOL into a system-owned vault for an inter-chain trade (origin: EVM) and updates an existing offer.
- **Parameters:**
    - **id:** Unique trade identifier (u64)
    - **external_seller_sol:** Seller’s Solana address (Pubkey)
    - **buyer_evm:** Buyer’s EVM address ([u8; 20])
    - **token_b_wanted_amount:** Amount of tokens wanted (u64)
    - **sol_offered_amount:** Amount of SOL offered (u64)
    - **is_taker_native:** Whether the taker must pay with native tokens (bool)
- **Constraints:**
    - Deposit must not have been completed.
    - Trade must not be expired.
- **Emits:** InterchainCreateTradeEvent

#### interchain_origin_evm_deposit_seller_spl
- **Description:** Deposits SPL tokens into an ATA vault for an inter-chain trade (origin: EVM) and updates an existing offer.
- **Parameters:**
    - **id:** Unique trade identifier (u64)
    - **external_seller_sol:** Seller’s Solana address (Pubkey)
    - **buyer_evm:** Buyer’s EVM address ([u8; 20])
    - **token_b_wanted_amount:** Amount of tokens wanted (u64)
    - **token_a_offered_amount:** Amount of SPL tokens offered (u64)
    - **is_taker_native:** Whether the taker must pay with native tokens (bool)
- **Constraints:**
    - Deposit must not have been completed.
    - Trade must not be expired.
- **Emits:** InterchainCreateTradeEvent

#### finalize_interchain_origin_evm_offer
- **Description:** Finalizes an inter-chain trade (origin: EVM) by transferring the buyer’s assets from the vault to the seller’s Solana address, closing the vault and offer accounts.
- **Parameters:**
    - **id:** Unique trade identifier (u64)
- **Constraints:**
    - Offer must not be completed.
    - Buyer cannot be the seller.
    - Trade must not be expired.
    - Deposit must be completed.
    - Vault must have sufficient funds.
- **Emits:** InterchainSwapCompletedEvent

## Relayer-Side Functions

#### relay_offer_clone
- **Description:** Relays an inter-chain trade offer from an EVM chain to Solana by creating an offer account to mirror the EVM trade.
- **Parameters:**
    - **id:** Unique trade identifier (u64)
    - **external_seller_evm:** Seller’s EVM address ([u8; 20])
    - **external_seller_sol:** Seller’s Solana address (Pubkey)
    - **token_a_offered_amount:** Amount of tokens offered (u64)
    - **token_b_wanted_amount:** Amount of tokens wanted (u64)
    - **is_taker_native:** Whether the taker pays with native tokens (bool)
    - **chain_id:** EVM chain ID (u64)
    - **deadline:** Unix timestamp for trade expiration (i64)
- **Emits:** RelayEvmTradeEvent

## Events

- **CreateTradeEvent:** Emitted when an intra-chain trade offer is created.
    - **Parameters:** id, maker, token_a_offered_amount, token_b_wanted_amount, is_taker_native, is_swap_completed.
- **InterchainOriginSolCreateTradeEvent:** Emitted when an inter-chain trade offer (origin: Solana) is created.
    - **Parameters:** id, seller_sol, seller_evm, token_a_offered_amount, token_b_wanted_amount, is_taker_native, is_native, is_swap_completed.
- **InterchainCreateTradeEvent:** Emitted when an inter-chain trade offer (origin: EVM) is updated with a buyer deposit.
    - **Parameters:** id, buyer, token_a_offered_amount, token_b_wanted_amount, is_taker_native, is_swap_completed, is_despoited.
- **SwapCompletedEvent:** Emitted when an intra-chain swap is completed.
    - **Parameters:** id, maker, taker, token_a_transferred, token_b_transferred, is_swap_completed.
- **InterchainSwapCompletedEvent:** Emitted when an inter-chain swap is completed.
    - **Parameters:** id, buyer, seller, token_a_transferred, token_b_transferred, is_swap_completed.
- **RelayEvmTradeEvent:** Emitted when an EVM trade offer is relayed to Solana.
    - **Parameters:** trade_id, external_seller_sol, external_seller_evm, is_seller_origin_sol, is_taker_native, is_swap_completed, is_native, chain_id, token_a_offered_amount, token_b_wanted_amount, token_mint_a, fee_collected.

## Error Handling

The program uses the P2PError enum to manage error conditions:
- **InvalidAmount:** Zero or invalid amounts.
- **SwapAlreadyCompleted:** Swap is already finalized.
- **MakerAndTakerCannotBeSame:** Seller and buyer cannot be the same.
- **InvalidAuthority:** Incorrect authority for vault operations.
- **TransferFailed:** Asset transfer failed.
- **InsufficientFunds:** Vault lacks sufficient funds.
- **OfferExpired:** Trade deadline has passed.
- **InvalidEvmAddress:** Invalid EVM address provided.
- **InvalidDeadline:** Invalid or expired deadline.
- **DepositAlreadyCompleted:** Deposit already made.
- **DepositNotCompleted:** Deposit not yet made.

## Account Structures

### Offer
Stores intra-chain trade details.
- **Fields:**
    - **id**
    - **maker**
    - **token_mint_a**
    - **token_mint_b**
    - **token_a_offered_amount**
    - **token_b_wanted_amount**
    - **is_native**
    - **is_taker_native**
    - **is_swap_completed**
    - **deadline**
    - **bump**

### InterchainOriginSolOffer
Stores inter-chain trade details when Solana is the origin chain.
- **Fields:**
    - **seller_sol**
    - **seller_evm**
    - **trade_id**
    - **external_buyer_sol**
    - **external_buyer_evm**
    - **is_seller_origin_sol**
    - **is_taker_native**
    - **is_swap_completed**
    - **is_native**
    - **chain_id**
    - **token_a_offered_amount**
    - **token_b_wanted_amount**
    - **token_mint_a**
    - **fee_collected**
    - **deadline**
    - **bump**

### InterchainOffer
Stores inter-chain trade details when EVM is the origin chain.
- **Fields:**
    - **buyer_sol**
    - **buyer_evm**
    - **trade_id**
    - **external_seller_sol**
    - **external_seller_evm**
    - **is_seller_origin_sol**
    - **is_taker_native**
    - **is_swap_completed**
    - **is_despoited**
    - **chain_id**
    - **token_a_offered_amount**
    - **token_b_wanted_amount**
    - **token_mint_a**
    - **fee_collected**
    - **deadline**
    - **bump**

## Security Considerations

- **PDA Vaults:** Assets are stored in program-controlled PDAs to prevent unauthorized access.
- **Access Control:** Only authorized accounts (e.g., global authority PDA) can transfer assets from vaults.
- **Deadline Enforcement:** Trades expire after the deadline, preventing stale offers.
- **Input Validation:** Extensive checks for valid amounts, addresses, and deadlines.
- **Event Logging:** All major actions emit events for transparency and off-chain monitoring.

## Limitations

- **Vault Closing:** Native SOL vaults require manual lamport refunds due to SystemProgram constraints.
- **Relayer Trust:** Inter-chain trades rely on trusted relayers to relay offer details accurately.
- **Fee Handling:** Fees are tracked but not automatically collected; relayers must implement fee logic off-chain.

## Future Improvements

- Implement automatic vault closing for native SOL accounts.
- Add support for dynamic fee collection within the program.
- Enhance relayer security with cryptographic signatures for offer validation.
- Support additional token types or cross-chain bridges.

## License

This program is licensed under the MIT License. See the LICENSE file for details.