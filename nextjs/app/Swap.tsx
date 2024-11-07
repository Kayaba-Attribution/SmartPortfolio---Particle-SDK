import React, { useEffect, useState } from "react";
import addresses from "../contracts/addresses.json";
import ERC20ABI from "../contracts/artifacts/ERC20_BASE.json";
import RouterABI from "../contracts/artifacts/IUniswapV2Router02.json";
import { usePortfolioContext } from "./PortfolioContext";
import { formatUnits, parseUnits } from "ethers";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

const bigIntToString = (value: any): string => {
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map(bigIntToString) as any;
  }
  return value;
};

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const Swap: React.FC = () => {
  const [fromToken, setFromToken] = useState<string>(addresses.tokens.USDT);
  const [toToken, setToToken] = useState<string>(addresses.tokens.WNEO);
  const [amount, setAmount] = useState("");
  const [estimatedOutput, setEstimatedOutput] = useState("0");
  const [swapSuccess, setSwapSuccess] = useState(false);
  const { setRefreshTokenBalances } = usePortfolioContext();

  const { address } = useAccount();
  const routerAddress = addresses.core.Router;

  const tokenOptions = Object.entries(addresses.tokens).map(([name, address]) => ({ name, address }));

  const { data: fromTokenBalance, refetch: refetchFromBalance } = useReadContract({
    address: fromToken as `0x${string}`,
    abi: ERC20ABI.abi,
    functionName: "balanceOf",
    args: [address],
  }) as { data: bigint; refetch: () => void };

  const { data: toTokenBalance, refetch: refetchToBalance } = useReadContract({
    address: toToken as `0x${string}`,
    abi: ERC20ABI.abi,
    functionName: "balanceOf",
    args: [address],
  }) as { data: bigint; refetch: () => void };

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: fromToken as `0x${string}`,
    abi: ERC20ABI.abi,
    functionName: "allowance",
    args: [address, routerAddress],
  }) as { data: bigint; refetch: () => void };

  const { writeContract: approveTokens, data: approveData } = useWriteContract();

  const { isLoading: isApproving, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveData,
  });

  const { writeContract: performSwap, data: swapData } = useWriteContract();

  const { isLoading: isSwapping, isSuccess: isSwapSuccess } = useWaitForTransactionReceipt({
    hash: swapData,
  });

  const { data: estimatedAmountOut } = useReadContract({
    address: routerAddress as `0x${string}`,
    abi: RouterABI.abi,
    functionName: "getAmountsOut",
    args: amount ? [parseUnits(amount, 18), [fromToken, toToken]] : undefined,
  }) as { data: any };

  const fromTokenBalanceStr = bigIntToString(fromTokenBalance);
  const toTokenBalanceStr = bigIntToString(toTokenBalance);
  const allowanceStr = bigIntToString(allowance);
  const estimatedAmountOutStr = bigIntToString(estimatedAmountOut);

  // console.log("fromTokenBalance:", fromTokenBalanceStr);
  // console.log("toTokenBalance:", toTokenBalanceStr);
  // console.log("allowance:", allowanceStr);
  // console.log("estimatedAmountOut:", estimatedAmountOutStr);

  const formatBalance = (balance: bigint | undefined) => {
    if (balance === undefined) return "Loading...";
    return formatUnits(balance, 18);
  };

  const isBalanceLoaded = fromTokenBalance !== undefined && toTokenBalance !== undefined;
  const isAmountValid = amount && parseFloat(amount) > 0;

  const needsApproval = allowance !== undefined && isAmountValid && parseUnits(amount, 18) > allowance;

  const hasSufficientBalance =
    fromTokenBalance !== undefined && isAmountValid && parseUnits(amount, 18) <= fromTokenBalance;

  const canSwap = isBalanceLoaded && isAmountValid && hasSufficientBalance && !needsApproval;

  const isSwapDisabled = isApproving || isSwapping || !isAmountValid || !isBalanceLoaded || !hasSufficientBalance;

  useEffect(() => {
    if (estimatedAmountOut && Array.isArray(estimatedAmountOut) && estimatedAmountOut.length > 1) {
      try {
        const formattedOutput = formatUnits(estimatedAmountOut[1] as bigint, 18);
        setEstimatedOutput(formattedOutput);
      } catch (error) {
        console.error("Error formatting estimatedAmountOut:", error);
      }
    }
  }, [estimatedAmountOut]);

  useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance();
    }
    if (isSwapSuccess) {
      refetchFromBalance();
      refetchToBalance();
      setSwapSuccess(true);
      setRefreshTokenBalances(true);
      setTimeout(() => setSwapSuccess(false), 1000);
    }
  }, [
    isApproveSuccess,
    isSwapSuccess,
    refetchAllowance,
    refetchFromBalance,
    refetchToBalance,
    setRefreshTokenBalances,
  ]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    setAmount(newAmount);
  };

  const handleSwap = async () => {
    if (!amount || !fromToken || !toToken || !address) return;

    const amountIn = parseUnits(amount, 18);
    const minAmountOut = (parseUnits(estimatedOutput, 18) * BigInt(95)) / BigInt(100); // 5% slippage

    if (needsApproval) {
      approveTokens({
        address: fromToken as `0x${string}`,
        abi: ERC20ABI.abi,
        functionName: "approve",
        args: [routerAddress, amountIn],
      });
    } else {
      performSwap({
        address: routerAddress as `0x${string}`,
        abi: RouterABI.abi,
        functionName: "swapExactTokensForTokens",
        args: [
          amountIn,
          minAmountOut,
          [fromToken, toToken],
          address,
          BigInt(Math.floor(Date.now() / 1000) + 60 * 20), // 20 minutes from now
        ],
      });
    }
  };

  const getButtonText = () => {
    if (isApproving) return "Approving...";
    if (isSwapping) return "Swapping...";
    if (needsApproval) return "Approve";
    return "Swap";
  };

  return (
    <div className="card bg-base-200 shadow-xl p-6">
      <h2 className="card-title mb-4">Swap Tokens</h2>
      <div className="form-control">
        <label className="label">
          <span className="label-text">From</span>
        </label>
        <select
          className="select select-bordered w-full"
          value={fromToken}
          onChange={e => setFromToken(e.target.value)}
        >
          {tokenOptions.map(token => (
            <option key={token.address} value={token.address}>
              {token.name}
            </option>
          ))}
        </select>
        <p className="text-sm mt-1">Balance: {formatBalance(fromTokenBalance)}</p>
      </div>
      <div className="form-control mt-4">
        <label className="label">
          <span className="label-text">To</span>
        </label>
        <select className="select select-bordered w-full" value={toToken} onChange={e => setToToken(e.target.value)}>
          {tokenOptions.map(token => (
            <option key={token.address} value={token.address}>
              {token.name}
            </option>
          ))}
        </select>
        <p className="text-sm mt-1">Balance: {formatBalance(toTokenBalance)}</p>
      </div>
      <div className="form-control mt-4">
        <label className="label">
          <span className="label-text">Amount</span>
        </label>
        <input
          type="text"
          placeholder="Enter amount"
          className="input input-bordered w-full"
          value={amount}
          onChange={handleAmountChange}
        />
      </div>
      <div className="mt-4">
        <p>Estimated output: {estimatedOutput}</p>
      </div>
      <button
        className={`btn btn-primary mt-4 ${isApproving || isSwapping ? "loading" : ""}`}
        onClick={handleSwap}
        disabled={isSwapDisabled}
      >
        {getButtonText()}
      </button>
      {(isApproving || isSwapping) && (
        <div className="mt-4 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">{isApproving ? "Approving..." : "Swapping..."}</span>
        </div>
      )}
      {swapSuccess && (
        <div className="mt-4 p-4 bg-success text-success-content rounded-lg text-center">
          Swap completed successfully!
        </div>
      )}
    </div>
  );
};

export default Swap;
