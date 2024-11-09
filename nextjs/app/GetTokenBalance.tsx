/* eslint-disable prettier/prettier */
import React, { useEffect } from "react";
import TokenABI from "../contracts/artifacts/ERC20_BASE.json";
import { usePortfolioContext } from "./PortfolioContext";
import { useSmartAccountContext } from "../components/SmartAccountContext";
import { formatEther } from "ethers";
import { RefreshCw } from "lucide-react";
import { useReadContract } from "wagmi";

interface GetTokenBalanceProps {
  contractAddress: `0x${string}`;
  userAddress: `0x${string}`;
  contractName: string;
}

const GetTokenBalance: React.FC<GetTokenBalanceProps> = ({ contractAddress, userAddress, contractName }) => {
  const { smartAccountAddress } = useSmartAccountContext();
  const { refreshTokenBalances, setRefreshTokenBalances } = usePortfolioContext();

  const {
    data: balance,
    isError: isBalanceError,
    isLoading: isBalanceLoading,
    refetch: refetchBalance,
  } = useReadContract({
    address: contractAddress,
    abi: TokenABI.abi,
    functionName: "balanceOf",
    args: [userAddress],
  });

  useEffect(() => {
    refetchBalance();
  }, [contractAddress, userAddress, refetchBalance, refreshTokenBalances]);

  useEffect(() => {
    if (refreshTokenBalances) {
      refetchBalance();
      setRefreshTokenBalances(false);
    }
  }, [refreshTokenBalances, refetchBalance, setRefreshTokenBalances]);

  const formatBalance = (value: bigint) => {
    const formatted = parseFloat(formatEther(value)).toFixed(2);
    return formatted === "-0.00" ? "0.00" : formatted;
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isBalanceLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        <span>Loading balance...</span>
      </div>
    );
  }

  if (isBalanceError) {
    return (
      <div className="flex items-center space-x-2 text-error">
        <span>Error fetching balance</span>
        <button onClick={() => refetchBalance()} className="btn btn-xs btn-error">
          Retry
        </button>
      </div>
    );
  }

  const tokenBalance = typeof balance === "bigint" ? balance : 0n;
  const formattedBalance = formatBalance(tokenBalance);

  return (
    <div className="flex items-center space-x-2">
      <button onClick={() => refetchBalance()} className="btn btn-xs btn-ghost" title="Refresh balance">
        <RefreshCw size={16} />
      </button>
      <div className="flex flex-col">
        <div className="flex items-center space-x-1">
          <span className="font-medium">{formattedBalance}</span>
          <span className="text-sm text-base-content/70">{contractName}</span>
        </div>
        <div className="tooltip tooltip-bottom" data-tip={formatEther(tokenBalance)}>
          <span className="text-xs text-base-content/50 cursor-help">Full balance</span>
        </div>
      </div>
      {smartAccountAddress && smartAccountAddress !== userAddress && (
        <div className="tooltip tooltip-bottom" data-tip={`Querying balance for ${userAddress}`}>
          <span className="text-xs text-warning cursor-help">({shortenAddress(userAddress)})</span>
        </div>
      )}
    </div>
  );
};

export default GetTokenBalance;
