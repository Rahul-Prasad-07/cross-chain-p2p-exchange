PS H:\Rahul Prasad 01\Dex\DEX\evm-p2p-contracts> yarn hardhat run Scripts/Deploy.ts --network sepolia
yarn run v1.22.22
warning ..\..\..\package.json: No license field
$ "H:\Rahul Prasad 01\Dex\DEX\evm-p2p-contracts\node_modules\.bin\hardhat" run Scripts/Deploy.ts --network sepolia
[dotenv@17.2.1] injecting env (3) from .env -- tip: 📡 version env with Radar: https://dotenvx.com/radar
[dotenv@17.2.1] injecting env (0) from .env -- tip: ⚙️  write to custom object with { processEnv: myObject }
Deploying contracts with the signer:
Deploying contracts with the account: 0xc629Fa8B87AD97E92C448E56Df9d979E1D1f441f
storageOracle address:  0x6d1F2b2542C69149b4c511E4858Cefb4D1B77F87
p2pInterchain address:  0x11bAdda1c7BE8A68913BCEDb2B3Dbc228978f6A8
p2pIntrachain address:  0xd05251C93103D711f5dde93C4691C9923f2F4d29
Constant fee set to 1 for both contracts.
Deploying contracts with the signer:
Deploying contracts with the account: 0xc629Fa8B87AD97E92C448E56Df9d979E1D1f441f
storageOracle address:  0x6d1F2b2542C69149b4c511E4858Cefb4D1B77F87
p2pInterchain address:  0x11bAdda1c7BE8A68913BCEDb2B3Dbc228978f6A8
Deploying contracts with the signer:
Deploying contracts with the account: 0xc629Fa8B87AD97E92C448E56Df9d979E1D1f441f
storageOracle address:  0x6d1F2b2542C69149b4c511E4858Cefb4D1B77F87
p2pInterchain address:  0x11bAdda1c7BE8A68913BCEDb2B3Dbc228978f6A8
p2pInterchain address:  0x11bAdda1c7BE8A68913BCEDb2B3Dbc228978f6A8
p2pInterchain address:  0x11bAdda1c7BE8A68913BCEDb2B3Dbc228978f6A8
p2pIntrachain address:  0xd05251C93103D711f5dde93C4691C9923f2F4d29
p2pInterchain address:  0x11bAdda1c7BE8A68913BCEDb2B3Dbc228978f6A8
p2pIntrachain address:  0xd05251C93103D711f5dde93C4691C9923f2F4d29
Constant fee set to 1 for both contracts.
Null address set as "NATIVE" at index 0 for both contracts.
USDT and USDC set for this network.
token address at index 1:  0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
Name of the token at index 2:
USDT and USDC set for this network.
token address at index 1:  0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
Name of the token at index 2:
token address at index 1:  0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
Name of the token at index 2:
Name of the token at index 2:
p2pInterchain address:  0x11bAdda1c7BE8A68913BCEDb2B3Dbc228978f6A8
p2pIntrachain address:  0xd05251C93103D711f5dde93C4691C9923f2F4d29
storageOracle address:  0x6d1F2b2542C69149b4c511E4858Cefb4D1B77F87
Done in 30.06s.
PS H:\Rahul Prasad 01\Dex\DEX\evm-p2p-contracts>








----------------------------------------------------


PS H:\Rahul Prasad 01\Dex\DEX\evm-p2p-contracts\Scripts> npx ts-node eventListoner.ts
📜 Fetching events from block 11551130 to 11551629
📜 Fetching events from block 11551630 to 11552129
📜 Fetching events from block 11552130 to 11552629
📜 Fetching events from block 11552630 to 11553129
📜 Fetching events from block 11553130 to 11553130
🕑 Past Event #1:
  id:                0x2b5e419f856ba2a708af35bcbd8df4520ecae1f11fddf8d1ba7cd0392eb38343
  seller:            0xc629Fa8B87AD97E92C448E56Df9d979E1D1f441f
  sellerGiveTokenIdx:0
  pairChains:        0x00000001
  endtime:           1001755160654
  DepositValue:      100000000000000
  AvailableValue:    100000000000000
  feeAmount:         0
  solanaAddress:     AT7A6dih5biJhbm6RbfvphwqP9Cf7Fmnsjr744nPdQns
  tokenBWantedAmount:50000000
----------------------------------------
🕑 Past Event #2:
  id:                0xee700f644415159944608fe362619097548e2d1d7594c5cc916c9ceea73dcbee
  seller:            0xc629Fa8B87AD97E92C448E56Df9d979E1D1f441f
  sellerGiveTokenIdx:0
  pairChains:        0x00000001
  endtime:           1001755162474
  DepositValue:      100000000000000
  AvailableValue:    100000000000000
  feeAmount:         0
  solanaAddress:     AT7A6dih5biJhbm6RbfvphwqP9Cf7Fmnsjr744nPdQns
  solanaAddress:     AT7A6dih5biJhbm6RbfvphwqP9Cf7Fmnsjr744nPdQns
  tokenBWantedAmount:50000000
----------------------------------------
👂 Listening for new TradeCreated events...
🚨 New TradeCreated Event:
  id:                0x2f730a32ab0ae30cf6c593729b10198f26338a9e66f32f01e63cd209d97820d7
  seller:            0xc629Fa8B87AD97E92C448E56Df9d979E1D1f441f
  sellerGiveTokenIdx:0
  pairChains:        0x00000001
  endtime:           1001755163034
  DepositValue:      41000000000000
  AvailableValue:    41000000000000
  feeAmount:         0
  solanaAddress:     AT7A6dih5biJhbm6RbfvphwqP9Cf7Fmnsjr744nPdQns
  tokenBWantedAmount:60000000
  solanaAddress:     AT7A6dih5biJhbm6RbfvphwqP9Cf7Fmnsjr744nPdQns
  tokenBWantedAmount:50000000
