# 🌟 SmartPortfolio: Empowering Everyone's Crypto Journey

> Empowering non-technical users to easily and safely invest in diversified cryptocurrency portfolios through social login and gasless transactions.

## 🏆 Chain Abstraction Hackathon Submission

SmartPortfolio showcases the power of Particle Network's Wallet and Account Abstraction, allowing anyone to start investing in crypto without dealing with seed phrases, gas fees, or complex wallet setups. Built on Base Sepolia, it demonstrates how modern Web3 infrastructure can deliver Web2-like experiences.

### Project Overview
SmartPortfolio solves the fundamental problem of DeFi accessibility. Most portfolio management tools require deep crypto knowledge, managing gas fees, and complex wallet interactions. We've eliminated these barriers by combining:

- Social logins instead of seed phrases
- Gasless transactions through AA
- Simple templates for different risk appetites
- Visual performance tracking

### Live Demo
- **Main CA Base Sepolia Testnet**: 0xb6034113bE40efe1da3Ad02FA0633E101C697b4d
- **Video Demo**: [Link]
- **Live Site**: https://smart-portfolio-particle-c3vybmqwx.vercel.app/

## 🚀 Features

- **One-Click Social Login**: Email, Google, or Twitter login via Particle Connect
- **Gasless Portfolio Management**:
  - Custom portfolios with up to 5 tokens
  - Risk-based templates
  - Real-time valuation
  - One-click liquidation
- **Analytics**:
  - Individual portfolio performance
  - Total value tracking
  - ROI calculations

## 🔧 Technical Stack

### Particle Network Integration
- **Particle Connect**: Social login & wallet management
- **Account Abstraction**: 
  - Gasless transactions
  - Smart account management
  - Complete UX abstraction

### Smart Contracts (Base Sepolia)
```json
{
  "core": {
    "Factory": "0x7Ae58f10f7849cA6F5fB71b7f45CB416c9204b1e",
    "Router": "0x1689E7B1F10000AE47eBfE339a4f69dECd19F602",
    "WETH": "0x1689E7B1F10000AE47eBfE339a4f69dECd19F602",
    "SmartPortfolio": "0xb6034113bE40efe1da3Ad02FA0633E101C697b4d"
  },
  "tokens": {
    "USDT": "0xCE8565457Cca0fC7542608A2c78610Ed7bC66C8C",
    "WBASE": "0x18074b17FC0ab1DeC4CC11C8146441Ccd0A3AD80",
    "WBTC": "0x02c405e69eDdcE2aD1F152488014a930A4e426Ef",
    "XRP": "0x6ee8befc4eF69E96649035817735FCa8De206968",
    "UNI": "0xbA0314608eC9491040ec5Cb56BA4C85AB994F797",
    "LINK": "0xf868c066b217392c370607141B83f1b6eDecc976",
    "DOGE": "0xC559d1fD27f47e06433f66a2B3aD91195b6a6ee6",
    "SHIB": "0xc2EE73aeAC66cE265a197A8F674fD1b367E471A1",
    "PEPE": "0x1A906f6C8ee5843Ed50D112967a8e33aB0778b7E",
    "FLOKI": "0xBE4f8607ed2Fa1f92929512f61bE4453B3E7ba0B"
  }
}
```

## 🔍 Core Components

1. **Authentication**
   - Social login without seed phrases
   - Automatic wallet creation
   - Persistent sessions

2. **Portfolio System**
   - Custom allocation system
   - Risk-based templates
   - Real-time monitoring

3. **Analytics**
   - Performance tracking
   - Price trend visualization

## 🗺️ Roadmap

- Enhanced Analytics
  - Volatility metrics
  - Risk indicators
- Portfolio Alerts
  - Price notifications
  - Auto-rebalancing
- Social Features
  - Portfolio sharing
  - Investment templates



### Key Components

1. **SmartPortfolio Contract**: The main contract that handles basket creation, management, and liquidation.
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
   - `SmartPortfolio.sol`: Main contract for basket management
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
     - SmartPortfolio contract

### Workflow

1. **Deployment**:
   - Deploy Uniswap V2 core contracts (Factory, Pair templates)
   - Deploy Uniswap V2 periphery contracts (Router)
   - Deploy WBASE, USDT, and other ERC20 tokens
   - Create Uniswap pairs and add initial liquidity
   - Deploy SmartPortfolio contract

2. **Basket Creation**:
   - User approves USDT spending for the SmartPortfolio contract
   - User calls `createBasket` with token allocations and USDT amount
   - SmartPortfolio contract interacts with Uniswap Router to swap USDT for specified tokens

3. **Basket Management**:
   - Users can view basket details using `getBasketTotalValue` and `getBasketAssetDetails`
   - These functions interact with Uniswap pairs to get current token prices

4. **Basket Liquidation**:
   - User calls `sellBasket` to liquidate a basket
   - SmartPortfolio contract interacts with Uniswap Router to swap all tokens back to USDT and returns USDT to the user

### Setup and Deployment

1. Clone the repository
2. `cd Hardhat` and install dependencies: `npm install`
3. Compile `npx hardhat compile`
4. Start Node `npx hardhat node`
5. Deploy contracts: `DEPLOY_ALL=true npx hardhat run scripts/deploy.ts --network baseSepolia`
   - __It is possible to deploy by parts as follows:__
   - DEPLOY_CORE: 
      - `DEPLOY_CORE=true npx hardhat run scripts/deploy.ts --network baseSepolia`
   - DEPLOY_TOKENS:
      - `DEPLOY_TOKENS=true npx hardhat run scripts/deploy.ts --network baseSepolia`
   - SETUP_PAIRS:
      - `SETUP_PAIRS=true npx hardhat run scripts/deploy.ts --network baseSepolia`
   - DEPLOY_BASKET:
      - `DEPLOY_BASKET=true npx hardhat run scripts/deploy.ts --network baseSepolia`
   - DEPLOY_ALL: 
      - `DEPLOY_ALL=true npx hardhat run scripts/deploy.ts --network baseSepolia`
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

1. Enhance Account Abstraction features:
   - Implement session keys for automatic portfolio rebalancing
   - Add batched transactions for complex portfolio operations
   - Deploy modular paymaster strategies for optimized gas sponsorship

2. Expand Particle Network integration:
   - Implement cross-chain portfolio management using Particle's Chain Abstraction
   - Add Web3Social features for portfolio sharing and social discovery

3. Advanced Portfolio Features:
   - Automated risk assessment and rebalancing
   - DeFi yield strategies integration
   - Cross-chain asset management

4. Enhanced User Experience:
   - Mobile-first interface optimization
   - Push notifications through Particle's infrastructure
   - Advanced analytics and reporting tools

### Conclusion

SmartPortfolio showcases how Particle Network's Account Abstraction and social login capabilities can revolutionize DeFi accessibility. By leveraging Particle's comprehensive stack, we've transformed complex portfolio management into a seamless experience that feels as familiar as traditional finance apps.

The combination of gasless transactions, social authentication, and smart accounts demonstrates that DeFi doesn't need to be complicated. We're excited to continue building on Particle Network's infrastructure, making crypto investing accessible to everyone, regardless of their technical expertise.
