import Link from 'next/link';
import BrandMark from './BrandMark';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  href?: string;
  className?: string;
  variant?: 'default' | 'light';
}

const sizes = {
  sm: { icon: 32, title: 'text-sm', gap: 'gap-2' },
  md: { icon: 36, title: 'text-base', gap: 'gap-2.5' },
  lg: { icon: 48, title: 'text-xl', gap: 'gap-3' },
};

export default function AppLogo({
  size = 'md',
  showText = true,
  href,
  className = '',
  variant = 'default',
}: AppLogoProps) {
  const s = sizes[size];
  const light = variant === 'light';

  const content = (
    <span className={`inline-flex items-center ${s.gap} ${className}`.trim()}>
      <BrandMark size={s.icon} />
      {showText && (
        <span className="flex flex-col min-w-0 leading-tight">
          <span className={`font-bold tracking-tight ${s.title} ${light ? 'text-white' : 'text-heading'}`}>
            HealthGuard
          </span>
          {size === 'lg' && (
            <span className={`text-xs font-medium ${light ? 'text-teal-100' : 'text-teal-700 dark:text-teal-400'}`}>
              Sức khỏe thông minh
            </span>
          )}
        </span>
      )}
    </span>
  );

  if (href) {
    return <Link href={href} className="inline-flex items-center">{content}</Link>;
  }
  return content;
}
