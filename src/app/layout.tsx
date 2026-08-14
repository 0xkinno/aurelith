import type { Metadata } from "next";
import { WalletProvider } from "@/lib/wallet/config";
import { SiteFrame } from "@/components/SiteFrame";
import { LifecycleProvider } from "@/lib/lifecycle/LifecycleProvider";
import "./globals.css";
import "./builder.css";

export const metadata: Metadata = { title: "AURELITH — Private Settlement Infrastructure", description: "Prove the payment. Keep the economics private. Settle only the verified result." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><WalletProvider><LifecycleProvider><SiteFrame>{children}</SiteFrame></LifecycleProvider></WalletProvider></body></html>;
}
