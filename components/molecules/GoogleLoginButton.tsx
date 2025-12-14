import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { colors } from '@/constants/colors';

interface GoogleLoginButtonProps {
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

/**
 * Componente Botão de Login Google - Molecule
 * Botão estilizado para autenticação com Google
 */
export default function GoogleLoginButton({
  onPress,
  isLoading = false,
  disabled = false,
}: GoogleLoginButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, (isLoading || disabled) && styles.buttonDisabled]}
      onPress={onPress}
      disabled={isLoading || disabled}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.textPrimary} size="small" />
      ) : (
        <View style={styles.content}>
          {/* Ícone do Google - pode ser substituído por uma imagem */}
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>G</Text>
          </View>
          <Text style={styles.buttonText}>Continuar com Google</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.textSecondary + '30',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600' as const,
  },
});

