import React, { useState } from "react";
import { useSmartAccountContext } from "../components/SmartAccountContext";
import addresses from "../contracts/addresses.json";
import ERC20_BASE_ABI from "../contracts/artifacts/ERC20_BASE.json";
import { usePortfolioContext } from "./PortfolioContext";
import { encodeFunctionData } from "viem";

function Faucet() {
  const tokenAddress = addresses.tokens.USDT as `0x${string}`;
  const { setRefreshTokenBalances } = usePortfolioContext();
  const { sendTransaction, smartAccountAddress } = useSmartAccountContext();

  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleClaim = async () => {
    try {
      setIsLoading(true);
      setError("");

      const data = encodeFunctionData({
        abi: ERC20_BASE_ABI.abi,
        functionName: "claimFaucet",
        args: [],
      });

      const hash = await sendTransaction({
        to: tokenAddress,
        data,
      });

      setTxHash(hash);

      // Wait a bit before refreshing balances to allow transaction to process
      setTimeout(() => {
        setRefreshTokenBalances(true);
      }, 2000);
    } catch (err: any) {
      console.error("Error calling claimFaucet:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="my-2 bg-base-200 rounded-lg glow">
      <h3 className="text-lg font-bold mb-4">USDT Token Faucet (Gasless)</h3>
      <span>{smartAccountAddress}</span>

      <button onClick={handleClaim} disabled={isLoading || !smartAccountAddress} className="btn btn-primary w-full">
        {isLoading ? "Claiming..." : "Claim 1000 Tokens"}
      </button>

      {txHash && (
        <div className="mt-4 p-4 bg-success text-success-content rounded-lg">
          <p>Tokens claimed successfully!</p>
          <p className="text-xs break-all">TX: {txHash}</p>
        </div>
      )}

      {error && <div className="mt-4 p-4 bg-error text-error-content rounded-lg">{error}</div>}
    </div>
  );
}

export default Faucet;
