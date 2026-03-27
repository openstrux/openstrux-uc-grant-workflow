/**
 * Mock for next/headers used in test environments.
 * Provides a mutable in-memory cookie store.
 */

interface CookieStore {
  get: (name: string) => { value: string } | undefined;
  set: (name: string, value: string, opts?: object) => void;
  delete: (name: string) => void;
}

let cookieStore: Map<string, string> = new Map();

export function __setCookie(name: string, value: string) {
  cookieStore.set(name, value);
}

export function __clearCookies() {
  cookieStore = new Map();
}

export async function cookies(): Promise<CookieStore> {
  return {
    get: (name: string) => {
      const value = cookieStore.get(name);
      return value !== undefined ? { value } : undefined;
    },
    set: (name: string, value: string) => {
      cookieStore.set(name, value);
    },
    delete: (name: string) => {
      cookieStore.delete(name);
    },
  };
}
