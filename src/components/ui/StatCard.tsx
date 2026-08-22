import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconBgClass?: string;
  trendText?: string;
  trendDirection?: "up" | "down" | "neutral";
  trendIcon?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  iconBgClass = "bg-surface-container-low text-primary",
  trendText,
  trendDirection = "neutral",
  trendIcon,
}) => {
  // Compute trend color accents
  let trendColor = "text-secondary";
  let fallbackTrendIcon = "trending_flat";

  if (trendDirection === "up") {
    trendColor = "text-success-text";
    fallbackTrendIcon = "trending_up";
  } else if (trendDirection === "down") {
    trendColor = "text-danger-text";
    fallbackTrendIcon = "trending_down";
  }

  const selectedTrendIcon = trendIcon || fallbackTrendIcon;

  return (
    <div className="glass-card border border-border-light rounded-xl p-space-lg flex flex-col gap-space-md shadow-sm hover-lift">
      <div className="flex justify-between items-start">
        <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
          {title}
        </span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconBgClass}`}>
          <span className="material-symbols-outlined text-[16px]">{icon}</span>
        </div>
      </div>
      
      <div className="font-headline-lg text-headline-lg text-primary font-bold">
        {value}
      </div>

      {trendText && (
        <div className={`flex items-center gap-space-xs ${trendColor} font-label-sm text-label-sm font-bold`}>
          <span className="material-symbols-outlined text-[14px]">{selectedTrendIcon}</span>
          <span>{trendText}</span>
        </div>
      )}
    </div>
  );
};
export default StatCard;
