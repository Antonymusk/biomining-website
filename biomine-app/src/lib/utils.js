import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { lazy } from "react";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Wraps React.lazy with dynamic import error recovery logic.
 * Automatically reloads the page once if fetching the module fails 
 * due to updated deployment assets.
 */
export function lazyWithRetry(componentImport) {
  return lazy(async () => {
    const key = 'biomine-app-asset-reload';
    const hasReloaded = sessionStorage.getItem(key);

    try {
      const component = await componentImport();
      // If loaded successfully, ensure we clear the session flag
      sessionStorage.removeItem(key);
      return component;
    } catch (error) {
      console.error('Dynamic import failed:', error);
      
      const errorStr = error?.message || error?.toString() || '';
      const isChunkLoadError = 
        /Failed to fetch dynamically imported module/i.test(errorStr) ||
        /Importing a module script failed/i.test(errorStr) ||
        /Loading chunk/i.test(errorStr);

      if (isChunkLoadError && !hasReloaded) {
        sessionStorage.setItem(key, 'true');
        // Perform a hard reload to pull new index.html and assets
        window.location.reload();
        // Return a non-resolving promise to keep Suspense active during reload
        return new Promise(() => {});
      }

      throw error;
    }
  });
}
