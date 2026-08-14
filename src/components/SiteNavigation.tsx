"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [["HOW IT WORKS", "/how-it-works"], ["PROOF", "/proof"], ["SECURITY", "/security"], ["DOCS", "/docs"]] as const;

export function SiteNavigation() {
  const pathname = usePathname();
  return <nav className="capsule-nav" aria-label="Primary navigation">{links.map(([label, href]) => <Link key={href} href={href} className={pathname === href ? "active" : ""}>{label}<span aria-hidden="true" /></Link>)}</nav>;
}
