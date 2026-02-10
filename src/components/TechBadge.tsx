import { TECH_ICONS } from '@/types/project';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';

interface TechBadgeProps {
  tech: string;
  className?: string;
}

const TechBadge = ({ tech, className }: TechBadgeProps) => {
  const normalizedTech = tech.toLowerCase();
  const iconData = TECH_ICONS[normalizedTech];
  
  // Dynamically get the icon component from Lucide
  // If not found, default to 'Code' icon
  // @ts-ignore - Dynamic access to icons
  const IconComponent = iconData ? Icons[iconData.icon] : Icons.Code;
  const FinalIcon = IconComponent || Icons.Code;

  const color = iconData?.color || '#9ca3af';

  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono font-medium uppercase tracking-wider border transition-colors",
        className
      )}
      style={{
        borderColor: `${color}40`, // 25% opacity
        backgroundColor: `${color}10`, // 10% opacity
        color: color
      }}
    >
      <FinalIcon className="w-3 h-3" />
      {iconData?.name || tech}
    </span>
  );
};

export default TechBadge;