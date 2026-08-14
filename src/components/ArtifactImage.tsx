import Image from "next/image";

export function ArtifactImage({ src, alt, label, index, className = "" }: { src: string; alt: string; label: string; index: string; className?: string }) {
  return <figure className={`artifact-image ${className}`}><Image src={src} alt={alt} fill sizes="(max-width: 900px) 100vw, 50vw" /><figcaption><span>{index}</span><strong>{label}</strong></figcaption></figure>;
}
