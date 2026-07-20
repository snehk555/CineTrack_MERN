import { useState, useCallback } from 'react';

/**
 * Generic localStorage hook with JSON serialization.
 * Returns [value, setValue, removeValue] — same API as useState.
 *
 * Usage:
 *   const [theme, setTheme] = useLocalStorage('theme', 'dark');
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore =
          typeof value === 'function'
            ? (value as (prev: T) => T)(storedValue)
            : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.warn(`[useLocalStorage] Failed to set key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      setStoredValue(defaultValue);
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }, [key, defaultValue]);

  return [storedValue, setValue, removeValue];
}
