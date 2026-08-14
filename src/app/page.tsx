import Link from "next/link";
import { ArtifactImage } from "@/components/ArtifactImage";
import { Eyebrow } from "@/components/Eyebrow";
import { Reveal } from "@/components/Reveal";
import { AURELITH_ADDRESS } from "@/lib/flare/contract";
import { explorerAddress } from "@/lib/flare/network";

const uses = ["Marketplace splits", "Creator revenue", "Partner commissions", "Milestone pools"];

export default function Home() {
  return <main className="landing">
    <section className="hero flagship-section">
      <div className="hero-copy">
        <Eyebrow>AURELITH / PROTOCOL</Eyebrow>
        <h1><span>Prove the payment.</span><span>Keep the economics private.</span><em>Settle only the verified result.</em></h1>
        <p className="lede">Private programmable settlement infrastructure for businesses that need public certainty without publishing the commercial record behind it.</p>
        <div className="hero-actions"><Link className="button button-copper" href="/app">Open app <b>↗</b></Link><Link className="text-link" href="/proof">Inspect the trust chain <span>→</span></Link></div>
        <div className="hero-proofline"><span><i />LIVE ON COSTON2</span><a href={explorerAddress(AURELITH_ADDRESS)} target="_blank" rel="noreferrer">CORE {AURELITH_ADDRESS.slice(0, 8)}…{AURELITH_ADDRESS.slice(-6)}</a></div>
      </div>
      <div className="hero-visual"><ArtifactImage src="/images/HERO IMAGE.png" alt="AURELITH private settlement architecture in graphite, glass and copper" label="PRIVATE SETTLEMENT ARCHITECTURE" index="A/01" /><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /></div>
    </section>

    <section className="protocol-strip" aria-label="Protocol architecture"><div><span>PROOF</span><b>FDC</b></div><i aria-hidden="true" /><div><span>COMPUTE</span><b>FCC</b></div><i aria-hidden="true" /><div><span>SETTLE</span><b>C2</b></div><i aria-hidden="true" /><div className="strip-note"><span>ACTIVE TEE VERIFICATION</span><b>ONE-TIME RELEASE</b></div></section>

    <Reveal><section className="flagship-section editorial-intro"><div><Eyebrow>PRIVATE / BY CONSTRUCTION</Eyebrow><h2>Commercial truth has <em>layers.</em></h2></div><div className="editorial-copy"><p>A payment can be independently verifiable without exposing customer records, deductions, margins or partner economics.</p><p>AURELITH binds the public evidence, sealed computation and exact payout vector into one replay-protected lifecycle.</p></div></section></Reveal>

    <section className="dark-stage flagship-section">
      <Reveal className="stage-heading"><Eyebrow tone="dark">THE SETTLEMENT RAIL</Eyebrow><h2>From external event to final receipt.</h2></Reveal>
      <div className="protocol-rail">{[["01","DEFINE","Policy + recipients"],["02","PROVE","FDC evidence"],["03","COMPUTE","FCC sealed inputs"],["04","VERIFY","Active TEE result"],["05","SETTLE","Exact release"]].map(([n,t,d], index) => <Reveal key={n} delay={index*70}><article><span>{n}</span><i /><h3>{t}</h3><p>{d}</p></article></Reveal>)}</div>
    </section>

    <Reveal><section className="flagship-section image-story"><ArtifactImage src="/images/PRIVATE COMPUTE ARTIFACT.png" alt="Sealed private computation artifact" label="CONFIDENTIAL COMPUTE" index="B/02" /><div className="story-copy"><Eyebrow>FCC / ACTIVE TEE SET</Eyebrow><h2>The calculation is private. The result is accountable.</h2><p>Raw revenue inputs and business-specific economics stay sealed. AURELITH Core accepts only the canonical ActionResult signed by an active TEE registered for extension 66235.</p><dl><div><dt>EXTENSION</dt><dd>66235 / 0x102bb</dd></div><div><dt>AUTHENTICATION</dt><dd>EIP-191 + active TEE</dd></div><div><dt>AUTHORITY</dt><dd>On-chain Core only</dd></div></dl></div></section></Reveal>

    <Reveal><section className="flagship-section waterfall-section"><div><Eyebrow>PROGRAMMABLE WATERFALLS</Eyebrow><h2>One policy.<br />Many recipients.<br /><em>No ambiguity.</em></h2><p className="lede">Recipient addresses and deterministic shares are committed before evidence or computation enters the lifecycle.</p></div><div className="premium-waterfall"><div className="waterfall-head"><span>DEMO ALLOCATION</span><b>10.00 C2FLR</b></div>{[["MERCHANT",60,"6.00"],["CREATOR",20,"2.00"],["AFFILIATE",10,"1.00"],["RESERVE",10,"1.00"]].map(([name,share,value]) => <div className="allocation" key={name as string}><span>{name}</span><div><i style={{width:`${share}%`}} /></div><strong>{share}%</strong><em>{value}</em></div>)}<small>Illustrative policy composition · no transaction implied</small></div></section></Reveal>

    <section className="flagship-section use-grid"><div><Eyebrow>ONE ENGINE / MANY OBLIGATIONS</Eyebrow><h2>Infrastructure, not a single use case.</h2></div><div className="use-cases">{uses.map((item,index)=><Reveal key={item} delay={index*60}><article><span>0{index+1}</span><h3>{item}</h3><p>Versioned policy · bound recipients · verified result</p></article></Reveal>)}</div></section>

    <section className="flagship-section final-cta"><Eyebrow tone="dark">AURELITH / COSTON2</Eyebrow><h2>Make private economics<br />publicly enforceable.</h2><div><Link href="/app" className="button button-copper">Open app <b>↗</b></Link><Link href="/docs" className="text-link light">Read the specification →</Link></div></section>
  </main>;
}
