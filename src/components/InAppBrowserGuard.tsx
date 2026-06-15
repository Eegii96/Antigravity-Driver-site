'use client';

import { useEffect } from 'react';

export default function InAppBrowserGuard() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    
    // Check if the user is inside an in-app browser (Facebook, Messenger, Instagram, WhatsApp, etc.)
    const isInApp = /FBAN|FBAV|Instagram|Messenger|FB_IAB|FB4A|FBIOS|WhatsApp|Telegram|Twitter|TwitterAndroid|TwitteriPhone|Line|Viber|MicroMessenger/i.test(ua);
    const isAndroid = /Android/i.test(ua);

    if (isInApp && isAndroid) {
      try {
        // For Android, automatically trigger intent to open in Chrome/Default browser
        const cleanUrl = window.location.href.replace(/^https?:\/\//, '');
        const intentUrl = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
        window.location.href = intentUrl;
      } catch (e) {
        console.error('Failed to trigger Android auto-redirect intent', e);
      }
    }
  }, []);

  // Always return null to prevent displaying any visual overlay, popups, or warnings
  return null;
}
