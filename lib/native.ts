// ============================================
// Native Platform Features
// ============================================
// Provides native functionality when running as a Capacitor app.
// Falls back gracefully to web APIs when running in browser.

import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Share, ShareOptions, ShareResult } from '@capacitor/share';
import { App, AppState, BackButtonListenerEvent } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard, KeyboardInfo } from '@capacitor/keyboard';

// ============================================
// Platform Detection
// ============================================

/**
 * Check if running as a native app (iOS/Android)
 */
export const isNative = Capacitor.isNativePlatform();

/**
 * Get the current platform
 */
export const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

/**
 * Check if running on iOS
 */
export const isIOS = platform === 'ios';

/**
 * Check if running on Android
 */
export const isAndroid = platform === 'android';

// ============================================
// Haptic Feedback
// ============================================

/**
 * Haptic feedback utilities for native feel
 */
export const haptic = {
  /**
   * Light impact - for subtle interactions like button taps
   */
  light: async (): Promise<void> => {
    if (isNative) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
  },

  /**
   * Medium impact - for more noticeable interactions like train controls
   */
  medium: async (): Promise<void> => {
    if (isNative) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    }
  },

  /**
   * Heavy impact - for significant actions like emergency stop
   */
  heavy: async (): Promise<void> => {
    if (isNative) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    }
  },

  /**
   * Success notification - for achievements, completed actions
   */
  success: async (): Promise<void> => {
    if (isNative) {
      await Haptics.notification({ type: NotificationType.Success });
    }
  },

  /**
   * Warning notification - for alerts, low token balance
   */
  warning: async (): Promise<void> => {
    if (isNative) {
      await Haptics.notification({ type: NotificationType.Warning });
    }
  },

  /**
   * Error notification - for errors, failed actions
   */
  error: async (): Promise<void> => {
    if (isNative) {
      await Haptics.notification({ type: NotificationType.Error });
    }
  },

  /**
   * Selection changed - for picker/selection feedback
   */
  selection: async (): Promise<void> => {
    if (isNative) {
      await Haptics.selectionChanged();
    }
  },

  /**
   * Vibrate for a specific duration (Android only)
   */
  vibrate: async (duration: number = 300): Promise<void> => {
    if (isNative) {
      await Haptics.vibrate({ duration });
    }
  },
};

// ============================================
// Native Share
// ============================================

/**
 * Share content using native share sheet
 * Falls back to Web Share API or clipboard on web
 */
export async function nativeShare(options: ShareOptions): Promise<ShareResult | null> {
  if (isNative) {
    try {
      return await Share.share(options);
    } catch (error) {
      console.error('Native share failed:', error);
      return null;
    }
  }

  // Web fallback
  if (navigator.share) {
    try {
      await navigator.share({
        title: options.title,
        text: options.text,
        url: options.url,
      });
      return { activityType: 'web-share' };
    } catch (error) {
      // User cancelled or error
      console.error('Web share failed:', error);
    }
  }

  // Clipboard fallback
  const text = [options.title, options.text, options.url].filter(Boolean).join('\n');
  try {
    await navigator.clipboard.writeText(text);
    return { activityType: 'clipboard' };
  } catch (error) {
    console.error('Clipboard copy failed:', error);
    return null;
  }
}

/**
 * Check if native share is available
 */
export async function canShare(): Promise<boolean> {
  if (isNative) {
    const result = await Share.canShare();
    return result.value;
  }
  return !!navigator.share || !!navigator.clipboard;
}

// ============================================
// App Lifecycle
// ============================================

type AppStateCallback = (state: AppState) => void;
type BackButtonCallback = (event: BackButtonListenerEvent) => void;

const appStateListeners: AppStateCallback[] = [];
const backButtonListeners: BackButtonCallback[] = [];

/**
 * Initialize app lifecycle listeners
 * Call this once in your app's root component
 */
export function initAppListeners(): () => void {
  if (!isNative) {
    return () => {};
  }

  let stateHandle: { remove: () => void } | null = null;
  let backHandle: { remove: () => void } | null = null;

  // App state changes (foreground/background)
  App.addListener('appStateChange', (state) => {
    appStateListeners.forEach((callback) => {
      try {
        callback(state);
      } catch (error) {
        console.error('App state listener error:', error);
      }
    });
  }).then((handle) => {
    stateHandle = handle;
  });

  // Android back button
  App.addListener('backButton', (event) => {
    backButtonListeners.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('Back button listener error:', error);
      }
    });
  }).then((handle) => {
    backHandle = handle;
  });

  // Return cleanup function
  return () => {
    stateHandle?.remove();
    backHandle?.remove();
  };
}

