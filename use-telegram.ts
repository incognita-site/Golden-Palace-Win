import { useState, useEffect } from "react";

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    start_param?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: any;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  isClosingConfirmationEnabled: boolean;
  
  ready: () => void;
  expand: () => void;
  close: () => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  showPopup: (params: any, callback?: (buttonId: string) => void) => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  onEvent: (eventType: string, eventHandler: () => void) => void;
  offEvent: (eventType: string, eventHandler: () => void) => void;
  sendData: (data: string) => void;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink: (url: string) => void;
  openInvoice: (url: string, callback?: (status: string) => void) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export function useTelegram() {
  const [tg, setTg] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const telegram = window.Telegram.WebApp;
      setTg(telegram);
      setUser(telegram.initDataUnsafe.user || null);
      
      // Initialize Telegram WebApp
      telegram.ready();
      telegram.expand();
      setIsReady(true);

      // Set theme
      if (telegram.colorScheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // Set header and background colors to match our theme
      telegram.setHeaderColor('#1a1a1a'); // secondary color
      telegram.setBackgroundColor('#000000'); // background color

      // Enable closing confirmation for safety
      telegram.enableClosingConfirmation();

      return () => {
        telegram.disableClosingConfirmation();
      };
    }
  }, []);

  const showAlert = (message: string) => {
    if (tg) {
      tg.showAlert(message);
    } else {
      alert(message);
    }
  };

  const showConfirm = (message: string, callback?: (confirmed: boolean) => void) => {
    if (tg) {
      tg.showConfirm(message, callback);
    } else {
      const confirmed = confirm(message);
      callback?.(confirmed);
    }
  };

  const openLink = (url: string, options?: { try_instant_view?: boolean }) => {
    if (tg) {
      tg.openLink(url, options);
    } else {
      window.open(url, '_blank');
    }
  };

  const openTelegramLink = (url: string) => {
    if (tg) {
      tg.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return {
    tg,
    user,
    isReady,
    showAlert,
    showConfirm,
    openLink,
    openTelegramLink,
  };
}
