export function initTelegramWebApp() {
  if (typeof window === 'undefined') return;

  // Check if Telegram WebApp is available
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    
    // Initialize the WebApp
    tg.ready();
    tg.expand();
    
    // Set theme based on Telegram's color scheme
    if (tg.colorScheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Apply Golden Palace theme colors
    tg.setHeaderColor('#1a1a1a'); // secondary background
    tg.setBackgroundColor('#000000'); // main background
    
    // Enable closing confirmation for user safety
    tg.enableClosingConfirmation();
    
    // Handle main button events
    tg.onEvent('mainButtonClicked', () => {
      console.log('Main button clicked');
    });
    
    // Handle back button events
    tg.onEvent('backButtonClicked', () => {
      console.log('Back button clicked');
      window.history.back();
    });
    
    // Handle viewport changes
    tg.onEvent('viewportChanged', () => {
      console.log('Viewport changed:', {
        height: tg.viewportHeight,
        stableHeight: tg.viewportStableHeight,
        isExpanded: tg.isExpanded
      });
    });
    
    console.log('Telegram WebApp initialized:', {
      platform: tg.platform,
      version: tg.version,
      colorScheme: tg.colorScheme,
      user: tg.initDataUnsafe.user
    });
    
    return tg;
  } else {
    console.warn('Telegram WebApp not available - running in browser mode');
    
    // For development/testing outside Telegram
    document.documentElement.classList.add('dark');
    
    return null;
  }
}

export function isTelegramWebApp(): boolean {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
}

export function getTelegramUser() {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp.initDataUnsafe.user;
  }
  return null;
}

export function closeTelegramWebApp() {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    window.Telegram.WebApp.close();
  }
}

export function showTelegramAlert(message: string, callback?: () => void) {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    window.Telegram.WebApp.showAlert(message, callback);
  } else {
    alert(message);
    callback?.();
  }
}

export function showTelegramConfirm(message: string, callback?: (confirmed: boolean) => void) {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    window.Telegram.WebApp.showConfirm(message, callback);
  } else {
    const result = confirm(message);
    callback?.(result);
  }
}

export function openTelegramLink(url: string) {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    window.Telegram.WebApp.openTelegramLink(url);
  } else {
    window.open(url, '_blank');
  }
}

export function sendDataToTelegramBot(data: string) {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    window.Telegram.WebApp.sendData(data);
  } else {
    console.log('Would send data to Telegram bot:', data);
  }
}
