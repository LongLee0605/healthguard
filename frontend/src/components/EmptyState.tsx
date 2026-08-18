import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  IconComponent?: LucideIcon;
}

export default function EmptyState({ icon, title, description, action, IconComponent }: EmptyStateProps) {
  return (
    <div className="text-center py-10 px-4 animate-fade-in">
      <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-800 flex items-center justify-center">
        {IconComponent ? (
          <IconComponent className="w-7 h-7 text-teal-700 dark:text-teal-400" />
        ) : (
          <span className="text-2xl">{icon}</span>
        )}
      </div>
      <p className="font-semibold text-heading">{title}</p>
      <p className="text-caption mt-1.5 max-w-xs mx-auto text-sm leading-relaxed">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