/**
 * Subscribe to app state changes
 */
export function onAppStateChange(callback: AppStateCallback): () => void {
  appStateListeners.push(callback);
  return () => {
    const index = appStateListeners.indexOf(callback);
    if (index > -1) {
      appStateListeners.splice(index, 1);
    }
  };
}

/**
 * Subscribe to Android back button presses
 */
export function onBackButton(callback: BackButtonCallback): () => void {
  backButtonListeners.push(callback);
  return () => {
    const index = backButtonListeners.indexOf(callback);
    if (index > -1) {
      backButtonListeners.splice(index, 1);
    }
  };
}

/**
 * Exit the app (Android only)
 */
export async function exitApp(): Promise<void> {
  if (isAndroid) {
    await App.exitApp();
  }
}

/**
 * Get app info (version, build, etc.)
 */
export async function getAppInfo() {
  if (isNative) {
    return await App.getInfo();
  }
  return {
    name: 'Railroad Arcade',
    id: 'com.railroadarcade.app',
    build: '1',
    version: '1.2.0',
  };
}

// ============================================
// Status Bar
// ============================================

/**
 * Set status bar style
 */
export async function setStatusBarStyle(style: 'dark' | 'light'): Promise<void> {
  if (isNative) {
    await StatusBar.setStyle({
      style: style === 'dark' ? Style.Dark : Style.Light,
    });
  }
}

/**
 * Set status bar background color
 */
export async function setStatusBarColor(color: string): Promise<void> {
  if (isAndroid) {
    await StatusBar.setBackgroundColor({ color });
  }
}

/**
 * Hide status bar
 */
export async function hideStatusBar(): Promise<void> {
  if (isNative) {
    await StatusBar.hide();
  }
}

/**
 * Show status bar
 */
export async function showStatusBar(): Promise<void> {
  if (isNative) {
    await StatusBar.show();
  }
}

// ============================================
// Splash Screen
// ============================================

/**
 * Hide the splash screen
 */
export async function hideSplashScreen(fadeOutDuration: number = 500): Promise<void> {
  if (isNative) {
    await SplashScreen.hide({ fadeOutDuration });
  }
}

/**
 * Show the splash screen
 */
export async function showSplashScreen(): Promise<void> {
  if (isNative) {
    await SplashScreen.show({
      autoHide: false,
    });
  }
}

// ============================================
// Keyboard
// ============================================

type KeyboardCallback = (info: KeyboardInfo) => void;

/**
 * Subscribe to keyboard show events
 */
export function onKeyboardShow(callback: KeyboardCallback): () => void {
  if (!isNative) return () => {};
  let handle: { remove: () => void } | null = null;
  Keyboard.addListener('keyboardWillShow', callback).then((h) => {
    handle = h;
  });
  return () => handle?.remove();
}

/**
 * Subscribe to keyboard hide events
 */
export function onKeyboardHide(callback: () => void): () => void {
  if (!isNative) return () => {};
  let handle: { remove: () => void } | null = null;
  Keyboard.addListener('keyboardWillHide', callback).then((h) => {
    handle = h;
  });
  return () => handle?.remove();
}

/**
 * Hide the keyboard
 */
export async function hideKeyboard(): Promise<void> {
  if (isNative) {
    await Keyboard.hide();
  }
}

// ============================================
// URL Handling
// ============================================

/**
 * Open a URL in the default browser
 */
export async function openExternalUrl(url: string): Promise<void> {
  // Use window.open for all platforms - works in Capacitor WebView too
  window.open(url, '_blank', 'noopener,noreferrer');
}

// ============================================
// Safe Area Insets
// ============================================

/**
 * Get safe area insets for notched devices
 * Returns CSS env() values as fallback for web
 */
export function getSafeAreaInsets() {
  return {
    top: 'env(safe-area-inset-top, 0px)',
    right: 'env(safe-area-inset-right, 0px)',
    bottom: 'env(safe-area-inset-bottom, 0px)',
    left: 'env(safe-area-inset-left, 0px)',
  };
}

// ============================================
// Convenience Hooks (for React)
// ============================================

/**
 * Hook-ready initialization function
 * Usage: useEffect(() => initNative(), [])
 */
export function initNative(): () => void {
  if (!isNative) return () => {};

  // Set initial status bar style
  setStatusBarStyle('dark');
  setStatusBarColor('#050508');

  // Hide splash after a brief delay
  setTimeout(() => {
    hideSplashScreen();
  }, 500);

  // Initialize app listeners
  return initAppListeners();
}
