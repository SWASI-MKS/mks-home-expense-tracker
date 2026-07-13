import { useEffect } from 'react';

type KeyCombo = {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
};

export function useKeyboardShortcut(
  combo: KeyCombo,
  callback: (e: KeyboardEvent) => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const matchKey = e.key.toLowerCase() === combo.key.toLowerCase();
      const matchCtrl = combo.ctrlKey ? (e.ctrlKey || e.metaKey) : true;
      const matchAlt = combo.altKey ? e.altKey : true;
      const matchShift = combo.shiftKey ? e.shiftKey : true;

      if (matchKey && matchCtrl && matchAlt && matchShift) {
        e.preventDefault();
        callback(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [combo, callback, enabled]);
}
