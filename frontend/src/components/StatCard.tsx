import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  bg: string;
  IconComponent?: LucideIcon;
}

export default function StatCard({ label, value, icon, color, bg, IconComponent }: StatCardProps) {
  return (
    <div className="card-compact animate-fade-in hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-caption font-medium truncate">{label}</p>
          <p className={`text-2xl font-bold mt-1 tracking-tight ${color}`}>{value}</p>
        </div>
        <div className={`stat-icon shrink-0 ${bg}`}>
          {IconComponent ? <IconComponent className="w-5 h-5" /> : icon}
        </div>
      </div>
    </div>
  );
}
