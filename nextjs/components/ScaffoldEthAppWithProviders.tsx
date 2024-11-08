/* eslint-disable prettier/prettier */
// components/ScaffoldEthAppWithProviders.tsx
"use client";

import { useEffect, useState } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { BlockieAvatar } from "./scaffold-eth";
import { ProgressBar } from "./scaffold-eth/ProgressBar";
import { ConnectKitProvider, createConfig } from "@particle-network/connectkit";
import { aa } from "@particle-network/connectkit/aa";
import { authWalletConnectors } from "@particle-network/connectkit/auth";
import { baseSepolia } from "@particle-network/connectkit/chains";
import { evmWalletConnectors } from "@particle-network/connectkit/evm";
import { EntryPosition, wallet } from "@particle-network/connectkit/wallet";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";

/* eslint-disable prettier/prettier */
// components/ScaffoldEthAppWithProviders.tsx

const particleConfig = createConfig({
  projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID as string,
  clientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY as string,
  appId: process.env.NEXT_PUBLIC_PARTICLE_APP_ID as string,

  chains: [baseSepolia],
  walletConnectors: [
    evmWalletConnectors({
      metadata: {
        name: "ScaffoldETH App",
        description: "ScaffoldETH integration with Particle Network",
        url: typeof window !== "undefined" ? window.location.origin : "",
      },
    }),
    authWalletConnectors({
      authTypes: ["email", "google"],
      fiatCoin: "USD",
      promptSettingConfig: {
        promptMasterPasswordSettingWhenLogin: 1,
        promptPaymentPasswordSettingWhenSign: 1,
      },
    }),
  ],
  plugins: [
    wallet({
      visible: true,
      entryPosition: EntryPosition.BR,
    }),
    aa({
      name: "BICONOMY",
      version: "2.0.0",
    }),
  ],
});

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="relative flex flex-col flex-1">{children}</main>
        <Footer />
      </div>
      <Toaster />
    </>
  );
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export const ScaffoldEthAppWithProviders = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ConnectKitProvider config={particleConfig}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <ProgressBar />
          <RainbowKitProvider
            avatar={BlockieAvatar}
            theme={mounted ? (isDarkMode ? darkTheme() : lightTheme()) : lightTheme()}
          >
            <ScaffoldEthApp>{children}</ScaffoldEthApp>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ConnectKitProvider>
  );
};
