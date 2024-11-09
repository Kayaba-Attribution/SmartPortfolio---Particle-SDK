/* eslint-disable prettier/prettier */
"use client";

import { ConnectButton } from "@particle-network/connectkit";
import { useAccount } from "@particle-network/connectkit";
import { useSmartAccountContext } from "../../components/SmartAccountContext";

const formatAddress = (address: string | undefined) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const ParticleConnectButton = () => {
  const { address: eoaAddress, isConnected } = useAccount();
  const { smartAccountAddress, chainId, isLoading } = useSmartAccountContext();

  return (
    <div className="relative flex items-center">
      <div className="flex items-center gap-2">
        <ConnectButton />
        {isLoading && <span className="loading loading-spinner loading-sm" />}

        {isConnected && (
          <div className="hidden lg:flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="opacity-50">EOA:</span>
              <span className="font-mono">{formatAddress(eoaAddress)}</span>
            </div>

            {smartAccountAddress && (
              <>
                <div className="flex items-center gap-2">
                  <span className="opacity-50">SA:</span>
                  <span className="font-mono">{formatAddress(smartAccountAddress)}</span>
                </div>
                <div className="hidden xl:flex items-center gap-2">
                  <span className="font-mono text-xs opacity-50">Base Sepolia ({chainId})</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};