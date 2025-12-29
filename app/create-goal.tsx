import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Minus, Plus } from 'lucide-react-native';
import { useWorkout } from '@/contexts/WorkoutContext';
import HeaderGlass from '@/components/molecules/HeaderGlass';
import AppBackground from '@/components/organisms/AppBackground';
import * as goalsService from '@/services/goals.service';
import * as statsService from '@/services/stats.service';

export default function CreateGoalScreen() {
  const { exerciseId, goalId } = useLocalSearchParams<{ exerciseId: string; goalId?: string }>();
  const { allExercises, getPersonalRecord } = useWorkout();
  
  const [targetKg, setTargetKg] = useState<number>(50);
  const [isCustomWeight, setIsCustomWeight] = useState(false);
  const [customWeightInput, setCustomWeightInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [bestKg, setBestKg] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const exercise = useMemo(() => {
    return allExercises.find(ex => ex.id === exerciseId);
  }, [allExercises, exerciseId]);

  useEffect(() => {
    if (!exerciseId) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const pr = await getPersonalRecord(exerciseId);
        if (pr) {
          setBestKg(pr.weight);
          // Sugerir pesos baseados no PR
          const suggestedWeights = [
            Math.round(pr.weight * 1.1),
            Math.round(pr.weight * 1.2),
            Math.round(pr.weight * 1.3),
          ];
          setTargetKg(suggestedWeights[1]); // Usar o segundo como padrão
        }
      } catch (error) {
        console.error('Error loading PR:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [exerciseId, getPersonalRecord]);

  const suggestedWeights = useMemo(() => {
    if (!bestKg) return [42, 45, 50];
    return [
      Math.round(bestKg * 1.1),
      Math.round(bestKg * 1.2),
      Math.round(bestKg * 1.3),
    ];
  }, [bestKg]);

  const handleWeightSelect = (weight: number) => {
    setTargetKg(weight);
    setIsCustomWeight(false);
    setCustomWeightInput('');
  };

  const handleCustomWeight = () => {
    setIsCustomWeight(true);
    setCustomWeightInput(targetKg.toString());
  };

  const handleWeightChange = (value: string) => {
    setCustomWeightInput(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setTargetKg(Math.round(numValue));
    }
  };

  const handleWeightStep = (delta: number) => {
    const newWeight = Math.max(0, targetKg + delta);
    setTargetKg(newWeight);
    if (isCustomWeight) {
      setCustomWeightInput(newWeight.toString());
    }
  };


  const handleConfirm = async () => {
    if (targetKg <= 0) {
      Alert.alert('Erro', 'O peso da meta deve ser maior que zero');
      return;
    }

    setIsSaving(true);
    try {
      if (goalId) {
        // Atualizar meta existente
        await goalsService.updateGoal(goalId, {
          targetKg,
        });
      } else {
        // Criar nova meta
        await goalsService.createGoal({
          exerciseId: exerciseId!,
          targetKg,
        });
      }

      // Navegar para feedback
      router.push(`/goal-created?exerciseId=${exerciseId}&targetKg=${targetKg}`);
    } catch (error: any) {
      console.error('Error saving goal:', error);
      Alert.alert('Erro', error?.message || 'Não foi possível salvar a meta. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (!exercise) {
    return (
      <AppBackground>
        <SafeAreaView style={styles.container} edges={['top']}>
          <HeaderGlass title="Criar Meta" onBack={handleCancel} />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Exercício não encontrado</Text>
          </View>
        </SafeAreaView>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <HeaderGlass
          title="Criar Meta"
          onBack={handleCancel}
        />
        
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Contexto do exercício */}
          <View style={styles.contextCard}>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            {bestKg && (
              <Text style={styles.contextText}>
                Melhor carga atual: {bestKg} kg
              </Text>
            )}
          </View>

          {/* Instrução */}
          <Text style={styles.instructionText}>
            Defina uma meta para o exercício
          </Text>

          {/* Seção: Peso da Meta */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Peso da Meta</Text>
            
            {/* Chips de sugestão */}
            <View style={styles.chipsContainer}>
              {suggestedWeights.map((weight) => (
                <TouchableOpacity
                  key={weight}
                  style={[
                    styles.weightChip,
                    !isCustomWeight && targetKg === weight && styles.weightChipSelected,
                  ]}
                  onPress={() => handleWeightSelect(weight)}
                >
                  <Text
                    style={[
                      styles.weightChipText,
                      !isCustomWeight && targetKg === weight && styles.weightChipTextSelected,
                    ]}
                  >
                    {weight} kg
                  </Text>
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity
                style={[
                  styles.weightChip,
                  isCustomWeight && styles.weightChipSelected,
                ]}
                onPress={handleCustomWeight}
              >
                <Text
                  style={[
                    styles.weightChipText,
                    isCustomWeight && styles.weightChipTextSelected,
                  ]}
                >
                  Custom…
                </Text>
              </TouchableOpacity>
            </View>

            {/* Input customizado ou display do peso selecionado */}
            {isCustomWeight ? (
              <View style={styles.weightInputContainer}>
                <TouchableOpacity
                  style={styles.weightInputButton}
                  onPress={() => handleWeightStep(-2)}
                >
                  <Minus size={20} color="#FF8A3D" />
                </TouchableOpacity>
                <TextInput
                  style={styles.weightInput}
                  value={customWeightInput}
                  onChangeText={handleWeightChange}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="rgba(255, 255, 255, 0.50)"
                />
                <Text style={styles.weightInputUnit}>kg</Text>
                <TouchableOpacity
                  style={styles.weightInputButton}
                  onPress={() => handleWeightStep(2)}
                >
                  <Plus size={20} color="#FF8A3D" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.weightDisplayContainer}>
                <TouchableOpacity
                  style={styles.weightDisplayButton}
                  onPress={() => handleWeightStep(-2)}
                >
                  <Minus size={20} color="#FF8A3D" />
                </TouchableOpacity>
                <Text style={styles.weightDisplayValue}>{targetKg} kg</Text>
                <TouchableOpacity
                  style={styles.weightDisplayButton}
                  onPress={() => handleWeightStep(2)}
                >
                  <Plus size={20} color="#FF8A3D" />
                </TouchableOpacity>
              </View>
            )}
          </View>

        </ScrollView>

        {/* CTA Fixo no Bottom */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.confirmButton, isSaving && styles.confirmButtonDisabled]}
            onPress={handleConfirm}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="rgba(255, 255, 255, 0.92)" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirmar Meta</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Espaço para o footer fixo
  },
  contextCard: {
    marginBottom: 24,
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.92)',
    marginBottom: 8,
  },
  contextText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.70)',
  },
  instructionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.92)',
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.70)',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  weightChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  weightChipSelected: {
    backgroundColor: '#FF8A3D',
    borderColor: '#FF8A3D',
  },
  weightChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.70)',
  },
  weightChipTextSelected: {
    color: 'rgba(255, 255, 255, 0.92)',
  },
  weightInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 13,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  weightInput: {
    flex: 1,
    padding: 16,
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FF8A3D',
    textAlign: 'center',
    backgroundColor: 'transparent',
  },
  weightInputUnit: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.70)',
  },
  weightInputButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 138, 61, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    borderRadius: 13,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  weightDisplayValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FF8A3D',
    minWidth: 80,
    textAlign: 'center',
  },
  weightDisplayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 138, 61, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 20,
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  confirmButton: {
    backgroundColor: '#FF8A3D',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.92)',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.70)',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.70)',
  },
});

