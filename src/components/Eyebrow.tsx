export function Eyebrow({ children, tone = "light" }: { children: React.ReactNode; tone?: "light" | "dark" }) {
  return <p className={`eyebrow-capsule eyebrow-${tone}`}><span aria-hidden="true" />{children}</p>;
}
