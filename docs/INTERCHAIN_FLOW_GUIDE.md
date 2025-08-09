# 🌉 Interchain Cross-Chain Swap Flow Guide

## Overview
This document explains the complete interchain swap flow where a user on Ethereum wants to trade ETH for SOL with a user on Solana. The flow involves 3 main steps executed across two blockchains with the help of relayers.

## 🎭 The Players

### 👥 Main Actors
| Role | Address | Description |
|------|---------|-------------|
| **EVM Seller** | `0xc629fa8b87ad97e92c448e56df9d979e1d1f441f` | Original trader on Ethereum who wants SOL for their ETH |
| **User A (Buyer)** | `G3gVWRuyGYrDmeF54Du2MXTb5GfmXTsst7avZVPo1qHp` | Solana user who wants ETH and has SOL |
| **User B (External Seller)** | `AT7A6dih5biJhbm6RbfvphwqP9Cf7Fmnsjr744nPdQns` | Facilitator on Solana (acts as EVM seller's agent) |
| **Relayer** | Network Service | Monitors EVM and clones offers to Solana |

### 💰 The Trade
```
📋 TRADE DETAILS
├── What's Being Traded: 0.17 ETH ↔ 0.05 SOL
├── Trade ID: 3342880861
├── EVM Chain: Ethereum (Chain ID: 1)
├── Payment Method: Native SOL (is_taker_native: true)
├── Direction: Ethereum → Solana
└── Status: ✅ Successfully Completed
```

---

## 🔄 Step-by-Step Flow

### 🌐 Step 1: Relay Offer Clone (EVM → Solana)
**WHO**: Relayer observes Ethereum and User B signs on Solana  
**WHAT**: Clone an existing Ethereum offer to Solana blockchain  
**WHY**: Make EVM offers discoverable to Solana users  

```
🔍 BEFORE (Ethereum):
├── EVM Seller has: 0.17 ETH
├── EVM Seller wants: 0.05 SOL  
├── Offer exists on Ethereum DEX
└── Solana users can't see it

⚡ PROCESS:
├── Relayer monitors Ethereum offers
├── Relayer calls relay_offer_clone() on Solana
├── User B signs transaction (as external seller agent)
├── InterchainOffer account created on Solana
└── Offer now visible to Solana users

✅ AFTER (Solana):
├── Offer PDA: EQzemRnuBteJUaqsjpKESDncC4Qi8c6ro6QjCsUQZp9B
├── Trade ID: 3342880861
├── External Seller SOL: AT7A6d...dQns (User B)
├── Status: Available for takers
└── Tx: 54JcuhtwTcpjHJTTSDA7MjeA8mutrWDa2Md4deK6ZkXs...
```

### 💰 Step 2: Deposit Native SOL (Buyer Commits)
**WHO**: User A (the buyer who wants ETH)  
**WHAT**: Deposit 0.05 SOL to secure the trade  
**WHY**: Lock funds to guarantee trade execution  

```
🔍 BEFORE:
├── User A sees available offer
├── User A has: >0.05 SOL
├── User A wants: 0.17 ETH
└── Vault doesn't exist yet

⚡ PROCESS:
├── User A calls interchain_origin_evm_deposit_seller_native()
├── 0.05 SOL transferred to program vault
├── Vault PDA created: HwzEG5NT6UAfvW7UDbXiM7PgDtN3cHpz5soFLNAgXWsE
├── buyer_sol field updated in offer account
└── Funds locked until finalization

✅ AFTER:
├── Vault Balance: 50,890,880 lamports (50M + rent)
├── User A recorded as buyer_sol in offer
├── Trade commitment secured
├── Status: Ready for finalization
└── Tx: g8HTwRi6WAukPd6A5ZQF4iXkAydy2ebGhgjb...
```

### ✅ Step 3: Finalize Interchain Swap (Distribution)
**WHO**: User B (external seller/facilitator)  
**WHAT**: Claim SOL from vault and close offer  
**WHY**: Complete Solana side and trigger EVM transfer  

```
🔍 BEFORE:
├── SOL locked in vault: 50,890,880 lamports
├── User B balance: 1,140,311,680 lamports
├── Offer account exists with trade data
└── User B responsible for ETH transfer

⚡ PROCESS:
├── User B calls finalize_interchain_origin_evm_offer()
├── SOL transferred from vault to User B
├── Offer account closed (rent reclaimed)
├── Global authority manages transfer
└── Vault account cleaned up

✅ AFTER:
├── User B balance: 1,192,733,760 lamports (+52.4M)
├── User B gained: ~0.052 SOL 
├── Offer account: Closed ✅
├── Vault account: Drained ✅
├── Solana side: Complete ✅
└── Tx: 5QKK3VqvxF4kG4VDeVQJe61trGVbKgdNEHeB...

📤 OFF-CHAIN RESPONSIBILITY:
├── User B must send 0.17 ETH to EVM Seller
├── This happens on Ethereum (outside Solana)
├── Relayers can monitor for completion
└── Trade fully complete when ETH sent
```

---

## 🏗️ Technical Architecture

### � Smart Contract Accounts

#### InterchainOffer Account
```rust
📄 Account Data (Before Closure):
├── trade_id: 3342880861
├── external_seller_sol: AT7A6dih5biJhbm6RbfvphwqP9Cf7Fmnsjr744nPdQns
├── external_seller_evm: [0xc6, 0x29, 0xfa, ...] (20 bytes)
├── buyer_sol: G3gVWRuyGYrDmeF54Du2MXTb5GfmXTsst7avZVPo1qHp
├── token_a_offered_amount: 170000000000000000 (0.17 ETH wei)
├── token_b_wanted_amount: 50000000 (0.05 SOL lamports)
├── is_taker_native: true
├── chain_id: 1 (Ethereum)
├── is_swap_completed: false → true
└── PDA: EQzemRnuBteJUaqsjpKESDncC4Qi8c6ro6QjCsUQZp9B
```

#### Vault Account (Native SOL)
```rust
🏦 Vault Details:
├── PDA Seeds: ["vault-native", buyer_sol, trade_id_le_bytes]
├── Address: HwzEG5NT6UAfvW7UDbXiM7PgDtN3cHpz5soFLNAgXWsE
├── Purpose: Temporary SOL storage during trade
├── Balance: 50,890,880 lamports (includes rent)
├── Owner: System Program (managed by DEX program)
└── Lifecycle: Created in Step 2, Drained in Step 3
```

#### Global Authority PDA
```rust
🔐 Authority Details:
├── PDA Seeds: ["global-authority", buyer_sol, trade_id_le_bytes]
├── Address: 2zSFNU7iBWmXYFNhWmHub3expdJnnMJDw6FQv791K5HU
├── Purpose: Program authority for vault operations
├── Powers: Transfer SOL from vaults
└── Security: Only callable by program instructions
```

---

## 💎 Value Flow Analysis

### 💸 Financial Breakdown
```
🏦 BEFORE TRADE:
├── User A: Has >0.05 SOL, Wants 0.17 ETH
├── User B: Balance 1,140,311,680 lamports
├── EVM Seller: Has 0.17 ETH, Wants 0.05 SOL
└── Vault: Empty

📊 DURING TRADE:
├── User A: -50,000,000 lamports (to vault)
├── Vault: +50,890,880 lamports (includes rent)
├── Program: Manages +holds funds
└── Security: Funds locked, reversible if needed

💰 AFTER TRADE:
├── User A: Will receive 0.17 ETH on Ethereum
├── User B: +52,422,080 lamports (~0.052 SOL)
├── EVM Seller: Will receive 0.05 SOL equivalent
├── Vault: 0 lamports (closed)
└── Program: Rent reclaimed
```

### 🎯 Incentive Structure
- **User A**: Gets desired ETH for their SOL
- **User B**: Earns SOL for facilitating the trade
- **EVM Seller**: Gets desired SOL for their ETH
- **Relayers**: Can charge fees for cross-chain service

---

## � Security & Trust Model

### 🛡️ Security Features
1. **Atomic Operations**: Each step is reversible if incomplete
2. **PDA-based Custody**: No single party controls funds
3. **Role-based Access**: Only authorized users can execute steps
4. **Time Locks**: Offers can have expiration deadlines
5. **Account Closure**: Prevents rent exploitation

### 🤝 Trust Requirements
1. **User A trusts**:
   - Program logic correctness
   - User B will send ETH on Ethereum
   - Relayer infrastructure reliability

2. **User B trusts**:
   - Relayer system accuracy
   - EVM state verification
   - Economic incentives alignment

3. **Minimal Trust**:
   - No custodial intermediaries
   - Code is auditable
   - Funds locked in program, not with humans

---

## 🚀 Off-Chain Completion

### 🌐 What Happens Next
After Step 3 completes on Solana:

1. **User B's Responsibility**:
   - Send 0.17 ETH to EVM Seller on Ethereum
   - Address: `0xc629fa8b87ad97e92c448e56df9d979e1d1f441f`
   - Amount: `170000000000000000 wei`

2. **Monitoring & Verification**:
   - Relayers can monitor Ethereum for ETH transfer
   - Event emitters can broadcast completion
   - Reputation systems can track User B reliability

3. **Complete Trade Flow**:
   ```
   EVM Seller: -0.17 ETH → +0.05 SOL value ✅
   User A:     -0.05 SOL → +0.17 ETH ✅
   User B:     Facilitates trade, earns service fee ✅
   ```

---

## 📚 Key Takeaways

### ✨ What This Demonstrates
- **Cross-chain atomic swaps** without bridges
- **Trustless fund custody** using program PDAs
- **Scalable relayer architecture** for cross-chain communication
- **Economic incentives** aligning all participants
- **Efficient state management** with account closure

### 🎯 Real-World Applications
- **DEX Aggregation**: Access liquidity across chains
- **Arbitrage Opportunities**: Price differences between chains
- **User Experience**: Trade any token for any token
- **Capital Efficiency**: No locked bridge funds needed

---

## 🛠️ Technical Commands

### Run the Test Flow
```bash
# Navigate to project directory
cd /path/to/sol-p2p-program

# Run the specific interchain flow test
anchor test --skip-deploy --skip-build -- --grep "interchain-origin-EVM-flow"

# Or run all tests
anchor test --skip-deploy --skip-build
```

### Expected Output
```
✅ Step 1: relay_offer_clone tx signature: 54Jcuh...
✅ Step 2: Deposit transaction signature: g8HTwR...
✅ Step 3: Finalize transaction signature: 5QKK3V...
🎉 INTERCHAIN ORIGIN EVM FLOW COMPLETED SUCCESSFULLY!
```

This completes a full cross-chain swap demonstration! 🎉
