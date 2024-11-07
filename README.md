# SmartBasket: Customizable Token Portfolio Manager on Neo X

# Things to do
- [X] Rebrand basket to portfolio
- [ ] Show better baskets indexes
- [ ] Display risk levels
   - [ ] volatility
- [ ] Analytics
   - [ ] amounts per risk levels (pie chart)
- [X] move sell to baskets list
- [X] Add perctange on basket creation
- [ ] percentages of money in basket
- [ ] 1 min balance refresh
- [ ] Alerts and management
   - [ ] +/-x % send alert (email, telegram)
   - [ ] Actions sell, add liquidity


## Hackathon Submission for Neo X Code Grinder Challenge

SmartBasket is an innovative DeFi project built on Neo X, leveraging the power of Neo's EVM-compatible sidechain to create a seamless and efficient token portfolio management experience. This project showcases the capabilities of Neo X in fostering an open, diverse ecosystem where developers can thrive in driving progress towards the Smart Economy.

### Project Overview

SmartBasket is a Solidity-based smart contract system that allows users to create and manage customizable token portfolios (baskets) using USDT as the base currency. The project implements a complete Uniswap V2 fork for token swaps and liquidity provision, demonstrating the full compatibility of Neo X with Ethereum tooling and complex DeFi infrastructure.

### Integration with Neo X

- The project leverages Neo X's EVM compatibility to deploy and interact with complex Solidity contracts
- Utilizes Neo X's high throughput for efficient token swaps and basket management
- Benefits from Neo X's dBFT consensus for secure and quick transaction finality
- Takes advantage of Neo X's MEV resistance for fair token pricing in Uniswap pools

### Key Components

1. **SmartBasket Contract**: The main contract that handles basket creation, management, and liquidation.
2. **ERC20 Tokens**: Various ERC20 tokens representing different cryptocurrencies and risk levels.
3. **Uniswap V2 Fork**: A complete implementation of Uniswap V2 core and periphery contracts, deployed on Neo X.

### Key Features

- Create customized token baskets with up to 5 different tokens
- Invest in baskets using USDT
- Sell baskets and receive USDT
- View basket total value and individual asset details
- Seamless integration with Neo X's high-performance EVM-based sidechain
- Leverages Neo X's dBFT consensus for enhanced security and one-block finality
- Toxic MEV resistant, ensuring a fairer environment for all DeFi participants
- Full Uniswap V2 functionality for efficient token swaps and liquidity provision

### Technical Implementation

1. **Smart Contracts**:
   - `SmartBasket.sol`: Main contract for basket management
   - `ERC20_BASE.sol`: Base ERC20 token implementation
   - Uniswap V2 Core Contracts:
     - `UniswapV2Factory.sol`: Creates and manages Uniswap pairs
     - `UniswapV2Pair.sol`: Implements the core swap and liquidity logic
   - Uniswap V2 Periphery Contracts:
     - `UniswapV2Router02.sol`: Handles routing for multi-hop swaps and provides a user-friendly interface

2. **Deployment Scripts**:
   - `deploy.ts`: A comprehensive script that handles the deployment of:
     - Uniswap V2 core contracts (Factory, Pair)
     - Uniswap V2 periphery contracts (Router)
     - USDT and other ERC20 tokens
     - Creation of Uniswap pairs and addition of initial liquidity
     - SmartBasket contract

### Workflow

1. **Deployment**:
   - Deploy Uniswap V2 core contracts (Factory, Pair templates)
   - Deploy Uniswap V2 periphery contracts (Router)
   - Deploy WNEO, USDT, and other ERC20 tokens
   - Create Uniswap pairs and add initial liquidity
   - Deploy SmartBasket contract

2. **Basket Creation**:
   - User approves USDT spending for the SmartBasket contract
   - User calls `createBasket` with token allocations and USDT amount
   - SmartBasket contract interacts with Uniswap Router to swap USDT for specified tokens

3. **Basket Management**:
   - Users can view basket details using `getBasketTotalValue` and `getBasketAssetDetails`
   - These functions interact with Uniswap pairs to get current token prices

4. **Basket Liquidation**:
   - User calls `sellBasket` to liquidate a basket
   - SmartBasket contract interacts with Uniswap Router to swap all tokens back to USDT and returns USDT to the user

### Setup and Deployment

1. Clone the repository
2. `cd Hardhat` and install dependencies: `npm install`
3. Compile `npx hardhat compile`
4. Start Node `npx hardhat node`
5. Deploy contracts: `DEPLOY_ALL=true npx hardhat run scripts/deploy.ts --network neoX`
   - __It is possible to deploy by parts as follows:__
   - DEPLOY_CORE: 
      - `DEPLOY_CORE=true npx hardhat run scripts/deploy.ts --network neoX`
   - DEPLOY_TOKENS:
      - `DEPLOY_TOKENS=true npx hardhat run scripts/deploy.ts --network neoX`
   - SETUP_PAIRS:
      - `SETUP_PAIRS=true npx hardhat run scripts/deploy.ts --network neoX`
   - DEPLOY_BASKET:
      - `DEPLOY_BASKET=true npx hardhat run scripts/deploy.ts --network neoX`
   - DEPLOY_ALL: 
      - `DEPLOY_ALL=true npx hardhat run scripts/deploy.ts --network neoX`
6. Run tests: `npx hardhat test --network localhost`

## Setup and Deployment for NextJS

1. `cd nextjs` and install dependencies: `npm install`
2. Start the project `npm run dev`
3. You should see the balances, if not check:
   - node running?
   - deploy script ran?
5. Get tokens `npx hardhat mint-tokens --address your_address_here --network localhost`
6. When re-fetching the balances you should see the values

## Notes for Developers

- The project uses Hardhat for development and testing
- Ensure you have sufficient ETH for gas fees when deploying to a testnet or mainnet

### Future Roadmap

1. Integrate with Neo N3 for expanded asset options using cross-chain bridges
2. Implement advanced portfolio rebalancing strategies using Neo X's unique features
3. Develop a user-friendly frontend for easy basket management
4. Explore integration with Neo X's native features for enhanced performance and interoperability

### Conclusion

SmartBasket, with its full Uniswap V2 fork implementation, demonstrates the power and flexibility of Neo X as a platform for complex DeFi applications. By leveraging Neo X's unique features and EVM compatibility, we've created a secure, efficient, and fair token portfolio management system that contributes to the growing ecosystem of the Smart Economy.

We're excited to be part of the Neo X community and look forward to further developing SmartBasket to showcase the full potential of this groundbreaking platform.