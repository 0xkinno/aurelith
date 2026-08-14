"use client";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { coston2 } from "@/lib/flare/network";

export function WalletButton() {
  if (!process.env.NEXT_PUBLIC_REOWN_PROJECT_ID) return <button className="button button-dark wallet-connect" disabled title="Set NEXT_PUBLIC_REOWN_PROJECT_ID to enable Reown AppKit">Connect wallet</button>;
  return <ConfiguredWalletButton />;
}

function ConfiguredWalletButton() {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  if (!isConnected) return <button className="button button-dark wallet-connect" onClick={() => open()}>Connect wallet</button>;
  if (chainId !== coston2.id) return <button className="button button-warning" disabled={isPending} onClick={() => switchChain({ chainId: coston2.id })}>{isPending ? "Switching…" : "Switch to Coston2"}</button>;
  return <button className="wallet-chip" onClick={() => open()} aria-label={`Connected wallet ${address} on Coston2`}><span className="status-dot" /><span>{address!.slice(0, 6)}…{address!.slice(-4)}</span><small>Coston2</small></button>;
}
