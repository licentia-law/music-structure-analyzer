'use client';

import React, { useState, useEffect } from 'react';
import { useLang } from '@/hooks/useLang';
import AppTooltip from '@/components/common/AppTooltip';

const LangToggle: React.FC = () => {
  const { lang, toggleLang, tr } = useLang();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const tooltipLabel = mounted ? tr('nav.langToggle') : 'Switch language';
  const buttonLabel = mounted ? (lang === 'en' ? 'KR' : 'EN') : 'KR';

  return (
    <AppTooltip content={tooltipLabel}>
      <button
        onClick={toggleLang}
        className="
          px-2 py-1 rounded-lg text-xs font-semibold tracking-wide
          bg-gray-100 dark:bg-gray-800
          hover:bg-gray-200 dark:hover:bg-gray-700
          text-gray-700 dark:text-gray-200
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
          min-w-[2rem]
        "
        aria-label={tooltipLabel}
        suppressHydrationWarning
      >
        {buttonLabel}
      </button>
    </AppTooltip>
  );
};

export default LangToggle;