----------------------------------------
👂 Listening for new TradeCreated events...
🚨 New TradeCreated Event:
  id:                0x2f730a32ab0ae30cf6c593729b10198f26338a9e66f32f01e63cd209d97820d7
  seller:            0xc629Fa8B87AD97E92C448E56Df9d979E1D1f441f
  sellerGiveTokenIdx:0
  pairChains:        0x00000001
  endtime:           1001755163034
  DepositValue:      41000000000000
  AvailableValue:    41000000000000
  feeAmount:         0
  solanaAddress:     AT7A6dih5biJhbm6RbfvphwqP9Cf7Fmnsjr744nPdQns
  solanaAddress:     AT7A6dih5biJhbm6RbfvphwqP9Cf7Fmnsjr744nPdQns
  tokenBWantedAmount:50000000
----------------------------------------
👂 Listening for new TradeCreated events...
🚨 New TradeCreated Event:
  id:                0x2f730a32ab0ae30cf6c593729b10198f26338a9e66f32f01e63cd209d97820d7
  seller:            0xc629Fa8B87AD97E92C448E56Df9d979E1D1f441f
  sellerGiveTokenIdx:0
  pairChains:        0x00000001
  endtime:           1001755163034
  DepositValue:      41000000000000
  AvailableValue:    41000000000000
  solanaAddress:     AT7A6dih5biJhbm6RbfvphwqP9Cf7Fmnsjr744nPdQns
  tokenBWantedAmount:50000000
----------------------------------------
👂 Listening for new TradeCreated events...
🚨 New TradeCreated Event:
  id:                0x2f730a32ab0ae30cf6c593729b10198f26338a9e66f32f01e63cd209d97820d7
  seller:            0xc629Fa8B87AD97E92C448E56Df9d979E1D1f441f
  sellerGiveTokenIdx:0
  pairChains:        0x00000001
  solanaAddress:     AT7A6dih5biJhbm6RbfvphwqP9Cf7Fmnsjr744nPdQns
  tokenBWantedAmount:50000000
----------------------------------------
👂 Listening for new TradeCreated events...
🚨 New TradeCreated Event:
  solanaAddress:     AT7A6dih5biJhbm6RbfvphwqP9Cf7Fmnsjr744nPdQns
  tokenBWantedAmount:50000000
----------------------------------------
👂 Listening for new TradeCreated events...
🚨 New TradeCreated Event:
  solanaAddress:     AT7A6dih5biJhbm6RbfvphwqP9Cf7Fmnsjr744nPdQns
  tokenBWantedAmount:50000000
  solanaAddress:     AT7A6dih5biJhbm6RbfvphwqP9Cf7Fmnsjr744nPdQns
  tokenBWantedAmount:50000000
----------------------------------------
  solanaAddress:     AT7A6dih5biJhbm6RbfvphwqP9Cf7Fmnsjr744nPdQns
  tokenBWantedAmount:50000000
----------------------------------------
  solanaAddress:     AT7A6dih5biJhbm6RbfvphwqP9Cf7Fmnsjr744nPdQns
  tokenBWantedAmount:50000000
----------------------------------------
  solanaAddress:     AT7A6dih5biJhbm6RbfvphwqP9Cf7Fmnsjr744nPdQns
  tokenBWantedAmount:50000000
----------------------------------------
👂 Listening for new TradeCreated events...
🚨 New TradeCreated Event:
  id:                0x2f730a32ab0ae30cf6c593729b10198f26338a9e66f32f01e63cd209d97820d7
  id:                0x2f730a32ab0ae30cf6c593729b10198f26338a9e66f32f01e63cd209d97820d7
  seller:            0xc629Fa8B87AD97E92C448E56Df9d979E1D1f441f
  sellerGiveTokenIdx:0
  pairChains:        0x00000001
  endtime:           1001755163034
  DepositValue:      41000000000000
  AvailableValue:    41000000000000
  feeAmount:         0
  solanaAddress:     AT7A6dih5biJhbm6RbfvphwqP9Cf7Fmnsjr744nPdQns
  tokenBWantedAmount:60000000
----------------------------------------
  seller:            0xc629Fa8B87AD97E92C448E56Df9d979E1D1f441f
  sellerGiveTokenIdx:0
  pairChains:        0x00000001
  endtime:           1001755163034
  DepositValue:      41000000000000
  AvailableValue:    41000000000000
  feeAmount:         0
  solanaAddress:     AT7A6dih5biJhbm6RbfvphwqP9Cf7Fmnsjr744nPdQns
  tokenBWantedAmount:60000000
----------------------------------------
🚨 New TradeCreated Event:
  tokenBWantedAmount:60000000
----------------------------------------
🚨 New TradeCreated Event:
  id:                0x0e6dee11c4c93c4ef72374ffd1e9b73433fde3fe6df25e2222ac6543734e0294
  seller:            0xc629Fa8B87AD97E92C448E56Df9d979E1D1f441f
  sellerGiveTokenIdx:0
  pairChains:        0x00000001
  endtime:           1001755164564
  DepositValue:      41000000000000
  AvailableValue:    41000000000000
  feeAmount:         0
  solanaAddress:     AT7A6dih5biJhbm6RbfvphwqP9Cf7Fmnsjr744nPdQns
  tokenBWantedAmount:60000000
----------------------------------------
PS H:\Rahul Prasad 01\Dex\DEX\evm-p2p-contracts\Scripts>































