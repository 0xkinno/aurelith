"use client";

import Link from "next/link";
import { Eyebrow } from "@/components/Eyebrow";
import { AURELITH_ADDRESS } from "@/lib/flare/contract";
import { explorerAddress } from "@/lib/flare/network";
import { useLifecycle } from "@/lib/lifecycle/LifecycleProvider";
import { getLifecycleStageStates } from "@/lib/lifecycle/status";

const states = ["DEFINE POLICY", "FDC EVIDENCE", "FCC COMPUTE", "AUTHENTICATE", "SETTLE"];

export default function AppHome() {
  const { policy, verifierConfigured } = useLifecycle();
  const lifecycle = getLifecycleStageStates(policy);
  const pathStates = [policy ? "ON-CHAIN" : "AVAILABLE", lifecycle.fdcProof, lifecycle.privateCompute, lifecycle.verifiedResult, lifecycle.settlement];
  const settled = lifecycle.settlement === "COMPLETED";

  return <main className="control-room"><section className="control-hero flagship-section"><div><Eyebrow>AURELITH / CONTROL ROOM</Eyebrow><h1>Settlement<br /><em>operations.</em></h1><p className="lede">Create a policy, bind recipients and move through the real Coston2 trust path. Unavailable evidence remains visibly unavailable.</p><div className="hero-actions"><Link href="/app/policies/new" className="button button-copper">Create settlement <b>↗</b></Link><a href={explorerAddress(AURELITH_ADDRESS)} className="text-link" target="_blank" rel="noreferrer">Inspect deployed Core →</a></div></div><div className="control-status"><div className="control-status-head"><span>PROTOCOL STATUS</span><b>{settled ? "LIVE / SETTLED" : "LIVE / PARTIAL PATH"}</b></div><dl><div><dt>NETWORK</dt><dd><i className="online" />COSTON2 / 114</dd></div><div><dt>CORE</dt><dd>{AURELITH_ADDRESS.slice(0,10)}…{AURELITH_ADDRESS.slice(-8)}</dd></div><div><dt>FCC EXTENSION</dt><dd><i className="online" />66235 / ACTIVE TEE</dd></div><div><dt>FDC VERIFIER</dt><dd><i className={verifierConfigured ? "online" : "warning"} />{verifierConfigured ? "API KEY CONFIGURED" : "CONFIGURATION UNAVAILABLE"}</dd></div><div><dt>SETTLEMENT</dt><dd>{settled ? "COMPLETED" : "AWAITING COMPLETE PROOF"}</dd></div></dl></div></section><section className="operation-path flagship-section"><div className="operation-head"><span>END-TO-END PATH</span><b>REAL STATE ONLY</b></div>{states.map((state,index)=><article key={state}><span>0{index+1}</span><i className={pathStates[index] === "VERIFIED" || pathStates[index] === "COMPLETED" || pathStates[index] === "ON-CHAIN" ? "active" : pathStates[index] === "PROCESSING" ? "warning" : ""} /><h2>{state}</h2><p>{pathStates[index]}</p></article>)}</section></main>;
}
