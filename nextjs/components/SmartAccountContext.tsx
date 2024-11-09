import { createContext, useContext, useEffect, useState } from "react";
import { SendTransactionMode } from "@particle-network/aa";
import { useAccount, useSmartAccount, useWallets } from "@particle-network/connectkit";
import { type Hash } from "viem";

interface SmartAccountContextType {
  smartAccount: any;
  smartAccountAddress: string | undefined;
  chainId: string | undefined;
  isLoading: boolean;
  sendTransaction: (tx: TransactionRequest) => Promise<Hash>;
}

interface TransactionRequest {
  to: `0x${string}`;
  data: `0x${string}`;
  value?: bigint;
}

const SmartAccountContext = createContext<SmartAccountContextType | undefined>(undefined);

export function SmartAccountProvider({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const [wallets] = useWallets();
  const smartAccount = useSmartAccount();
  const [smartAccountAddress, setSmartAccountAddress] = useState<string>();
  const [chainId, setChainId] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const getSmartAccountDetails = async () => {
      if (!smartAccount || !isConnected) return;

      setIsLoading(true);
      try {
        const [addr, chainId] = await Promise.all([smartAccount.getAddress(), smartAccount.getChainId()]);

        if (isMounted) {
          setSmartAccountAddress(addr);
          setChainId(String(chainId));
        }
      } catch (error) {
        console.error("Error fetching smart account details:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
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

  const sendTransaction = async (tx: TransactionRequest): Promise<Hash> => {
    if (!smartAccount) {
      throw new Error("Smart account not initialized");
    }

    try {
      const aaTx = {
        tx: {
          to: tx.to,
          data: tx.data,
          value: tx.value ? `0x${tx.value.toString(16)}` : undefined,
        },
        mode: SendTransactionMode.Gasless,
      };

      const hash = await smartAccount.sendTransaction(aaTx);
      return hash as Hash;
    } catch (error: any) {
      if (error.code === 40305) {
        throw new Error("Gasless transaction failed. The paymaster may be unavailable or conditions not met.");
      }
      throw error;
    }
  };

  return (
    <SmartAccountContext.Provider
      value={{
        smartAccount,
        smartAccountAddress,
        chainId,
        isLoading,
        sendTransaction,
      }}
    >
      {children}
    </SmartAccountContext.Provider>
  );
}

export function useSmartAccountContext() {
  const context = useContext(SmartAccountContext);
  if (context === undefined) {
    throw new Error("useSmartAccountContext must be used within a SmartAccountProvider");
  }
  return context;
}
