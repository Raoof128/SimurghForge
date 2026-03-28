import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { getGroupedFormats } from "../lib/formatMap";

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
  const groups = getGroupedFormats(filename);
  const allFormats = groups.flatMap((g) => g.formats);
  const [isOpen, setIsOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const hasMore = groups.length > 1 && groups[1].formats.length > 0;

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    // Count visible items to estimate height
    const visibleCount = showMore ? allFormats.length : (groups[0]?.formats.length ?? 0);
    const dropdownHeight = visibleCount * 30 + (hasMore ? 32 : 0) + 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top =
      spaceBelow < dropdownHeight && rect.top > dropdownHeight
        ? rect.top - dropdownHeight
        : rect.bottom + 4;

    setPosition({
      top,
      left: rect.right - 110,
    });
  }, [showMore, allFormats.length, groups, hasMore]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setShowMore(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reposition when showMore changes
  useEffect(() => {
    if (isOpen) updatePosition();
  }, [isOpen, showMore, updatePosition]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      setShowMore(false);
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (fmt: string) => {
    onFormatChange(fmt);
    setIsOpen(false);
    setShowMore(false);
  };

  // Check if selected format is in the "more" group
  const selectedInMore = groups.length > 1 && groups[1].formats.includes(selectedFormat);

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
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <path
            d="M1 1L5 5L9 1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed min-w-[110px] bg-bg-elevated border border-accent-dim/40 rounded-md shadow-xl
                     overflow-hidden animate-fade-in"
            style={{
              top: position.top,
              left: Math.max(8, position.left),
              zIndex: 9999,
            }}
            role="listbox"
            aria-label="Output formats"
          >
            {/* Common formats */}
            {groups[0]?.formats.map((fmt) => (
              <button
                key={fmt}
                role="option"
                aria-selected={fmt === selectedFormat}
                onClick={() => handleSelect(fmt)}
                className={`w-full text-left px-3 py-1.5 text-[11px] font-display tracking-wider uppercase
                         transition-colors duration-100
                         focus-visible:outline-none focus-visible:bg-accent/10
                         ${
                           fmt === selectedFormat
                             ? "text-accent bg-accent/10"
                             : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                         }`}
              >
                .{fmt.toUpperCase()}
              </button>
            ))}

            {/* "More" toggle + extra formats */}
            {hasMore && (
              <>
                {!showMore && !selectedInMore ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMore(true);
                    }}
                    className="w-full text-left px-3 py-1.5 text-[10px] font-display tracking-wider uppercase
                             text-text-muted/50 hover:text-text-muted hover:bg-bg-hover
                             transition-colors duration-100 border-t border-text-muted/8"
                  >
                    + {groups[1].formats.length} more
                  </button>
                ) : (
                  <>
                    <div className="border-t border-text-muted/8 mx-2 my-0.5" />
                    {groups[1].formats.map((fmt) => (
                      <button
                        key={fmt}
                        role="option"
                        aria-selected={fmt === selectedFormat}
                        onClick={() => handleSelect(fmt)}
                        className={`w-full text-left px-3 py-1.5 text-[11px] font-display tracking-wider uppercase
                                 transition-colors duration-100
                                 focus-visible:outline-none focus-visible:bg-accent/10
                                 ${
                                   fmt === selectedFormat
                                     ? "text-accent bg-accent/10"
                                     : "text-text-muted hover:text-text-primary hover:bg-bg-hover"
                                 }`}
                      >
                        .{fmt.toUpperCase()}
                      </button>
                    ))}
                  </>
                )}
              </>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
