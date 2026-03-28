type StatCardProps = {
  label: string;
  value: string;
  className?: string;
};

export function StatCard({ label, value, className }: StatCardProps) {
  return (
    <div className={className ? `stat-card ${className}` : "stat-card"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
