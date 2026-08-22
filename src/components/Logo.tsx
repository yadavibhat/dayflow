import React from "react";

interface LogoProps {
  variant?: "full" | "icon";
  theme?: "dark" | "light" | "colored";
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export const Logo: React.FC<LogoProps> = ({
  variant = "full",
  theme = "dark",
  className = "",
  size = "md",
}) => {
  const color = theme === "light" ? "#FFFFFF" : "#111827";
  const accentColor = theme === "light" ? "#FFFFFF" : "#111827";

  const sizeMap = {
    sm: { iconSize: 24, height: 24, fontSize: 18, gap: 8 },
    md: { iconSize: 32, height: 32, fontSize: 22, gap: 10 },
    lg: { iconSize: 44, height: 44, fontSize: 28, gap: 12 },
    xl: { iconSize: 64, height: 64, fontSize: 40, gap: 16 },
  };

  const currentSize = sizeMap[size];

  return (
    <div
      className={`inline-flex items-center select-none ${className}`}
      style={{ gap: `${currentSize.gap}px` }}
    >
      {/* Monogram Symbol */}
      <svg
        width={currentSize.iconSize}
        height={currentSize.iconSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <g stroke={color} strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Main D contour */}
          <path d="M 22 18 H 52 C 72 18 84 32 84 50 C 84 66 72 82 50 82 H 22 Z" />
          {/* Inner flow loop */}
          <path d="M 22 52 C 22 72 38 82 52 82 C 72 82 82 60 70 42 C 58 26 40 32 38 48 V 70" />
        </g>
      </svg>

      {/* Wordmark */}
      {variant === "full" && (
        <span
          className="font-black tracking-wider uppercase leading-none font-sans"
          style={{
            fontSize: `${currentSize.fontSize}px`,
            color: accentColor,
            letterSpacing: "0.08em",
          }}
        >
          DAYFLOW
        </span>
      )}
    </div>
  );
};
