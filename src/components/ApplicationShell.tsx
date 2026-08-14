"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useDisconnect } from "wagmi";
import { WalletButton } from "@/components/WalletButton";
import { AURELITH_ADDRESS } from "@/lib/flare/contract";
import { coston2 } from "@/lib/flare/network";

const groups = [
  { label: "PAY", links: [["Create Settlement", "/app/policies/new"]] },
  { label: "INSPECT THE TRUST CHAIN", links: [["Proof", "/app/proof"], ["Security", "/app/security"]] },
  { label: "GUIDE", links: [["How it works", "/app/how-it-works"], ["Docs", "/app/docs"]] },
] as const;

function AppContextStatus() {
  const { isConnected, chainId } = useAccount();
  return <div className="app-context-status" aria-live="polite"><span><i className={isConnected && chainId === coston2.id ? "online" : ""} />{isConnected ? chainId === coston2.id ? "COSTON2 CONNECTED" : "WRONG NETWORK" : "WALLET DISCONNECTED"}</span><b>CORE {AURELITH_ADDRESS.slice(0, 10)}…{AURELITH_ADDRESS.slice(-6)}</b></div>;
}

function AppWalletPanel() {
  if (!process.env.NEXT_PUBLIC_REOWN_PROJECT_ID) return <div className="app-wallet-panel"><WalletButton /></div>;
  return <ConfiguredAppWalletPanel />;
}

function ConfiguredAppWalletPanel() {
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const { disconnect } = useDisconnect();

  if (!isConnected) return <div className="app-wallet-panel"><button className="app-wallet-primary" onClick={() => open()}>Connect Wallet <span>↗</span></button></div>;

  return <div className="app-wallet-panel connected"><button className="app-wallet-primary" onClick={() => open()}><i /><span>{address!.slice(0, 6)}…{address!.slice(-4)}</span><small>Connected</small></button><button className="app-disconnect" onClick={() => disconnect()}>Disconnect</button></div>;
}

export function ApplicationShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return <div className="application-shell">
    <header className="app-mobile-bar"><Link href="/" className="app-mobile-wordmark">AURELITH<span>◆</span></Link><button className="app-menu-toggle" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="application-navigation"><span>{open ? "Close" : "Menu"}</span><b aria-hidden="true">{open ? "×" : "≡"}</b></button></header>
    <aside id="application-navigation" className={`app-rail ${open ? "is-open" : ""}`}>
      <div className="app-rail-top"><Link href="/" className="app-identity" onClick={() => setOpen(false)}>AURELITH<span>◆</span><small>PROTOCOL CONSOLE</small></Link><nav aria-label="Application navigation">{groups.map((group) => <section key={group.label}><p>{group.label}</p>{group.links.map(([label, href]) => <Link href={href} key={href} onClick={() => setOpen(false)} className={pathname === href ? "active" : ""}><i aria-hidden="true" />{label}<span aria-hidden="true">→</span></Link>)}</section>)}</nav></div>
      <div className="app-rail-bottom"><AppWalletPanel /><div className="app-network"><i /><span>FLARE TESTNET</span><small>COSTON2 / 114</small></div></div>
    </aside>
    {open && <button className="app-rail-scrim" aria-label="Close application navigation" onClick={() => setOpen(false)} />}
    <section className="app-content"><AppContextStatus />{children}</section>
  </div>;
}
