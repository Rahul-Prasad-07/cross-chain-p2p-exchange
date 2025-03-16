#### Test Flow 

--> Add your keyPairs

--> token mint address

### Intrachain

- intrachain-seller 

    --> Deposit raw SOL (native) & Deposit SPL Tokens (non-native)
     - add req params

- intrachain-swap-buyer 

    --> take offer native test & take offer spl test
    
    - option-1 : add the same orderID to define offerPda & other needed PDA (or we can directly store PDAs in db and then fetch data)


### Interchain

- interchain-origin-SOL-seller

    --> Deposit interchain raw SOL (native) where seller originated on Solana & Deposit Interchain SPL Tokens (non-native) where seller originated on Solana
     - add req params : amounts, address (EVM, Solana)..etc

- interchain-origin-SOL-swap-buyer 

    --> Interchain Origin Sol Take Offer native swap test & Interchain Origin Sol Take Offer spl swap test
    
    - Note : add the same orderID to define offerPda & other PDAs (or we can directly store PDAs in db and then use that to fetch data as we are doing here)


- interchain-origin-EVM-seller

  ==> called relay Fns : store PDA address or OfferID to define PDAs

  - interchain-native-relay-data
  - interchain-spl-relay-data

   --> Deposit interchain raw SOL (native) & Deposit Interchain SPL Tokens (non-native)
    - add req params : amounts,address(evm,solana)..etc
    - Note : add the same orderID to define offerPda & other PDAs (or we can directly store PDAs in db and then use that to fetch data as we are doing here)

- interchain-origin-EVM-swap-buyer 

   --> Interchain Take offer native swap test & Interchain Take offer spl swap test
    - Note : add the same orderID to define offerPda & other PDAs (or we can directly store PDAs in db and then use that to fetch data as we are doing here)

