import { Eyebrow } from "@/components/Eyebrow";
import { Reveal } from "@/components/Reveal";

const base = "https://github.com/0xkinno/aurelith/blob/main/docs";
const documents = [
  { n:"01", category:"SYSTEM DESIGN", title:"ARCHITECTURE", description:"Core topology, trust boundaries, orchestration and settlement authority.", meta:"MARKDOWN · PROTOCOL", href:`${base}/ARCHITECTURE.md` },
  { n:"02", category:"THREAT MODEL", title:"SECURITY", description:"Authorization, replay defence, active TEE verification and value safety.", meta:"MARKDOWN · SECURITY", href:`${base}/SECURITY.md` },
  { n:"03", category:"RECOVERY", title:"FAILURE MODES", description:"Honest handling for proof delays, reverts, expiry, cancellation and infrastructure faults.", meta:"MARKDOWN · OPERATIONS", href:`${base}/FAILURE-MODES.md` },
  { n:"04", category:"VERIFICATION", title:"BUILD AUDIT", description:"Official sources, deployed topology, integration status and remaining FDC gate.", meta:"MARKDOWN · EVIDENCE", href:`${base}/BUILD-AUDIT.md` },
];

export default function Docs() { return <main className="editorial-page"><section className="page-hero flagship-section"><Eyebrow>DOCUMENTATION</Eyebrow><h1>A protocol you can<br /><em>inspect.</em></h1><p className="lede">Read from product intent down to contract boundaries, failure semantics and live deployment evidence.</p></section><section className="document-library flagship-section">{documents.map((doc,index)=><Reveal key={doc.n} delay={index*65}><a className={`document-card doc-${index+1}`} href={doc.href} target="_blank" rel="noreferrer"><div className="doc-top"><span>{doc.n}</span><i>{doc.category}</i><b>↗</b></div><h2>{doc.title}</h2><p>{doc.description}</p><footer><span>{doc.meta}</span><i /></footer></a></Reveal>)}</section></main>; }
