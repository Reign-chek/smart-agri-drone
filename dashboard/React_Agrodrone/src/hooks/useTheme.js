import { useEffect } from 'react';

export default function useTheme(theme) {
  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light');
  }, [theme]);
}
