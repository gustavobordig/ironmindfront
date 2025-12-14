import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { router } from 'expo-router';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { ApiError } from '@/services/api';
import GoogleLoginButton from '@/components/molecules/GoogleLoginButton';
import Divider from '@/components/molecules/Divider';

export default function LoginScreen() {
  const { login, loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showToast('Por favor, preencha todos os campos', 'error');
      return;
    }

    if (!email.includes('@')) {
      showToast('Por favor, insira um email válido', 'error');
      return;
    }

    setIsLoading(true);

    try {
      await login({ email: email.trim(), password });
      
      // Mostrar toast de sucesso
      showToast('Login realizado com sucesso!', 'success');
      
      // Aguardar tempo suficiente para o toast aparecer e ser visível
      // Animação de entrada: 300ms + tempo de visualização: 2000ms = 2300ms total
      await new Promise(resolve => setTimeout(resolve, 2300));
      
      // Só então navegar
      setIsLoading(false);
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('Login error:', err);
      
      let errorMessage = 'Erro ao fazer login. Verifique sua conexão e tente novamente.';
      
      if (err instanceof ApiError) {
        // Tratar especificamente erro 401 (credenciais inválidas)
        if (err.statusCode === 401) {
          errorMessage = err.message || 'Credenciais inválidas. Verifique seu email e senha.';
        } else {
          errorMessage = err.message || 'Erro ao fazer login. Tente novamente.';
        }
      }
      
      setIsLoading(false);
      showToast(errorMessage, 'error');
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);

    try {
      await loginWithGoogle();
      showToast('Login com Google realizado com sucesso!', 'success');
      await new Promise(resolve => setTimeout(resolve, 2300));
      setIsGoogleLoading(false);
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('Google login error:', err);
      
      let errorMessage = 'Erro ao fazer login com Google. Tente novamente.';
      
      if (err.message?.includes('cancelado')) {
        errorMessage = 'Login cancelado';
      } else if (err.message?.includes('Client ID')) {
        errorMessage = 'Configuração do Google não encontrada. Entre em contato com o suporte.';
      } else if (err instanceof ApiError) {
        errorMessage = err.message || errorMessage;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setIsGoogleLoading(false);
      showToast(errorMessage, 'error');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Bem-vindo de volta!</Text>
              <Text style={styles.subtitle}>
                Entre para continuar acompanhando seu progresso
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Mail size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Lock size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Senha"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={colors.textSecondary} />
                  ) : (
                    <Eye size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.button, (isLoading || isGoogleLoading) && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.textOnPrimary} />
                ) : (
                  <Text style={styles.buttonText}>Entrar</Text>
                )}
              </TouchableOpacity>

              <Divider />

              <GoogleLoginButton
                onPress={handleGoogleLogin}
                isLoading={isGoogleLoading}
                disabled={isLoading}
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Não tem uma conta? </Text>
              <TouchableOpacity
                onPress={() => router.push('/register')}
                disabled={isLoading || isGoogleLoading}
              >
                <Text style={styles.footerLink}>Cadastre-se</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.textSecondary + '30',
    paddingHorizontal: 16,
    minHeight: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 4,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  footerLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
});

