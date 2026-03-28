import { getOutputFormats } from "../lib/formatMap";

interface FormatSelectorProps {
  filename: string;
  selectedFormat: string;
  onFormatChange: (format: string) => void;
  disabled?: boolean;
}

export function FormatSelector({
  filename,
  selectedFormat,
  onFormatChange,
  disabled = false,
}: FormatSelectorProps) {
  const formats = getOutputFormats(filename);

  return (
    <select
      value={selectedFormat}
      onChange={(e) => onFormatChange(e.target.value)}
      disabled={disabled}
      className="forge-select bg-bg-elevated text-text-primary border border-accent-dim/50 rounded-md
                 px-2.5 py-1 text-[11px] font-display tracking-wider uppercase
                 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
                 disabled:opacity-30 disabled:cursor-not-allowed
                 cursor-pointer appearance-none
                 hover:border-accent/60 hover:bg-bg-hover
                 transition-all duration-200"
    >
      {formats.map((fmt) => (
        <option key={fmt} value={fmt}>
          .{fmt.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
