"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { WagmiProvider } from "wagmi";
import { coston2 } from "@/lib/flare/network";

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ?? "";
const networks: [typeof coston2] = [coston2];
const adapter = new WagmiAdapter({ networks, projectId });
if (projectId) {
  createAppKit({
    adapters: [adapter],
    networks,
    projectId,
    metadata: {
      name: "AURELITH",
      description: "Private settlement infrastructure",
      url: "https://aurelith.app",
      icons: [],
    },
  });
}
const queryClient = new QueryClient();

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return <WagmiProvider config={adapter.wagmiConfig}><QueryClientProvider client={queryClient}>{children}</QueryClientProvider></WagmiProvider>;
}
