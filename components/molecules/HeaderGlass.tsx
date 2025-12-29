import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';

interface HeaderGlassProps {
  title: string;
  rightAction?: {
    label?: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
  };
  onBack?: () => void;
}

export default function HeaderGlass({ title, rightAction, onBack }: HeaderGlassProps) {
  return (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0.05)',
          'rgba(255, 255, 255, 0.03)',
          'rgba(0, 0, 0, 0.35)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={onBack} 
            style={styles.headerButton}
            disabled={!onBack}
          >
            {onBack && <ArrowLeft size={24} color="rgba(255, 255, 255, 0.92)" />}
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          {rightAction ? (
            <TouchableOpacity 
              onPress={rightAction.onPress} 
              style={styles.headerButton}
              disabled={rightAction.disabled || rightAction.loading}
            >
              {rightAction.loading ? (
                <ActivityIndicator size="small" color="#FF8A3D" />
              ) : (
                <Text style={styles.saveText}>{rightAction.label}</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.headerButton} />
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerGradient: {
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingVertical: 14,
  },
  headerButton: {
    minWidth: 60,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.92)',
    flex: 1,
    textAlign: 'center',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FF8A3D',
    minWidth: 60,
    textAlign: 'right',
  },
});


