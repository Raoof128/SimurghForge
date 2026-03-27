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
      className="bg-bg-elevated text-text-primary border border-accent-dim rounded px-2 py-1 text-xs font-display
                 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
                 disabled:opacity-40 disabled:cursor-not-allowed
                 cursor-pointer appearance-none"
    >
      {formats.map((fmt) => (
        <option key={fmt} value={fmt}>
          .{fmt.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
