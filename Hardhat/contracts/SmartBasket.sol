// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

contract SmartBasket is Ownable {
    IUniswapV2Router02 public uniswapRouter;
    IERC20 public usdtToken;

    struct TokenAllocation {
        address tokenAddress;
        uint256 percentage;
        uint256 amount;
    }

    struct Basket {
        TokenAllocation[5] allocations;
        uint256 tokenCount;
        uint256 investmentValue;
    }

    mapping(address => Basket[]) public userBaskets;

    event BasketCreated(
        address indexed user,
        uint256 basketIndex,
        uint256 usdtAmount
    );
    event BasketSold(
        address indexed user,
        uint256 basketIndex,
        uint256 usdtReturned
    );

    constructor(address _uniswapRouter, address _usdtAddress) {
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
        usdtToken = IERC20(_usdtAddress);
    }

    function createBasket(
        TokenAllocation[] memory _allocations,
        uint256 _usdtAmount
    ) external {
        require(
            _allocations.length > 0 && _allocations.length <= 5,
            "Invalid number of tokens"
        );
        require(_usdtAmount > 0, "Must send USDT");

        uint256 totalPercentage = 0;
        Basket storage newBasket = userBaskets[msg.sender].push();

        for (uint i = 0; i < _allocations.length; i++) {
            newBasket.allocations[i].tokenAddress = _allocations[i]
                .tokenAddress;
            newBasket.allocations[i].percentage = _allocations[i].percentage;
            totalPercentage += _allocations[i].percentage;
        }

        require(totalPercentage == 100, "Total percentage must be 100");

        newBasket.tokenCount = _allocations.length;
        newBasket.investmentValue = _usdtAmount;

        bool success = usdtToken.transferFrom(
            msg.sender,
            address(this),
            _usdtAmount
        );
        require(success, "Failed to transfer USDT");
        _investInBasket(newBasket, _usdtAmount);

        emit BasketCreated(
            msg.sender,
            userBaskets[msg.sender].length - 1,
            _usdtAmount
        );
    }
    function sellBasket(uint256 basketIndex) external {
        require(
            basketIndex < userBaskets[msg.sender].length,
            "Invalid basket index"
        );

        Basket storage basket = userBaskets[msg.sender][basketIndex];
        uint256 usdtReturned = 0;

        for (uint i = 0; i < basket.tokenCount; i++) {
            address tokenAddress = basket.allocations[i].tokenAddress;
            uint256 tokenBalance = IERC20(tokenAddress).balanceOf(
                address(this)
            );
            if (tokenBalance > 0) {
                usdtReturned += _swapTokensForUsdt(tokenAddress, tokenBalance);
            }
        }

        usdtToken.transfer(msg.sender, usdtReturned);

        // Remove the basket
        if (basketIndex < userBaskets[msg.sender].length - 1) {
            userBaskets[msg.sender][basketIndex] = userBaskets[msg.sender][
                userBaskets[msg.sender].length - 1
            ];
        }
        userBaskets[msg.sender].pop();

        emit BasketSold(msg.sender, basketIndex, usdtReturned);
    }

    function _investInBasket(
        Basket storage basket,
        uint256 usdtAmount
    ) internal {
        for (uint i = 0; i < basket.tokenCount; i++) {
            TokenAllocation storage allocation = basket.allocations[i];
            uint256 usdtForToken = (usdtAmount * allocation.percentage) / 100;
            uint256 tokensBought = _swapUsdtForTokens(
                allocation.tokenAddress,
                usdtForToken
            );
            allocation.amount = tokensBought; // Store the amount of tokens bought
        }
    }
    function _swapUsdtForTokens(
        address tokenAddress,
        uint256 usdtAmount
    ) internal returns (uint256) {
        usdtToken.approve(address(uniswapRouter), usdtAmount);

        address[] memory path = new address[](2);
        path[0] = address(usdtToken);
        path[1] = tokenAddress;

        uint[] memory amounts = uniswapRouter.swapExactTokensForTokens(
            usdtAmount,
            0,
            path,
            address(this),
            block.timestamp
        );

        return amounts[1]; // Return the amount of tokens received
    }
    function _swapTokensForUsdt(
        address tokenAddress,
        uint256 tokenAmount
    ) internal returns (uint256) {
        IERC20(tokenAddress).approve(address(uniswapRouter), tokenAmount);

        address[] memory path = new address[](2);
        path[0] = tokenAddress;
        path[1] = address(usdtToken);

        uint[] memory amounts = uniswapRouter.swapExactTokensForTokens(
            tokenAmount,
            0,
            path,
            address(this),
            block.timestamp
        );

        return amounts[1]; // Return the amount of USDT received
    }

    function getUserBaskets(
        address user
    ) external view returns (Basket[] memory) {
        return userBaskets[user];
    }

    function getBasketTotalValue(
        address user,
        uint256 basketIndex
    ) public view returns (uint256) {
        require(basketIndex < userBaskets[user].length, "Invalid basket index");
        Basket storage basket = userBaskets[user][basketIndex];
        uint256 totalValue = 0;

        for (uint i = 0; i < basket.tokenCount; i++) {
            TokenAllocation storage allocation = basket.allocations[i];
            totalValue += getEstimatedUsdtValue(
                allocation.tokenAddress,
                allocation.amount
            );
        }

        return totalValue;
    }

    function getBasketAssetDetails(
        address user,
        uint256 basketIndex
    )
        public
        view
        returns (
            address[] memory,
            uint256[] memory,
            uint256[] memory,
            uint256[] memory
        )
    {
        require(basketIndex < userBaskets[user].length, "Invalid basket index");
        Basket storage basket = userBaskets[user][basketIndex];

        address[] memory tokenAddresses = new address[](basket.tokenCount);
        uint256[] memory tokenPercentages = new uint256[](basket.tokenCount);
        uint256[] memory tokenAmounts = new uint256[](basket.tokenCount);
        uint256[] memory tokenValues = new uint256[](basket.tokenCount);

        for (uint i = 0; i < basket.tokenCount; i++) {
            TokenAllocation storage allocation = basket.allocations[i];
            tokenAddresses[i] = allocation.tokenAddress;
            tokenPercentages[i] = allocation.percentage;
            tokenAmounts[i] = allocation.amount;
            tokenValues[i] = getEstimatedUsdtValue(
                allocation.tokenAddress,
                allocation.amount
            );
        }

        return (tokenAddresses, tokenPercentages, tokenAmounts, tokenValues);
    }

    function getEstimatedUsdtValue(
        address tokenAddress,
        uint256 tokenAmount
    ) internal view returns (uint256) {
        if (tokenAddress == address(usdtToken)) {
            return tokenAmount;
        }

        address[] memory path = new address[](2);
        path[0] = tokenAddress;
        path[1] = address(usdtToken);

        uint256[] memory amounts = uniswapRouter.getAmountsOut(
            tokenAmount,
            path
        );
        return amounts[1];
    }
}
