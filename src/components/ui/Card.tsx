import React from "react";

interface CardProps {
  children: React.ReactNode;
  title?: string;
  action?: React.ReactNode;
  className?: string;
  hoverLift?: boolean;
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  action,
  className = "",
  hoverLift = false,
  glass = true,
}) => {
  const cardBaseStyle = glass ? "glass-card" : "bg-surface-container-lowest border border-border-light";
  const hoverStyle = hoverLift ? "hover-lift shadow-sm" : "shadow-sm";

  return (
    <div className={`${cardBaseStyle} rounded-xl p-space-lg flex flex-col gap-space-md ${hoverStyle} ${className}`}>
      {/* Optional Card Header */}
      {(title || action) && (
        <div className="flex justify-between items-center border-b border-border-light/10 pb-space-sm mb-1">
          {title && (
            <h3 className="font-headline-md text-headline-md text-primary font-bold">
              {title}
            </h3>
          )}
          {action && <div className="text-secondary">{action}</div>}
        </div>
      )}
      
      {/* Card Content Body */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
};
export default Card;
