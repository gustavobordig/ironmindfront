import React from 'react';
import { ImageBackground, StyleSheet, ViewStyle } from 'react-native';

interface AppBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * Componente wrapper global que renderiza o background fixo do app
 * A imagem fica em cover, fixa, e todo o conteúdo renderiza por cima
 * A imagem não rola, apenas o conteúdo rola por cima
 */
export default function AppBackground({ children, style }: AppBackgroundProps) {
  return (
    <ImageBackground
      source={require('@/app/assets/images/appBg.png')}
      style={[styles.container, style]}
      resizeMode="cover"
      imageStyle={styles.imageStyle}
    >
      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  imageStyle: {
    resizeMode: 'cover',
  },
});

