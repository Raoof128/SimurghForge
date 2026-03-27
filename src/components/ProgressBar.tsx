interface ProgressBarProps {
  percent: number;
  isActive: boolean;
}

export function ProgressBar({ percent, isActive }: ProgressBarProps) {
  return (
    <div className="w-full h-2 bg-bg-base rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-300 ease-out ${
          isActive
            ? "bg-accent shadow-[0_0_8px_var(--color-accent)] animate-pulse"
            : "bg-accent"
        }`}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}
