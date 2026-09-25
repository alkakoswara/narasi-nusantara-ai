export function LevelBadge({ level }: { level: "Aman" | "Waspada" | "KLB" }) {
  const kelas =
    level === "KLB"
      ? "bg-destructive/15 text-destructive border-destructive/40"
      : level === "Waspada"
        ? "bg-warning/15 text-warning border-warning/40"
        : "bg-success/15 text-success border-success/40";
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${kelas}`}>
      {level}
    </span>
  );
}
