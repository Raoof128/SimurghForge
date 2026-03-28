interface ProgressBarProps {
  percent: number;
  isActive: boolean;
}

export function ProgressBar({ percent, isActive }: ProgressBarProps) {
  const clampedPercent = Math.min(100, Math.max(0, percent));

  return (
    <div
      className="relative w-full h-[6px] bg-bg-base rounded-full overflow-hidden"
      role="progressbar"
      aria-valuenow={clampedPercent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Conversion progress: ${clampedPercent}%`}
    >
      {/* Track glow (subtle ambient light from the bar) */}
      {isActive && (
        <div
          className="absolute inset-0 rounded-full opacity-30 blur-sm"
          style={{
            background: `linear-gradient(90deg, transparent, var(--color-accent-glow) ${clampedPercent}%, transparent ${clampedPercent}%)`,
          }}
        />
      )}

      {/* Fill bar — molten metal effect */}
      <div
        className={`relative h-full rounded-full transition-[width] duration-500 ease-out ${
          isActive ? "molten-bar animate-progress-glow" : "bg-accent"
        }`}
        style={{ width: `${clampedPercent}%` }}
      >
        {/* Leading edge spark */}
        {isActive && clampedPercent > 5 && clampedPercent < 100 && (
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
            style={{
              background: "var(--color-accent-bright)",
              boxShadow: "0 0 8px var(--color-accent-bright), 0 0 16px var(--color-accent)",
            }}
          />
        )}
      </div>
    </div>
  );
}
