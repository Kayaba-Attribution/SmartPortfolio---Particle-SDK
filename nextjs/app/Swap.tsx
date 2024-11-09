import React, { useEffect, useState } from "react";
import addresses from "../contracts/addresses.json";
import ERC20ABI from "../contracts/artifacts/ERC20_BASE.json";
import RouterABI from "../contracts/artifacts/IUniswapV2Router02.json";
import { usePortfolioContext } from "./PortfolioContext";
import { useSmartAccountContext } from "../components/SmartAccountContext";
import { formatUnits, parseUnits } from "ethers";
import { encodeFunctionData } from "viem";
import { useReadContract } from "wagmi";

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const Swap: React.FC = () => {
  const [fromToken, setFromToken] = useState<string>(addresses.tokens.USDT);
  const [toToken, setToToken] = useState<string>(addresses.tokens.WBASE);
  const [amount, setAmount] = useState("");
  const [estimatedOutput, setEstimatedOutput] = useState("0");
  const [swapSuccess, setSwapSuccess] = useState(false);
  const [error, setError] = useState<string>("");
  const [isApproving, setIsApproving] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  const { setRefreshTokenBalances } = usePortfolioContext();
  const { smartAccountAddress: address, sendTransaction } = useSmartAccountContext();

  const routerAddress = addresses.core.Router as `0x${string}`;
  const tokenOptions = Object.entries(addresses.tokens).map(([name, address]) => ({ name, address }));

  // Read Contracts
  const { data: fromTokenBalance, refetch: refetchFromBalance } = useReadContract({
    address: fromToken as `0x${string}`,
    abi: ERC20ABI.abi,
    functionName: "balanceOf",
    args: [address],
  });

  const { data: toTokenBalance, refetch: refetchToBalance } = useReadContract({
    address: toToken as `0x${string}`,
    abi: ERC20ABI.abi,
    functionName: "balanceOf",
    args: [address],
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: fromToken as `0x${string}`,
    abi: ERC20ABI.abi,
    functionName: "allowance",
    args: [address, routerAddress],
  });

  const { data: estimatedAmountOut } = useReadContract({
    address: routerAddress,
    abi: RouterABI.abi,
    functionName: "getAmountsOut",
    args: amount ? [parseUnits(amount, 18), [fromToken, toToken]] : undefined,
  });

  // Formatting and validation
  const formatBalance = (balance: bigint | undefined) => {
    if (balance === undefined) return "Loading...";
    return formatUnits(balance, 18);
  };

  const isBalanceLoaded = fromTokenBalance !== undefined && toTokenBalance !== undefined;
  const isAmountValid = amount && parseFloat(amount) > 0;
  const needsApproval = allowance !== undefined && allowance !== null && isAmountValid && parseUnits(amount, 18) > (allowance as bigint);
  const hasSufficientBalance =
      fromTokenBalance !== undefined && fromTokenBalance !== null && isAmountValid && parseUnits(amount, 18) <= (fromTokenBalance as bigint);
  const isSwapDisabled = isApproving || isSwapping || !isAmountValid || !isBalanceLoaded || !hasSufficientBalance;

  // Effects
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

  // Clear messages after delay
  useEffect(() => {
    if (swapSuccess || error) {
      const timer = setTimeout(() => {
        setSwapSuccess(false);
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [swapSuccess, error]);

  // Handlers
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      setError("");

      const data = encodeFunctionData({
        abi: ERC20ABI.abi,
        functionName: "approve",
        args: [routerAddress, parseUnits(amount, 18)],
      });

      const hash = await sendTransaction({
        to: fromToken as `0x${string}`,
        data,
      });

      if (hash) {
        await refetchAllowance();
      }
    } catch (err: any) {
      console.error("Error approving tokens:", err);
      setError(err.message || "Failed to approve tokens");
    } finally {
      setIsApproving(false);
    }
  };

  const handleSwap = async () => {
    if (!amount || !fromToken || !toToken || !address) return;

    try {
      setIsSwapping(true);
      setError("");

      const amountIn = parseUnits(amount, 18);
      const minAmountOut = (parseUnits(estimatedOutput, 18) * BigInt(95)) / BigInt(100); // 5% slippage

      if (needsApproval) {
        await handleApprove();
      }

      const data = encodeFunctionData({
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

      const hash = await sendTransaction({
        to: routerAddress,
        data,
      });

      if (hash) {
        setSwapSuccess(true);
        await Promise.all([refetchFromBalance(), refetchToBalance()]);
        setRefreshTokenBalances(true);
        setAmount("");
      }
    } catch (err: any) {
      console.error("Error swapping tokens:", err);
      setError(err.message || "Failed to swap tokens");
    } finally {
      setIsSwapping(false);
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
      <h2 className="card-title mb-4">Swap Tokens (Gasless)</h2>

      {error && (
        <div className="alert alert-error mb-4">
          <p>{error}</p>
        </div>
      )}

      <div className="form-control">
        <label className="label">
          <span className="label-text">From</span>
        </label>
        <select
          className="select select-bordered w-full"
          value={fromToken}
          onChange={e => setFromToken(e.target.value)}
          disabled={isApproving || isSwapping}
        >
          {tokenOptions.map(token => (
            <option key={token.address} value={token.address}>
              {token.name}
            </option>
          ))}
        </select>
        <p className="text-sm mt-1">Balance: {formatBalance(fromTokenBalance as bigint | undefined)}</p>
      </div>

      <div className="form-control mt-4">
        <label className="label">
          <span className="label-text">To</span>
        </label>
        <select
          className="select select-bordered w-full"
          value={toToken}
          onChange={e => setToToken(e.target.value)}
          disabled={isApproving || isSwapping}
        >
          {tokenOptions.map(token => (
            <option key={token.address} value={token.address}>
              {token.name}
            </option>
          ))}
        </select>
        <p className="text-sm mt-1">Balance: {formatBalance(toTokenBalance as bigint | undefined)}</p>
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
          disabled={isApproving || isSwapping}
        />
      </div>

      <div className="mt-4">
        <p>Estimated output: {estimatedOutput}</p>
      </div>

      <button className={`btn btn-primary mt-4`} onClick={handleSwap} disabled={isSwapDisabled}>
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
