import { createContext, useContext, useEffect, useState } from "react";
import { AAWrapProvider, SendTransactionMode } from "@particle-network/aa";
import { useAccount, useSmartAccount } from "@particle-network/connectkit";
import { type Eip1193Provider, ethers } from "ethers";
import { type Hash } from "viem";

interface SmartAccountContextType {
  smartAccount: any;
  smartAccountAddress: string | undefined;
  chainId: string | undefined;
  isLoading: boolean;
  aaProvider: ethers.BrowserProvider | null;
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
  const smartAccount = useSmartAccount();
  const [smartAccountAddress, setSmartAccountAddress] = useState<string>();
  const [chainId, setChainId] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [aaProvider, setAAProvider] = useState<ethers.BrowserProvider | null>(null);

  useEffect(() => {
    let isMounted = true;

    const setupAccount = async () => {
      if (!smartAccount || !isConnected) return;

      setIsLoading(true);
      try {
        // Create AA-enabled provider with gasless mode
        const customProvider = new ethers.BrowserProvider(
          new AAWrapProvider(smartAccount, SendTransactionMode.Gasless) as Eip1193Provider,
          "any",
        );

        // Get account details
        const [address, chain] = await Promise.all([smartAccount.getAddress(), smartAccount.getChainId()]);

        if (isMounted) {
          setAAProvider(customProvider);
          setSmartAccountAddress(address);
          setChainId(chain);
        }
      } catch (error) {
        console.error("Error setting up smart account:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    setupAccount();

    return () => {
      isMounted = false;
    };
  }, [isConnected, smartAccount]);

  const sendTransaction = async (tx: TransactionRequest): Promise<Hash> => {
    if (!aaProvider || !smartAccountAddress) {
      throw new Error("Provider not initialized");
    }

    try {
      const signer = await aaProvider.getSigner();

      const transaction = {
        to: tx.to,
        data: tx.data,
        value: tx.value ? ethers.toQuantity(tx.value) : undefined,
      };

      const txResponse = await signer.sendTransaction(transaction);

      // Wait for transaction to be mined
      const receipt = await txResponse.wait();

      return receipt?.hash as Hash;
    } catch (error: any) {
      console.error("Transaction error:", error);
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
        aaProvider,
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
