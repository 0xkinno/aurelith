"use client";

import { useEffect, useMemo, useState } from "react";
import { decodeEventLog, formatEther, keccak256, parseEther, stringToHex } from "viem";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { Eyebrow } from "@/components/Eyebrow";
import { AURELITH_ABI, AURELITH_ADDRESS } from "@/lib/flare/contract";
import { coston2, explorerTx } from "@/lib/flare/network";
import { useLifecycle } from "@/lib/lifecycle/LifecycleProvider";
import { getLifecycleStageStates, shortHash } from "@/lib/lifecycle/status";
import { validateParticipants } from "@/lib/policy/validation";

const defaults = [{ name: "Merchant", share: 60 }, { name: "Creator", share: 20 }, { name: "Affiliate", share: 10 }, { name: "Reserve", share: 10 }];
const ruleVersion = "AURELITH_WATERFALL_V1";
const zeroHash = `0x${"0".repeat(64)}`;

function classifyError(message?: string) {
  if (!message) return null;
  const text = message.toLowerCase();
  if (text.includes("rejected") || text.includes("denied")) return "USER_REJECTED";
  if (text.includes("insufficient")) return "INSUFFICIENT_GAS";
  if (text.includes("network") || text.includes("chain")) return "WRONG_NETWORK";
  if (text.includes("revert")) return "TRANSACTION_REVERTED";
  return "RPC_ERROR";
}

