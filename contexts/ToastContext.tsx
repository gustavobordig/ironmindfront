import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useState } from 'react';

export const [ToastProvider, useToast] = createContextHook(() => {
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showToast = useCallback((
    message: string,
    type: 'success' | 'error' | 'info' = 'info'
  ) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  }, []);

  const hideToast = useCallback(() => {
    setToastVisible(false);
  }, []);

  return {
    toastMessage,
    toastVisible,
    toastType,
    showToast,
    hideToast,
  };
});

