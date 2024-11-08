/* eslint-disable prettier/prettier */
// components/scaffold-eth/ParticleConnectButton.tsx
"use client";

import { useEffect, useState } from "react";
import { ConnectButton } from "@particle-network/connectkit";
import { useAccount, useSmartAccount, useWallets } from "@particle-network/connectkit";

export const ParticleConnectButton = () => {
  const { isConnected } = useAccount();
  const wallets = useWallets();
  const smartAccount = useSmartAccount();
  const [smartAccountAddress, setSmartAccountAddress] = useState<string>();

  useEffect(() => {
    const getSmartAccountAddress = async () => {
      if (smartAccount) {
        try {
          const addr = await smartAccount.getAddress();
          setSmartAccountAddress(addr);
        } catch (error) {
          console.error("Error getting smart account address:", error);
        }
      }
    };

    if (isConnected && wallets?.[0]?.connector?.walletConnectorType === "particleAuth") {
      getSmartAccountAddress();
    }
  }, [isConnected, smartAccount, wallets]);

  return (
    <div className="flex items-center gap-2">
      <ConnectButton />
      {isConnected && smartAccountAddress && (
        <div className="text-sm opacity-50">
          Smart Account: {smartAccountAddress?.slice(0, 6)}...{smartAccountAddress?.slice(-4)}
        </div>
      )}
    </div>
  );
};
