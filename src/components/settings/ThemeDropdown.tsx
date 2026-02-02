import { useState, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "../../lib/utils";
import { themeVariants, type ThemeVariant } from "../../lib/themes";
import { useClickOutside } from "../../hooks/useClickOutside";

interface ThemeDropdownProps {
  value: ThemeVariant;
  onChange: (value: ThemeVariant) => void;
}

export function ThemeDropdown({ value, onChange }: ThemeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setIsOpen(false), isOpen);

  const selected = themeVariants.find((t) => t.id === value);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2",
          "bg-muted text-sm text-foreground",
          "hover:bg-muted/80 transition-colors",
          "min-w-[120px] justify-between",
        )}
      >
        <span className="font-medium">{selected?.name}</span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute top-full right-0 mt-2 w-48 z-50",
            "bg-popover border border-border rounded-lg shadow-xl",
            "animate-in fade-in-0 zoom-in-95 duration-100",
          )}
        >
          <div className="p-1.5">
            {themeVariants.map((theme) => {
              const isSelected = value === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => {
                    onChange(theme.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between rounded-md px-3 py-2.5",
                    "text-left transition-colors",
                    isSelected ? "bg-accent/10" : "hover:bg-muted",
                  )}
                >
                  <div>
                    <p className={cn("text-sm font-medium", isSelected && "text-accent")}>{theme.name}</p>
                    <p className="text-xs text-muted-foreground">{theme.description}</p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-accent" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
