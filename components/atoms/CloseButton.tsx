import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { colors } from '@/constants/colors';

export interface CloseButtonProps {
  onPress: () => void;
  size?: number;
  color?: string;
}

/**
 * Componente CloseButton (Atom)
 * Botão de fechar com ícone X
 * 
 * @param onPress - Callback chamado ao pressionar
 * @param size - Tamanho do ícone (padrão: 24)
 * @param color - Cor do ícone (padrão: textSecondary)
 */
export default function CloseButton({ 
  onPress, 
  size = 24, 
  color = colors.textSecondary 
}: CloseButtonProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      activeOpacity={0.7}
    >
      <X size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
});
