import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Палитра витрины ───────────────────────────────────────────
        // Белый лист, чёрная типографика и один жёлтый акцент: он метит
        // только то, что нажимают — кнопку поиска, активный фильтр,
        // «в корзину», промо-баннер. Больше жёлтого нигде.
        accent:        '#FFC633',
        'accent-2':    '#F0B41F',  // нажатое состояние
        'accent-soft': '#FFF6DF',  // подложка бейджа со скидкой

        ink:        '#111111',  // основной текст и активные иконки
        'ink-2':    '#5B5B5F',  // подписи
        muted:      '#9A9AA0',  // неактивные вкладки, плейсхолдеры

        surface:     '#FFFFFF',  // карточки и панели
        'surface-2': '#F5F5F5',  // плитка под фото товара
        'surface-3': '#EFEFF0',  // нажатая плитка

        line:     '#EDEDED',   // границы карточек и полей
        'line-2': '#DFDFE0',   // границы активных полей

        // Статусы: заказы, наличие, ошибки форм.
        success:        '#1E9E5A',
        'success-soft': '#E6F5ED',
        warning:        '#C8860D',
        'warning-soft': '#FBF0DA',
        danger:         '#E03131',
        'danger-soft':  '#FCE9E9',
        info:           '#3B6FD4',
        'info-soft':    '#E8EFFB',

        like: '#F03E3E',  // залитое сердечко в избранном
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        card: '18px',
        tile: '14px',
      },
      boxShadow: {
        card:  '0 1px 2px rgba(17,17,17,0.04), 0 2px 8px rgba(17,17,17,0.04)',
        lift:  '0 8px 24px rgba(17,17,17,0.10)',
        // Таб-бар отделяется от контента тенью вверх, а не линией:
        // так он читается как накладная панель поверх прокрутки.
        tab:   '0 -2px 16px rgba(17,17,17,0.06)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'sheet-up': {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up':  'fade-up 0.25s ease-out',
        shimmer:    'shimmer 1.6s infinite linear',
        'sheet-up': 'sheet-up 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
