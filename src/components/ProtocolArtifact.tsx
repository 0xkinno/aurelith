export function ProtocolArtifact() {
  return <div className="artifact" aria-label="AURELITH protocol lifecycle">
    <div className="artifact-top"><span>POLICY / AURELITH</span><span>TESTNET / C2</span></div>
    <div className="artifact-stage"><strong>PAYMENT</strong><em>public event</em></div>
    <div className="artifact-line">↓</div>
    <div className="artifact-stage"><strong>FDC PROOF</strong><em>attestation path</em></div>
    <div className="artifact-line">↓</div>
    <div className="artifact-stage sealed"><strong>PRIVATE COMPUTE</strong><em>inputs sealed</em><span className="veil">SEALED</span></div>
    <div className="artifact-line">↓</div>
    <div className="artifact-stage"><strong>VERIFIED RESULT</strong><em>digest authenticated</em></div>
    <div className="artifact-line">↓</div>
    <div className="artifact-stage final"><strong>SETTLED ON FLARE</strong><em>one-time release</em></div>
  </div>;
}

