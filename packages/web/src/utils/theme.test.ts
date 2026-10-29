import { beforeEach, describe, expect, it } from 'vitest';

import { initThemeToggle, SystemThemeQuery } from './theme';

let root: HTMLElement;
let button: HTMLButtonElement;
let storage: Storage;

const createStorage = (): Storage => {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => void values.delete(key),
    setItem: (key, value) => void values.set(key, value),
  };
};

const createBrokenStorage = (): Storage => ({
  ...createStorage(),
  getItem: () => {
    throw new Error('Storage is blocked');
  },
  setItem: () => {
    throw new Error('Storage is blocked');
  },
});

const createSystemTheme = (matches: boolean) => {
  const listeners: Array<() => void> = [];
  const systemTheme: SystemThemeQuery & { change: (matches: boolean) => void } = {
    matches,
    addEventListener: (_type, listener) => void listeners.push(listener),
    change: (nextMatches) => {
      systemTheme.matches = nextMatches;
      listeners.forEach((listener) => listener());
    },
  };

  return systemTheme;
};

const initToggle = (options: Partial<Parameters<typeof initThemeToggle>[0]> = {}) =>
  initThemeToggle({ button, root, getStorage: () => storage, systemTheme: createSystemTheme(false), ...options });

describe(initThemeToggle, () => {
  beforeEach(() => {
    root = document.createElement('html');
    button = document.createElement('button');
    storage = createStorage();
  });

  it('should follow the system theme when nothing is stored', () => {
    initToggle({ systemTheme: createSystemTheme(true) });

    expect(root.dataset.theme).toBeUndefined();
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('should apply the stored theme', () => {
    storage.setItem('guessir.theme', 'light');

    initToggle({ systemTheme: createSystemTheme(true) });

    expect(root.dataset.theme).toBe('light');
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('should ignore an unknown stored value', () => {
    storage.setItem('guessir.theme', 'sepia');

    initToggle();

    expect(root.dataset.theme).toBeUndefined();
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('should switch the theme on a click and remember it', () => {
    initToggle();

    button.click();

    expect(root.dataset.theme).toBe('dark');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(storage.getItem('guessir.theme')).toBe('dark');

    button.click();

    expect(root.dataset.theme).toBe('light');
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(storage.getItem('guessir.theme')).toBe('light');
  });

  it('should keep following the system theme while the user has not picked one', () => {
    const systemTheme = createSystemTheme(false);

    initToggle({ systemTheme });
    systemTheme.change(true);

    expect(button.getAttribute('aria-pressed')).toBe('true');

    button.click();

    expect(root.dataset.theme).toBe('light');
  });

  it('should not follow the system theme once the user has picked one', () => {
    const systemTheme = createSystemTheme(false);

    initToggle({ systemTheme });
    button.click();
    systemTheme.change(false);

    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('should still switch the theme when the storage is blocked', () => {
    initToggle({ getStorage: createBrokenStorage });

    button.click();

    expect(root.dataset.theme).toBe('dark');
  });

  it('should still switch the theme when even reaching the storage throws', () => {
    const getStorage = () => {
      throw new Error('Site data is blocked');
    };

    initToggle({ getStorage });

    button.click();

    expect(root.dataset.theme).toBe('dark');
  });
});
