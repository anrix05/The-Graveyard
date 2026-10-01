'use client';

import React from 'react';
import { openCookieSettings } from '@/lib/cookie-settings';

export default function CookieSettingsTrigger({
  children = 'Cookie settings',
  className = 'text-brand-red underline hover:text-white cursor-pointer',
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={openCookieSettings}
      className={className}
    >
      {children}
    </button>
  );
}