export default function NewPolicy() {
  const { address, chainId, isConnected } = useAccount();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });
  const lifecycle = useLifecycle();
  const [amount, setAmount] = useState("1");
  const [reference, setReference] = useState("");
  const [expiryDays, setExpiryDays] = useState("7");
  const [walletPrompted, setWalletPrompted] = useState(false);
  const [participants, setParticipants] = useState(defaults.map((p) => ({ ...p, address: "" })));
  const validation = validateParticipants(participants);
  const amountValid = Number(amount) > 0;
  const expiryValid = Number.isInteger(Number(expiryDays)) && Number(expiryDays) >= 1 && Number(expiryDays) <= 365;
  const paymentReferenceHash = reference.trim() ? keccak256(stringToHex(reference.trim())) : null;
  const participantPreviewHash = useMemo(() => keccak256(stringToHex(participants.map((p) => `${p.name}:${p.address || "UNBOUND"}:${p.share}`).join("|"))), [participants]);
  const transactionState = error ? classifyError(error.message) : receipt.isSuccess ? "CONFIRMED" : receipt.isLoading ? "PENDING" : isPending ? (walletPrompted ? "WALLET_CONFIRMATION" : "SUBMITTING") : hash ? "SUBMITTED" : "IDLE";

  useEffect(() => {
    if (!lifecycle.current?.form) return;
    setAmount(lifecycle.current.form.amount);
    setExpiryDays(lifecycle.current.form.expiryDays);
    setParticipants(lifecycle.current.form.participants);
  }, [lifecycle.current?.policyId]);

  useEffect(() => {
    if (!receipt.isSuccess || !receipt.data || !hash || !paymentReferenceHash) return;
    for (const log of receipt.data.logs) {
      try {
        const decoded = decodeEventLog({ abi: AURELITH_ABI, data: log.data, topics: log.topics });
        if (decoded.eventName !== "PolicyCreated") continue;
        const policyId = (decoded.args as { policyId: `0x${string}` }).policyId;
        if (lifecycle.current?.policyId === policyId) return;
        lifecycle.selectPolicy({
          policyId,
          creationTransactionHash: hash,
          createdBlock: Number(receipt.data.blockNumber),
          form: { amount, referenceHash: paymentReferenceHash, expiryDays, participants },
        });
        return;
      } catch {}
    }
  }, [receipt.isSuccess, receipt.data, hash, paymentReferenceHash, amount, expiryDays, participants, lifecycle]);

  function submit() {
    if (!address || chainId !== coston2.id || !AURELITH_ADDRESS || !validation.valid || !reference.trim() || !amountValid || !expiryValid) return;
    reset();
    setWalletPrompted(true);
    const expiry = BigInt(Math.floor(Date.now() / 1000) + Number(expiryDays) * 86400);
    const normalizedRule = `${ruleVersion}|${participants.map((p) => `${p.name}:${p.share * 100}`).join("|")}`;
    writeContract({
      address: AURELITH_ADDRESS,
      abi: AURELITH_ABI,
      functionName: "createPolicy",
      args: [{
        salt: `0x${crypto.randomUUID().replaceAll("-", "").padEnd(64, "0").slice(0, 64)}` as `0x${string}`,
        ruleHash: keccak256(stringToHex(normalizedRule)),
        paymentReferenceHash: paymentReferenceHash!,
        targetAmount: parseEther(amount),
        expiry,
        recipients: validation.addresses!,
        sharesBps: validation.sharesBps!,
      }],
    }, { onSettled: () => setWalletPrompted(false) });
  }

  const buttonLabel = !isConnected ? "Connect wallet in navigation" : chainId !== coston2.id ? "Switch to Coston2" : transactionState === "WALLET_CONFIRMATION" ? "Confirm in wallet" : transactionState === "SUBMITTING" ? "Submitting…" : transactionState === "PENDING" ? "Pending confirmation…" : "Create policy";
  const disabled = !isConnected || chainId !== coston2.id || isPending || receipt.isLoading || !validation.valid || !reference.trim() || !amountValid || !expiryValid;
  const stageStates = getLifecycleStageStates(lifecycle.policy);
  const hasPolicy = Boolean(lifecycle.current && lifecycle.policy?.owner && lifecycle.policy.owner !== "0x0000000000000000000000000000000000000000");
  const previewAmount = hasPolicy ? formatEther(lifecycle.policy.targetAmount) : amount || "0";
  const previewParticipants = hasPolicy && lifecycle.participants ? lifecycle.participants.recipients.map((recipient, index) => ({
    name: lifecycle.current?.form?.participants[index]?.name || `Recipient ${index + 1}`,
    address: recipient,
    share: Number(lifecycle.participants!.sharesBps[index]) / 100,
  })) : participants;

  return <main className="protocol-workspace">
    <section className="workspace-header"><div><Eyebrow>AURELITH / POLICY CONSOLE</Eyebrow><h1>Define the<br /><em>waterfall.</em></h1></div><div className="workspace-network"><span><i className={isConnected && chainId === coston2.id ? "online" : ""} />{isConnected ? chainId === coston2.id ? "COSTON2 CONNECTED" : "WRONG NETWORK" : "WALLET DISCONNECTED"}</span><b>CORE {AURELITH_ADDRESS.slice(0,8)}…{AURELITH_ADDRESS.slice(-6)}</b></div></section>
    <section className="workspace-grid">
      <div className="policy-form">
        <div className="form-section"><span className="form-index">01</span><div><h2>SETTLEMENT TERMS</h2><p>Set the escrow target, private reference commitment and policy deadline.</p><div className="field-grid"><label><span>Target amount</span><div className="amount-field"><input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" aria-invalid={!amountValid} /><b>C2FLR</b></div></label><label><span>Expiry</span><div className="amount-field"><input value={expiryDays} onChange={(e) => setExpiryDays(e.target.value.replace(/\D/g,""))} inputMode="numeric" aria-invalid={!expiryValid} /><b>DAYS</b></div></label></div><label><span>Private payment reference</span><input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Invoice, order or commercial reference" /><small>Only its keccak256 commitment is sent on-chain.</small></label></div></div>
        <div className="form-section"><span className="form-index">02</span><div><h2>RECIPIENT BINDINGS</h2><p>Every address and basis-point share is bound before proof and computation.</p><div className="recipient-editor">{participants.map((participant,index)=><div className="recipient-row" key={`${participant.name}-${index}`}><span className="recipient-number">0{index+1}</span><label><span>Role</span><input value={participant.name} onChange={(e)=>setParticipants(current=>current.map((item,i)=>i===index?{...item,name:e.target.value}:item))} /></label><label className="address-input"><span>Recipient address</span><input aria-label={`${participant.name} address`} value={participant.address} onChange={(e)=>setParticipants(current=>current.map((item,i)=>i===index?{...item,address:e.target.value}:item))} placeholder="0x…" /></label><label><span>Share</span><div className="share-field"><input inputMode="numeric" value={participant.share} onChange={(e)=>setParticipants(current=>current.map((item,i)=>i===index?{...item,share:Number(e.target.value)}:item))} /><b>%</b></div></label></div>)}</div>{!validation.valid && <p className="form-error">{validation.error}</p>}</div></div>
        <div className="transaction-panel"><div><span>TRANSACTION STATE</span><strong className={`tx-${transactionState?.toLowerCase()}`}>{transactionState}</strong></div><button className="button button-copper" onClick={submit} disabled={disabled}>{buttonLabel}<b>↗</b></button>{error && <p className="form-error">{classifyError(error.message)} · {error.shortMessage || error.message}</p>}{hash && <p className="tx-link">{receipt.isSuccess ? "Confirmed on Coston2" : "Submitted to Coston2"} · <a href={explorerTx(hash)} target="_blank" rel="noreferrer">View transaction ↗</a></p>}</div>
      </div>
      <aside className="settlement-preview">
        <div className="preview-head"><Eyebrow tone="dark">LIVE ARTIFACT</Eyebrow><span>{hasPolicy ? `POLICY ${shortHash(lifecycle.current!.policyId, 8, 5)}` : "UNDEPLOYED POLICY"}</span></div>
        <div className="preview-amount"><strong>{previewAmount}</strong><span>C2FLR ESCROW TARGET</span></div>
        <div className="preview-allocation">{previewParticipants.map((p,index)=><div key={`${p.name}-${index}`} title={p.address || undefined}><span>{p.name || `Recipient ${index+1}`}</span><i><b style={{width:`${Math.max(0,Math.min(100,p.share||0))}%`}} /></i><strong>{p.share || 0}%</strong></div>)}</div>
        <dl className="artifact-metadata"><div><dt>POLICY RULE</dt><dd>{ruleVersion}</dd></div><div><dt>RECIPIENT COMMITMENT</dt><dd>{hasPolicy ? shortHash(lifecycle.policy.participantHash, 12, 8) : `${participantPreviewHash.slice(0,12)}…${participantPreviewHash.slice(-8)}`}</dd></div><div><dt>PAYMENT REFERENCE</dt><dd>{hasPolicy ? shortHash(lifecycle.policy.paymentReferenceHash, 12, 8) : paymentReferenceHash ? `${paymentReferenceHash.slice(0,12)}…${paymentReferenceHash.slice(-8)}` : "AWAITING INPUT"}</dd></div><div><dt>PRIVATE INPUT</dt><dd>{hasPolicy && lifecycle.policy.privateInputHash !== zeroHash ? "SEALED / COMMITTED" : "SEALED"}</dd></div><div><dt>FDC PROOF</dt><dd>{stageStates.fdcProof}</dd></div><div><dt>FCC RESULT</dt><dd>{stageStates.verifiedResult === "VERIFIED" ? "VERIFIED" : "PENDING"}</dd></div><div><dt>SETTLEMENT</dt><dd>{stageStates.settlement}</dd></div></dl>
        <p className="preview-disclaimer">{hasPolicy ? "Lifecycle status is read from AURELITH Core and verified evidence records." : "Preview values come from this form. No on-chain policy exists until the wallet transaction is confirmed."} {hasPolicy && <button className="text-link" onClick={() => lifecycle.refresh()} disabled={lifecycle.isRefreshing}>{lifecycle.isRefreshing ? "RE-CHECKING…" : "REFRESH STATUS ↻"}</button>}</p>
      </aside>
    </section>
  </main>;
}
