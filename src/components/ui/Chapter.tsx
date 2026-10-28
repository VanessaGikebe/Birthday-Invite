/** Small editorial chapter label: "Chapter 02 — Game night". */
export default function Chapter({ n, children, className = "" }: { n: string; children: React.ReactNode; className?: string }) {
  return (
    <p className={`eyebrow flex items-center gap-4 ${className}`}>
      <span className="font-serif text-base italic tracking-normal normal-case">{n}</span>
      <span aria-hidden="true" className="h-px w-10 bg-current opacity-50" />
      {children}
    </p>
  );
}
