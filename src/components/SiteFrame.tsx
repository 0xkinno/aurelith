"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ApplicationShell } from "@/components/ApplicationShell";
import { SiteNavigation } from "@/components/SiteNavigation";
import { WalletButton } from "@/components/WalletButton";

export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/app")) return <ApplicationShell>{children}</ApplicationShell>;

  return <><header className="site-header"><Link href="/" className="wordmark" aria-label="AURELITH home">AURELITH<span aria-hidden="true">◆</span></Link><SiteNavigation /><WalletButton /></header>{children}<footer className="site-footer"><div><strong>AURELITH</strong><span>PRIVATE PROGRAMMABLE SETTLEMENT</span></div><div><span>FLARE COSTON2</span><span>TESTNET · NOT AUDITED</span></div></footer></>;
}
