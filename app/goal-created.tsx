import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkout } from '@/contexts/WorkoutContext';
import AppBackground from '@/components/organisms/AppBackground';

export default function GoalCreatedScreen() {
  const { exerciseId, targetKg } = useLocalSearchParams<{ exerciseId: string; targetKg: string }>();
  const { allExercises } = useWorkout();
  
  const exercise = useMemo(() => {
    return allExercises.find(ex => ex.id === exerciseId);
  }, [allExercises, exerciseId]);

  const handleContinue = () => {
    router.replace(`/exercise-details?exerciseId=${exerciseId}`);
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.content}>
          {/* Título */}
          <Text style={styles.title}>Meta Criada!</Text>
          
          {/* Texto de confirmação */}
          <Text style={styles.message}>
            Boa! Meta definida como{' '}
            <Text style={styles.highlight}>{targetKg} kg</Text>
            {exercise && ` no ${exercise.name}.`}
          </Text>

          {/* Ilustração discreta */}
          <View style={styles.illustrationContainer}>
            <Image
              source={require('@/app/assets/images/peso.png')}
              style={styles.pesoImage}
              resizeMode="contain"
            />
            {/* Partículas laranja */}
            {[...Array(6)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.particle,
                  {
                    top: `${20 + i * 10}%`,
                    left: `${15 + (i % 3) * 30}%`,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* CTA */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.92)',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.70)',
    textAlign: 'center',
    marginBottom: 48,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  highlight: {
    color: '#FF8A3D',
    fontWeight: '700' as const,
  },
  illustrationContainer: {
    width: 200,
    height: 200,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  pesoImage: {
    width: 150,
    height: 150,
  },
  particle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF8A3D',
    position: 'absolute',
    opacity: 0.6,
  },
  footer: {
    width: '100%',
    paddingBottom: 20,
  },
  continueButton: {
    backgroundColor: '#FF8A3D',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.92)',
  },
});

