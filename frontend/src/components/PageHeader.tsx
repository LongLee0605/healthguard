interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between section animate-fade-in">
      <div className="min-w-0">
        <div className="page-header-accent" />
        <h1 className="text-xl sm:text-2xl font-bold text-heading tracking-tight">{title}</h1>
        {subtitle && <p className="text-caption mt-1 text-sm leading-relaxed max-w-2xl">{subtitle}</p>}
      </div>
      {action && (
        <div className="shrink-0 w-full sm:w-auto [&>button]:w-full sm:[&>button]:w-auto">
          {action}
        </div>
      )}
    </div>
  );
}
