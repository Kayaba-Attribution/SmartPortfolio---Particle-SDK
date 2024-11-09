import React, { useState } from "react";
import { useSmartAccountContext } from "../components/SmartAccountContext";
import addresses from "../contracts/addresses.json";
import ERC20_BASE_ABI from "../contracts/artifacts/ERC20_BASE.json";
import { usePortfolioContext } from "./PortfolioContext";
import { encodeFunctionData } from "viem";

function Faucet() {
  const tokenAddress = addresses.tokens.USDT as `0x${string}`;
  const { setRefreshTokenBalances } = usePortfolioContext();
  const { sendTransaction, smartAccountAddress, isLoading: accountLoading } = useSmartAccountContext();

  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleClaim = async () => {
    try {
      setIsLoading(true);
      setError("");
      setTxHash("");

      // Encode the claimFaucet function call
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
      setRefreshTokenBalances(true);
    } catch (err: any) {
      console.error("Error claiming from faucet:", err);
      setError(err.message || "Failed to claim tokens");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="my-2 bg-base-200 rounded-lg glow">
      <h3 className="text-lg font-bold mb-4">USDT Token Faucet (Gasless)</h3>

      <button
        onClick={handleClaim}
        disabled={isLoading || accountLoading || !smartAccountAddress}
        className="btn btn-primary w-full"
      >
        {accountLoading ? "Initializing..." : isLoading ? "Claiming..." : "Claim 1000 Tokens"}
      </button>

      {error && <div className="mt-4 p-4 bg-error text-error-content rounded-lg">{error}</div>}

      {txHash && (
        <div className="mt-4 p-4 bg-success text-success-content rounded-lg">
          <p>Tokens claimed successfully!</p>
          <p className="text-xs break-all">TX: {txHash}</p>
        </div>
      )}
    </div>
  );
}

export default Faucet;
