"use client";

import { useEffect, useState } from "react";
import { ConnectButton } from "@particle-network/connectkit";
import { useAccount, useSmartAccount, useWallets } from "@particle-network/connectkit";

interface SmartAccountInfo {
  address: string | undefined;
  chainId: string | undefined;
}

const formatAddress = (address: string | undefined) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const ParticleConnectButton = () => {
  const { address, isConnected } = useAccount();
  const [wallets] = useWallets();
  const smartAccount = useSmartAccount();
  const [smartAccountInfo, setSmartAccountInfo] = useState<SmartAccountInfo>({
    address: undefined,
    chainId: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const getSmartAccountDetails = async () => {
      if (!smartAccount || !isConnected) return;

      setLoading(true);
      try {
        const [addr, chainId] = await Promise.all([smartAccount.getAddress(), smartAccount.getChainId()]);

        if (isMounted) {
          setSmartAccountInfo({
            address: addr,
            chainId: String(chainId),
          });
        }
      } catch (error) {
        console.error("Error fetching smart account details:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (isConnected && wallets?.connector?.walletConnectorType === "evmWallet") {
      getSmartAccountDetails();
    }

    return () => {
      isMounted = false;
    };
  }, [isConnected, smartAccount, wallets]);

  return (
    <div className="relative flex items-center">
      {/* Main navbar content */}
      <div className="flex items-center gap-2">
        <ConnectButton />
        {loading && <span className="loading loading-spinner loading-sm" />}

        {isConnected && (
          <div className="hidden lg:flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="opacity-50">EOA:</span>
              <span className="font-mono">{formatAddress(address)}</span>
            </div>

            {smartAccountInfo.address && (
              <>
                <div className="flex items-center gap-2">
                  <span className="opacity-50">SA:</span>
                  <span className="font-mono">{formatAddress(smartAccountInfo.address)}</span>
                </div>
                <div className="hidden xl:flex items-center gap-2">
                  <span className="font-mono text-xs opacity-50">Base Sepolia ({smartAccountInfo.chainId})</span>
                </div>
              </>
            )}
          </div>
        )}

        {process.env.NODE_ENV === "development" && (
          <button onClick={() => setShowDebug(!showDebug)} className="p-2 text-xs opacity-50 hover:opacity-100">
            {showDebug ? "Hide Debug" : "Debug"}
          </button>
        )}
      </div>

      {/* Debug panel */}
      {showDebug && process.env.NODE_ENV === "development" && (
        <div className="absolute top-full right-0 mt-2 z-50">
          <pre className="text-xs p-2 bg-base-300 rounded-lg shadow-lg overflow-auto max-w-xs border border-base-content/20">
            {JSON.stringify(
              {
                isConnected,
                hasWallet: Boolean(wallets),
                walletType: wallets?.connector?.walletConnectorType,
                hasSmartAccount: Boolean(smartAccount),
                loading,
              },
              null,
              2,
            )}
          </pre>
        </div>
      )}
    </div>
  );
};
