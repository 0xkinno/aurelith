"use client";

import type { ReactNode } from "react";
import { ArtifactImage } from "@/components/ArtifactImage";
import { Eyebrow } from "@/components/Eyebrow";
import { Reveal } from "@/components/Reveal";
import { AURELITH_ADDRESS } from "@/lib/flare/contract";
import { explorerAddress, explorerTx } from "@/lib/flare/network";
import { useLifecycle } from "@/lib/lifecycle/LifecycleProvider";
import { getLifecycleStageStates, shortHash, type LifecycleStageState } from "@/lib/lifecycle/status";

function trace(value?: string, transaction = false): ReactNode {
  if (!value) return "PENDING";
  if (!transaction) return shortHash(value);
  return <a href={explorerTx(value)} target="_blank" rel="noreferrer">{shortHash(value)} ↗</a>;
}

function tone(state: LifecycleStageState) {
  return state === "VERIFIED" || state === "COMPLETED" ? "ready" : state === "PROCESSING" ? "warning" : "pending";
}

export default function Proof() {
  const { current, policy, evidence, refresh, isRefreshing } = useLifecycle();
  const stages = getLifecycleStageStates(policy);
  const sourceTransaction = policy?.sourceTransactionHash || evidence?.fdc?.sourceTransactionHash;
  const items: Array<{ n: string; title: string; status: LifecycleStageState; detail: string; meta: Array<[string, ReactNode]> }> = [
    { n:"01", title:"EXTERNAL EVENT", status:stages.externalEvent, detail:stages.externalEvent === "VERIFIED" ? "The source Coston2 payment transaction is recorded by Core and bound to the verified proof." : "Awaiting a real source transaction accepted through the FDC lifecycle.", meta:[["SOURCE","COSTON2 / EVM"],["TRANSACTION",trace(sourceTransaction, true)],["FINALITY",stages.externalEvent === "VERIFIED" ? "CONFIRMED" : "AWAITING"]] },
    { n:"02", title:"FDC PROOF", status:stages.fdcProof, detail:stages.fdcProof === "VERIFIED" ? "The finalized DA proof was accepted by the deployed FdcVerification contract and recorded by AURELITH Core." : "Awaiting verifier preparation, voting-round finalization and a valid DA proof.", meta:[["VOTING ROUND",evidence?.fdc?.votingRoundId ?? "PENDING"],["PROOF TX",trace(evidence?.fdc?.proofSubmissionTransactionHash, true)],["PROOF DIGEST",trace(policy?.externalProofDigest)]] },
    { n:"03", title:"PRIVATE COMPUTE", status:stages.privateCompute, detail:stages.privateCompute === "VERIFIED" ? "The registered FCC extension completed the settlement computation for the bound policy inputs." : stages.privateCompute === "PROCESSING" ? "The FCC instruction exists on-chain and is awaiting a real TEE result." : "Awaiting a verified FDC proof before confidential computation can begin.", meta:[["EXTENSION","66235 / 0x102bb"],["INSTRUCTION TX",trace(evidence?.fcc?.instructionTransactionHash, true)],["INSTRUCTION ID",trace(policy?.computationReference)]] },
    { n:"04", title:"VERIFIED RESULT", status:stages.verifiedResult, detail:stages.verifiedResult === "VERIFIED" ? "Core authenticated the canonical ActionResult signature against the active TEE set." : "Awaiting the signed FCC ActionResult and active-TEE authentication transaction.", meta:[["AUTH TX",trace(evidence?.fcc?.authenticationTransactionHash, true)],["RESULT DIGEST",trace(policy?.resultDigest)],["SIGNER CHECK",stages.verifiedResult === "VERIFIED" ? "ACTIVE TEE VERIFIED" : "PENDING"]] },
    { n:"05", title:"SETTLEMENT", status:stages.settlement, detail:stages.settlement === "COMPLETED" ? "The committed payout vector was released exactly once and the policy is terminally settled." : "Awaiting a verified result and confirmed settlement transaction.", meta:[["CORE",shortHash(AURELITH_ADDRESS)],["SETTLEMENT TX",trace(evidence?.settlement?.transactionHash, true)],["FINALITY",stages.settlement === "COMPLETED" ? "SETTLED" : "NOT SETTLED"]] },
  ];

  return <main className="editorial-page"><section className="page-hero proof-hero flagship-section"><div><Eyebrow>PROOF / SETTLEMENT</Eyebrow><h1>Evidence,<br /><em>layer by layer.</em></h1><p className="lede">AURELITH exposes the complete trust chain—and refuses to decorate an unavailable step as complete.</p></div><ArtifactImage src="/images/PROOF ARTIFACT.png" alt="AURELITH proof artifact secured in glass and copper" label="EVIDENCE OBJECT" index="E/05" /></section><section className="evidence-console flagship-section"><div className="console-head"><div><span>LIVE TRUST CHAIN</span><b>{current ? shortHash(current.policyId) : "NO POLICY SELECTED"}</b></div><button className="text-link" onClick={() => refresh()} disabled={isRefreshing}>{isRefreshing ? "RE-CHECKING…" : "REFRESH STATUS ↻"}</button><a href={explorerAddress(AURELITH_ADDRESS)} target="_blank" rel="noreferrer">VIEW CORE ↗</a></div><div className="evidence-timeline">{items.map((item,index)=><Reveal key={item.n} delay={index*55}><article className={`evidence-row status-${tone(item.status)}`}><div className="evidence-index"><span>{item.n}</span><i /></div><div className="evidence-main"><div><h2>{item.title}</h2><span className="status-pill"><i />{item.status}</span></div><p>{item.detail}</p><dl>{item.meta.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></div></article></Reveal>)}</div><div className="evidence-note"><span>INTEGRITY RULE</span><p>Pending Prior to Settlements completion verified after voting session.</p></div></section></main>;
}
