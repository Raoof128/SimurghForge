import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, openUp: false });

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = formats.length * 30 + 8; // approximate
    const openUp = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    setPosition({
      top: openUp ? rect.top - dropdownHeight : rect.bottom + 4,
      left: rect.right - 90, // align right edge roughly
      openUp,
    });
  }, [formats.length]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
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

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed min-w-[90px] bg-bg-elevated border border-accent-dim/40 rounded-md shadow-xl
                     overflow-hidden animate-fade-in"
          style={{
            top: position.top,
            left: Math.max(8, position.left),
            zIndex: 9999,
          }}
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
        </div>,
        document.body
      )}
    </>
  );
}
