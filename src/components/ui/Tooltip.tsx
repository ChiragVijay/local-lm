import { useState, useRef } from "react";
import { useClickOutside } from "../../hooks/useClickOutside";

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

export function Tooltip({ text, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setIsVisible(false), isVisible);

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsVisible(!isVisible)}
    >
      {children}
      {isVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-72">
          <div className="bg-popover border border-border rounded-lg shadow-xl p-3">
            <p className="text-sm text-foreground leading-relaxed">{text}</p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-1.5 border-4 border-transparent border-t-border" />
          </div>
        </div>
      )}
    </div>
  );
}
