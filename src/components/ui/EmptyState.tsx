import React from "react";

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-space-xl px-space-lg text-center ${className}`}>
      {/* Icon Wrapper */}
      <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center text-secondary mb-space-md shadow-inner">
        <span className="material-symbols-outlined text-[32px]">{icon}</span>
      </div>
      
      {/* Title */}
      <h4 className="font-label-md text-label-md text-primary font-bold mb-space-xs">
        {title}
      </h4>
      
      {/* Optional Description */}
      {description && (
        <p className="font-body-md text-body-md text-secondary max-w-sm mx-auto mb-space-md">
          {description}
        </p>
      )}
      
      {/* Optional CTA Button */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-space-sm bg-surface-container-lowest border border-border-light text-slate-700 font-label-md text-label-md px-space-md py-space-sm rounded-lg hover:bg-surface-container-low transition-colors duration-200 cursor-pointer shadow-sm active:scale-98"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
export default EmptyState;
