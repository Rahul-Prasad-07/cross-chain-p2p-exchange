## This is the overall flow & useage of our progarm(solana-crosschain-p2p) with the testcases flow

#### Test Flow 

--> Add your keyPairs(private keys): where u hold assets

--> token mint address : of which spl-token u wants to transfer/recive

### Intrachain

- intrachain-seller 

    --> Deposit raw SOL (native) & Deposit SPL Tokens (non-native)
     - add req params

    --> what it does ?
     - it create offers as seller

- intrachain-swap-buyer 

    --> take offer native test & take offer spl test

    --> what it does ?
     - it do swap on existing offer as buyer
    
    - option-1 : add the same orderID to define offerPda & other needed PDA (or we can directly store PDAs in db and then fetch data)


### Interchain

- interchain-origin-SOL-seller

    --> Deposit interchain raw SOL (native) where seller originated on Solana & Deposit Interchain SPL Tokens (non-native) where seller originated on Solana
     - add req params : amounts, address (EVM, Solana)..etc

    --> what it does ?
     - create offer on solana-chain as seller

- interchain-origin-SOL-swap-buyer 

    --> Interchain Origin Sol Take Offer native swap test & Interchain Origin Sol Take Offer spl swap test

    --> what it does ?
     - it do swap on exisiting offers on solana chain, which created on solana itself
    
    - Note : add the same orderID to define offerPda & other PDAs (or we can directly store PDAs in db and then use that to fetch data as we are doing here)


- interchain-origin-EVM-seller

  ==> called relay Fns(interchain-native-relay-data/interchain-spl-relay-data") : store PDA address or OfferID to define PDAs

  - interchain-native-relay-data
  - interchain-spl-relay-data

   --> Deposit interchain raw SOL (native) & Deposit Interchain SPL Tokens (non-native)
    - add req params : amounts,address(evm,solana)..etc
    - Note : add the same orderID to define offerPda & other PDAs (or we can directly store PDAs in db and then use that to fetch data as we are doing here)

    --> what it does ?
     - offer is alredy created on EVM chain and relayer will pick them via listeners and  had call those two fn (interchain-native-relay-data/interchain-spl-relay-data) to relay information about that evm offers to solana chain --- so that our relayer pick that and first deposted requested amount onto program. 
     - after that relayer will pic singal that buyer had send requested amount to program, then relayers will transfer those offered amount from evm to buyer's solana address.
     - then relayer will trasfer reqested amount from program to seller's solana address (interchain-origin-EVM-swap-buyer)

- interchain-origin-EVM-swap-buyer 

   --> Interchain Take offer native swap test & Interchain Take offer spl swap test
    - Note : add the same orderID to define offerPda & other PDAs (or we can directly store PDAs in db and then use that to fetch data as we are doing here)

   --> what it does ?
    - it relayer will trasfer reqested amount from program to seller's solana address (interchain-origin-EVM-swap-buyer)

