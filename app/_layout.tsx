import { Slot, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { WorkoutProvider } from '@/contexts/WorkoutContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { requestNotificationPermissions } from '@/services/notifications';

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
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

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <WorkoutProvider>
        <RootLayoutNav />
      </WorkoutProvider>
    </AuthProvider>
  );
}
