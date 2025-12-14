import { Slot, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { WorkoutProvider } from '@/contexts/WorkoutContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ToastProvider, useToast } from '@/contexts/ToastContext';
import { requestNotificationPermissions } from '@/services/notifications';
import Toast from '@/components/atoms/Toast';

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toastMessage, toastVisible, toastType, hideToast } = useToast();
  const segments = useSegments();
  const router = useRouter();

  // Solicitar permissões de notificação ao iniciar o app
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'workout' || segments[0] === 'create-routine' || segments[0] === 'routine-details';

    if (!isAuthenticated && inAuthGroup) {
      // Redirecionar para login se não estiver autenticado
      router.replace('/login');
    } else if (isAuthenticated && (segments[0] === 'login' || segments[0] === 'register')) {
      // Redirecionar para tabs se já estiver autenticado e tentar acessar login/register
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  return (
    <View style={{ flex: 1 }}>
      <Slot />
      <Toast
        message={toastMessage}
        type={toastType}
        visible={toastVisible}
        onHide={hideToast}
        duration={toastType === 'success' ? 2500 : 3000}
      />
    </View>
  );
}

export default function RootLayout() {
  return (
    <ToastProvider>
      <AuthProvider>
        <WorkoutProvider>
          <RootLayoutNav />
        </WorkoutProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
