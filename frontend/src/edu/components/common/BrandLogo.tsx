import { cn } from '../../utils';
import { EDU_ASSETS } from '../../config';

interface BrandLogoProps {
  collapsed?: boolean;
  className?: string;
  variant?: 'light' | 'dark';
}

export function BrandLogo({ collapsed = false, className, variant = 'light' }: BrandLogoProps) {
  const base = EDU_ASSETS;

  if (collapsed) {
    return (
      // eslint-disable-next-line @next/next/no-html-link-for-pages -- уход из учебного центра на сайт — полной загрузкой, чтобы сбросить его Tailwind-стили
      <a href="/education" className={cn('flex items-center overflow-hidden', className)}>
        <img src={`${base}kse-mark.png`} alt="КФБ" className="h-10 w-10 object-contain" />
      </a>
    );
  }

  // На тёмном фоне полный логотип (светлый фон в PNG) смотрится плохо — mark + текст
  if (variant === 'dark') {
    return (
      // eslint-disable-next-line @next/next/no-html-link-for-pages -- уход из учебного центра на сайт — полной загрузкой, чтобы сбросить его Tailwind-стили
      <a href="/education" className={cn('flex items-center gap-3 overflow-hidden', className)}>
        <img src={`${base}kse-mark.png`} alt="КФБ" className="h-10 w-10 object-contain" />
        <div className="min-w-0">
          <div className="font-display text-[15px] font-semibold leading-tight tracking-[-0.04em] text-white">
            Учебный центр <span className="text-brand-200">КФБ</span>
          </div>
          <div className="text-[11px] font-medium text-white/70">Кыргызская фондовая биржа</div>
        </div>
      </a>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-html-link-for-pages -- уход из учебного центра на сайт — полной загрузкой, чтобы сбросить его Tailwind-стили
      <a href="/education" className={cn('flex min-w-0 items-center overflow-hidden', className)}>
      <img
        src={`${base}kse-logo.png`}
        alt="Кыргызская фондовая биржа"
        className="h-9 w-auto max-w-[200px] object-contain object-left sm:h-10 sm:max-w-[240px]"
      />
    </a>
  );
}
