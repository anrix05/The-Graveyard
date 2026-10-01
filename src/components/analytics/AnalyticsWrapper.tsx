'use client';

import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { IS_ANALYTICS_ENABLED } from '@/lib/env';
import { isAnalyticsOptedOut } from '@/lib/analytics';

export default function AnalyticsWrapper() {
  if (!IS_ANALYTICS_ENABLED) {
    return null;
  }

  return (
    <>
      <Analytics
        beforeSend={(event) => {
          if (isAnalyticsOptedOut()) {
            return null; // drop event
          }
          return event;
        }}
      />
      <SpeedInsights
        beforeSend={(data) => {
          if (isAnalyticsOptedOut()) {
            return null; // drop event
          }
          return data;
        }}
      />
    </>
  );
}
