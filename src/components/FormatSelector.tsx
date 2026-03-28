import { useState, useRef, useEffect } from "react";
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
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-1.5 bg-bg-elevated text-text-primary border border-accent-dim/50 rounded-md
                   px-2.5 py-1 text-[11px] font-display tracking-wider uppercase
                   disabled:opacity-30 disabled:cursor-not-allowed
                   cursor-pointer transition-all duration-200
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40
                   ${isOpen ? "border-accent ring-1 ring-accent/30" : "hover:border-accent/60 hover:bg-bg-hover"}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Output format: ${selectedFormat.toUpperCase()}`}
      >
        <span>.{selectedFormat.toUpperCase()}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 z-50 min-w-[80px]
                     bg-bg-elevated border border-accent-dim/30 rounded-md shadow-lg
                     overflow-hidden animate-fade-in"
          role="listbox"
          aria-label="Output formats"
        >
          {formats.map((fmt) => (
            <button
              key={fmt}
              role="option"
              aria-selected={fmt === selectedFormat}
              onClick={() => {
                onFormatChange(fmt);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-[11px] font-display tracking-wider uppercase
                         transition-colors duration-100
                         focus-visible:outline-none focus-visible:bg-accent/10
                         ${fmt === selectedFormat
                           ? "text-accent bg-accent/10"
                           : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                         }`}
            >
              .{fmt.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
