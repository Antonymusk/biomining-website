import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce rapid state updates (e.g., search queries)
 * @param {any} value - The state value to debounce
 * @param {number} delay - Delay in milliseconds (default 300ms)
 * @returns {any} The debounced state value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
