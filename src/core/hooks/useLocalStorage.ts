import { useState, useEffect } from "react";
import { usePrevious } from "./usePrevious";

interface LocalStorageOptions<T> {
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: LocalStorageOptions<T> = {},
) {
  const prevKey = usePrevious(key);
  const {
    serializer = (value) => JSON.stringify(value),
    deserializer = (value) => JSON.parse(value),
  } = options;

  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? deserializer(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    if (key !== prevKey) {
      try {
        const item = window.localStorage.getItem(key);
        setValue(item !== null ? deserializer(item) : initialValue);
      } catch {
        setValue(initialValue);
      }
    }
  }, [key, prevKey, initialValue, deserializer]);

  useEffect(() => {
    try {
      localStorage.setItem(key, serializer(value));
    } catch {}
  }, [key, value, serializer]);

  return [value, setValue] as const;
}
