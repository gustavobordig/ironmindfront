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
import { MuscleGroup, EquipmentType } from '@/types/workout';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | 'all'>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType | 'all'>('all');

  const exercise = useMemo(() => {
    return allExercises.find(ex => ex.id === exerciseId);
  }, [allExercises, exerciseId]);

  const filteredExercises = useMemo(() => {
    return allExercises.filter((ex) => {
      const matchesSearch = !searchQuery.trim() || 
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMuscleGroup = selectedMuscleGroup === 'all' || ex.muscleGroup === selectedMuscleGroup;
      const matchesEquipment = selectedEquipment === 'all' || ex.equipment === selectedEquipment;
      
      return matchesSearch && matchesMuscleGroup && matchesEquipment;
    });
  }, [allExercises, searchQuery, selectedMuscleGroup, selectedEquipment]);

  const muscleGroupLabels: Record<string, string> = {
    chest: 'Peito',
    back: 'Costas',
    shoulders: 'Ombros',
    biceps: 'Bíceps',
    triceps: 'Tríceps',
    legs: 'Pernas',
    core: 'Core',
    glutes: 'Glúteos',
    cardio: 'Cardio',
    other: 'Outros',
  };

  const handleExerciseSelect = (selectedExerciseId: string) => {
    router.setParams({ exerciseId: selectedExerciseId });
  };

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

  if (!exerciseId || !exercise) {
    return (
      <AppBackground>
        <SafeAreaView style={styles.container} edges={['top']}>
          <HeaderGlass title="Criar Meta" onBack={handleCancel} />
          
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <LinearGradient
                colors={[
                  'rgba(255, 255, 255, 0.05)',
                  'rgba(255, 255, 255, 0.03)',
                  'rgba(0, 0, 0, 0.35)',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.searchInputGradient}
              >
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar exercício"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="rgba(255, 255, 255, 0.50)"
                />
              </LinearGradient>
            </View>
          </View>

          <View style={styles.filtersContainer}>
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Grupo Muscular</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedMuscleGroup === 'all' && styles.filterChipSelected,
                  ]}
                  onPress={() => setSelectedMuscleGroup('all')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedMuscleGroup === 'all' && styles.filterChipTextSelected,
                    ]}
                  >
                    Todos
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedMuscleGroup === 'chest' && styles.filterChipSelected,
                  ]}
                  onPress={() => setSelectedMuscleGroup('chest')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedMuscleGroup === 'chest' && styles.filterChipTextSelected,
                    ]}
                  >
                    Peito
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedMuscleGroup === 'back' && styles.filterChipSelected,
                  ]}
                  onPress={() => setSelectedMuscleGroup('back')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedMuscleGroup === 'back' && styles.filterChipTextSelected,
                    ]}
                  >
                    Costas
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedMuscleGroup === 'shoulders' && styles.filterChipSelected,
                  ]}
                  onPress={() => setSelectedMuscleGroup('shoulders')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedMuscleGroup === 'shoulders' && styles.filterChipTextSelected,
                    ]}
                  >
                    Ombros
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedMuscleGroup === 'biceps' && styles.filterChipSelected,
                  ]}
                  onPress={() => setSelectedMuscleGroup('biceps')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedMuscleGroup === 'biceps' && styles.filterChipTextSelected,
                    ]}
                  >
                    Bíceps
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedMuscleGroup === 'triceps' && styles.filterChipSelected,
                  ]}
                  onPress={() => setSelectedMuscleGroup('triceps')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedMuscleGroup === 'triceps' && styles.filterChipTextSelected,
                    ]}
                  >
                    Tríceps
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedMuscleGroup === 'legs' && styles.filterChipSelected,
                  ]}
                  onPress={() => setSelectedMuscleGroup('legs')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedMuscleGroup === 'legs' && styles.filterChipTextSelected,
                    ]}
                  >
                    Pernas
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedMuscleGroup === 'glutes' && styles.filterChipSelected,
                  ]}
                  onPress={() => setSelectedMuscleGroup('glutes')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedMuscleGroup === 'glutes' && styles.filterChipTextSelected,
                    ]}
                  >
                    Glúteos
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedMuscleGroup === 'core' && styles.filterChipSelected,
                  ]}
                  onPress={() => setSelectedMuscleGroup('core')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedMuscleGroup === 'core' && styles.filterChipTextSelected,
                    ]}
                  >
                    Core
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Equipamento</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedEquipment === 'all' && styles.filterChipSelected,
                  ]}
                  onPress={() => setSelectedEquipment('all')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedEquipment === 'all' && styles.filterChipTextSelected,
                    ]}
                  >
                    Todos
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedEquipment === 'barra' && styles.filterChipSelected,
                  ]}
                  onPress={() => setSelectedEquipment('barra')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedEquipment === 'barra' && styles.filterChipTextSelected,
                    ]}
                  >
                    Barra
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedEquipment === 'halteres' && styles.filterChipSelected,
                  ]}
                  onPress={() => setSelectedEquipment('halteres')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedEquipment === 'halteres' && styles.filterChipTextSelected,
                    ]}
                  >
                    Halteres
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedEquipment === 'maquina' && styles.filterChipSelected,
                  ]}
                  onPress={() => setSelectedEquipment('maquina')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedEquipment === 'maquina' && styles.filterChipTextSelected,
                    ]}
                  >
                    Máquina
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedEquipment === 'cabo' && styles.filterChipSelected,
                  ]}
                  onPress={() => setSelectedEquipment('cabo')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedEquipment === 'cabo' && styles.filterChipTextSelected,
                    ]}
                  >
                    Cabo
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedEquipment === 'peso-corporal' && styles.filterChipSelected,
                  ]}
                  onPress={() => setSelectedEquipment('peso-corporal')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedEquipment === 'peso-corporal' && styles.filterChipTextSelected,
                    ]}
                  >
                    Peso Corporal
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>

          <ScrollView style={styles.exercisesList}>
            {filteredExercises.map((exercise) => (
              <TouchableOpacity
                key={exercise.id}
                style={styles.exerciseOptionContainer}
                onPress={() => handleExerciseSelect(exercise.id)}
                activeOpacity={0.7}
              >
                <View style={styles.exerciseOptionBody}>
                  <LinearGradient
                    colors={[
                      'rgba(255, 255, 255, 0.05)',
                      'rgba(255, 255, 255, 0.03)',
                      'rgba(0, 0, 0, 0.35)',
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.exerciseOptionGradient}
                  >
                    <Text style={styles.exerciseOptionName}>{exercise.name}</Text>
                    <Text style={styles.exerciseOptionGroup}>
                      {muscleGroupLabels[exercise.muscleGroup] || exercise.muscleGroup}
                    </Text>
                  </LinearGradient>
                </View>
                
                <View style={styles.exerciseOptionFrame} pointerEvents="none">
                  <View style={styles.exerciseOptionFrameBorderTop} />
                  <View style={styles.exerciseOptionFrameBorderBottom} />
                  <View style={styles.exerciseOptionFrameBorderLeft} />
                  <View style={styles.exerciseOptionFrameBorderRight} />
                  <View style={styles.exerciseOptionFrameStroke} />
                </View>
              </TouchableOpacity>
            ))}
            
            {filteredExercises.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  Nenhum exercício encontrado
                </Text>
              </View>
            )}
          </ScrollView>
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
                  activeOpacity={0.7}
                >
                  <Minus size={20} color="#FF8A3D" />
                </TouchableOpacity>
                <View style={styles.weightInputWrapper}>
                  <TextInput
                    style={styles.weightInput}
                    value={customWeightInput}
                    onChangeText={handleWeightChange}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="rgba(255, 255, 255, 0.50)"
                  />
                  <Text style={styles.weightInputUnit}>kg</Text>
                </View>
                <TouchableOpacity
                  style={styles.weightInputButton}
                  onPress={() => handleWeightStep(2)}
                  activeOpacity={0.7}
                >
                  <Plus size={20} color="#FF8A3D" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.weightDisplayContainer}>
                <TouchableOpacity
                  style={styles.weightDisplayButton}
                  onPress={() => handleWeightStep(-2)}
                  activeOpacity={0.7}
                >
                  <Minus size={20} color="#FF8A3D" />
                </TouchableOpacity>
                <Text style={styles.weightDisplayValue}>{targetKg} kg</Text>
                <TouchableOpacity
                  style={styles.weightDisplayButton}
                  onPress={() => handleWeightStep(2)}
                  activeOpacity={0.7}
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
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  weightInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    maxWidth: 200,
  },
  weightInput: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#FF8A3D',
    textAlign: 'center',
    paddingHorizontal: 8,
    minWidth: 60,
  },
  weightInputUnit: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.92)',
    marginLeft: 4,
  },
  weightInputButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 138, 61, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 8,
  },
  weightDisplayValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#FF8A3D',
    minWidth: 100,
    textAlign: 'center',
  },
  weightDisplayButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  searchContainer: {
    padding: 16,
    paddingTop: 24,
  },
  searchInputContainer: {
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
  searchInputGradient: {
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchInput: {
    padding: 16,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.92)',
    backgroundColor: 'transparent',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.70)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterChips: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    marginRight: 8,
  },
  filterChipSelected: {
    backgroundColor: '#FF8A3D',
    borderColor: '#FF8A3D',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.70)',
  },
  filterChipTextSelected: {
    color: 'rgba(255, 255, 255, 0.92)',
  },
  exercisesList: {
    flex: 1,
  },
  exerciseOptionContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    position: 'relative',
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
  exerciseOptionBody: {
    borderRadius: 13,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 12,
    marginLeft: 12,
    marginRight: 12,
  },
  exerciseOptionGradient: {
    padding: 16,
    borderRadius: 13,
  },
  exerciseOptionFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    zIndex: 1,
    overflow: 'hidden',
  },
  exerciseOptionFrameStroke: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  exerciseOptionFrameBorderTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: 'rgba(30, 31, 34, 0.40)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  exerciseOptionFrameBorderBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: 'rgba(30, 31, 34, 0.40)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  exerciseOptionFrameBorderLeft: {
    position: 'absolute',
    top: 12,
    left: 0,
    bottom: 12,
    width: 12,
    backgroundColor: 'rgba(30, 31, 34, 0.40)',
  },
  exerciseOptionFrameBorderRight: {
    position: 'absolute',
    top: 12,
    right: 0,
    bottom: 12,
    width: 12,
    backgroundColor: 'rgba(30, 31, 34, 0.40)',
  },
  exerciseOptionName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.92)',
    marginBottom: 4,
  },
  exerciseOptionGroup: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.70)',
    textTransform: 'capitalize',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.50)',
  },
});

