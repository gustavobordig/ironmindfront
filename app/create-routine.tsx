import { useWorkout } from '@/contexts/WorkoutContext';
import { router, useLocalSearchParams } from 'expo-router';
import { Plus, X, Trash2, ChevronDown, ChevronUp, Clock } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Exercise, RoutineExercise, DayOfWeek, MuscleGroup, EquipmentType } from '@/types/workout';
import { colors } from '@/constants/colors';
import Toast from '@/components/atoms/Toast';

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Gera opções de tempo de descanso de 30s em 30s até 5 minutos
const generateRestTimeOptions = () => {
  const options = [];
  const maxSeconds = 300; // 5 minutos
  
  for (let seconds = 30; seconds <= maxSeconds; seconds += 30) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    let label: string;
    if (seconds < 60) {
      label = `${seconds}s`;
    } else if (remainingSeconds === 0) {
      label = `${minutes}min 0s`;
    } else {
      label = `${minutes}min ${remainingSeconds}s`;
    }
    
    options.push({ seconds, label });
  }
  
  return options;
};

const REST_TIME_OPTIONS = generateRestTimeOptions();

// Formata o tempo de descanso em segundos para o formato legível
const formatRestTime = (seconds: number): string => {
  const option = REST_TIME_OPTIONS.find(opt => opt.seconds === seconds);
  if (option) return option.label;
  
  // Fallback para valores não padrão
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${remainingSeconds}s`;
  if (remainingSeconds === 0) return `${minutes}min 0s`;
  return `${minutes}min ${remainingSeconds}s`;
};

interface ExerciseWithSets extends Omit<RoutineExercise, 'id' | 'targetSets' | 'targetReps' | 'targetWeight'> {
  numberOfSets: number;
}

export default function CreateRoutineScreen() {
  const { id, duplicate } = useLocalSearchParams<{ id?: string; duplicate?: string }>();
  const { createRoutine, updateRoutine, routines, allExercises } = useWorkout();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState<DayOfWeek[]>([]);
  const [exercises, setExercises] = useState<ExerciseWithSets[]>([]);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [restTimeConfig, setRestTimeConfig] = useState<number | null>(null);
  const [expandedExercises, setExpandedExercises] = useState<Set<number>>(new Set());
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | 'all'>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType | 'all'>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const isEditing = !!id;
  const isDuplicating = !!duplicate;
  const sourceRoutineId = id || duplicate;

  // Carregar dados da rotina se estiver editando ou duplicando
  useEffect(() => {
    if (sourceRoutineId) {
      const routine = routines.find((r) => r.id === sourceRoutineId);
      if (routine) {
        setName(isDuplicating ? `${routine.name} (Cópia)` : routine.name);
        setDescription(routine.description || '');
        setDaysOfWeek([...routine.daysOfWeek]);
        
        const loadedExercises: ExerciseWithSets[] = routine.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          exercise: ex.exercise,
          numberOfSets: ex.targetSets,
          restTime: ex.restTime,
          targetWeight: ex.targetWeight,
          notes: ex.notes,
        }));
        setExercises(loadedExercises);
      }
    }
  }, [sourceRoutineId, routines, isDuplicating]);

  const toggleDay = (day: DayOfWeek) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter(d => d !== day));
    } else {
      setDaysOfWeek([...daysOfWeek, day]);
    }
  };

  const handleAddExercise = (exercise: Exercise) => {
    const newExercise: ExerciseWithSets = {
      exerciseId: exercise.id,
      exercise,
      numberOfSets: 1,
      restTime: 90,
    };

    const newIndex = exercises.length;
    setExercises([...exercises, newExercise]);
    // Expandir automaticamente o novo exercício adicionado
    const newExpanded = new Set(expandedExercises);
    newExpanded.add(newIndex);
    setExpandedExercises(newExpanded);
    setShowExerciseModal(false);
    setSearchQuery('');
    setSelectedMuscleGroup('all');
    setSelectedEquipment('all');
  };

  const toggleExerciseExpanded = (index: number) => {
    const newExpanded = new Set(expandedExercises);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedExercises(newExpanded);
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
    // Remover do estado de expandidos
    const newExpanded = new Set(expandedExercises);
    newExpanded.delete(index);
    // Ajustar índices dos exercícios após o removido
    const adjustedExpanded = new Set<number>();
    newExpanded.forEach(i => {
      if (i > index) {
        adjustedExpanded.add(i - 1);
      } else if (i < index) {
        adjustedExpanded.add(i);
      }
    });
    setExpandedExercises(adjustedExpanded);
  };

  const handleUpdateExercise = (
    index: number,
    updates: Partial<ExerciseWithSets>
  ) => {
    setExercises(
      exercises.map((ex, i) => (i === index ? { ...ex, ...updates } : ex))
    );
  };

  const handleAddSet = (exerciseIndex: number) => {
    const exercise = exercises[exerciseIndex];
    handleUpdateExercise(exerciseIndex, {
      numberOfSets: exercise.numberOfSets + 1,
    });
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    const exercise = exercises[exerciseIndex];
    if (exercise.numberOfSets > 1) {
      handleUpdateExercise(exerciseIndex, {
        numberOfSets: exercise.numberOfSets - 1,
      });
    }
  };

  const handleSave = async () => {
    // Validar todos os campos de uma vez
    const errors: string[] = [];

    if (!name.trim()) {
      errors.push('nome da rotina');
    }

    if (daysOfWeek.length === 0) {
      errors.push('pelo menos um dia da semana');
    }

    if (exercises.length === 0) {
      errors.push('pelo menos um exercício');
    }

    // Se houver erros, mostrar mensagem específica
    if (errors.length > 0) {
      let errorMessage = 'Faltam dados: ';
      
      if (errors.length === 1) {
        errorMessage = `Falta informar ${errors[0]}.`;
      } else if (errors.length === 2) {
        errorMessage = `Faltam dados: ${errors[0]} e ${errors[1]}.`;
      } else {
        const lastError = errors.pop();
        errorMessage = `Faltam dados: ${errors.join(', ')} e ${lastError}.`;
      }
      
      setToastMessage(errorMessage);
      setToastVisible(true);
      return;
    }

    setIsSaving(true);

    try {
      // Converter ExerciseWithSets para RoutineExercise
      const routineExercises: Omit<RoutineExercise, 'id'>[] = exercises.map(ex => {
        const exercise: any = {
          exerciseId: ex.exerciseId,
          exercise: ex.exercise,
          targetSets: ex.numberOfSets,
          restTime: ex.restTime,
        };
        
        // Só incluir targetReps se for maior que 0
        // Não incluir targetReps pois será definido durante o treino
        
        // Só incluir targetWeight se for maior que 0
        if (ex.targetWeight && ex.targetWeight > 0) {
          exercise.targetWeight = ex.targetWeight;
        }
        
        // Só incluir notes se existir
        if (ex.notes) {
          exercise.notes = ex.notes;
        }
        
        return exercise;
      });

      if (isEditing && id) {
        // Atualizar rotina existente
        await updateRoutine(id, {
          name: name.trim(),
          description: description.trim() || undefined,
          exercises: routineExercises as any,
          daysOfWeek,
        });
        setToastMessage('Rotina atualizada com sucesso!');
      } else {
        // Criar nova rotina (ou duplicar)
        await createRoutine({
          name: name.trim(),
          description: description.trim() || undefined,
          daysOfWeek,
          exercises: routineExercises as any,
        });
        setToastMessage('Rotina criada com sucesso!');
      }

      setToastVisible(true);
      
      // Aguardar um pouco para mostrar o toast antes de redirecionar
      setTimeout(() => {
        router.replace('/(tabs)/routines');
      }, 500);
    } catch (error: any) {
      console.error('Erro ao salvar rotina:', error);
      Alert.alert(
        'Erro',
        error?.message || 'Não foi possível salvar a rotina. Tente novamente.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const filteredExercises = allExercises.filter(
    (ex) => {
      const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMuscleGroup = selectedMuscleGroup === 'all' || ex.muscleGroup === selectedMuscleGroup;
      const matchesEquipment = selectedEquipment === 'all' || ex.equipment === selectedEquipment;
      const notAlreadyAdded = !exercises.some((routineEx) => routineEx.exerciseId === ex.id);
      
      return matchesSearch && matchesMuscleGroup && matchesEquipment && notAlreadyAdded;
    }
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <X size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Editar Rotina' : isDuplicating ? 'Duplicar Rotina' : 'Nova Rotina'}
        </Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={styles.headerButton}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.saveText}>{isEditing ? 'Salvar' : 'Criar'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.section}>
            <Text style={styles.label}>Nome da Rotina</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Push A, Pernas, etc."
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Descrição (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Descreva o foco desta rotina..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Dias da Semana</Text>
            <View style={styles.daysContainer}>
              {DAY_NAMES.map((dayName, index) => {
                const dayValue = index as DayOfWeek;
                const isSelected = daysOfWeek.includes(dayValue);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayChip,
                      isSelected && styles.dayChipSelected,
                    ]}
                    onPress={() => toggleDay(dayValue)}
                  >
                    <Text
                      style={[
                        styles.dayChipText,
                        isSelected && styles.dayChipTextSelected,
                      ]}
                    >
                      {dayName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.section, styles.exercisesSection]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>Exercícios ({exercises.length})</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowExerciseModal(true)}
              >
                <Plus size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {exercises.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Nenhum exercício adicionado</Text>
              </View>
            )}

            {exercises.map((ex, index) => {
              const isExpanded = expandedExercises.has(index);
              
              return (
                <View key={index} style={styles.exerciseCard}>
                  <TouchableOpacity
                    style={[styles.exerciseHeader, !isExpanded && styles.exerciseHeaderCollapsed]}
                    onPress={() => toggleExerciseExpanded(index)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.exerciseName}>{ex.exercise.name}</Text>
                    <View style={styles.exerciseHeaderActions}>
                      <Text style={styles.exerciseSummary}>
                        {ex.numberOfSets} série{ex.numberOfSets !== 1 ? 's' : ''} • {formatRestTime(ex.restTime)}
                      </Text>
                      {isExpanded ? (
                        <ChevronUp size={20} color={colors.textSecondary} />
                      ) : (
                        <ChevronDown size={20} color={colors.textSecondary} />
                      )}
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleRemoveExercise(index);
                        }}
                        style={styles.removeExerciseButton}
                      >
                        <Trash2 size={20} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.exerciseExpandedContent}>
                      <View style={styles.exerciseInputs}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Descanso</Text>
                          <TouchableOpacity
                            style={styles.restTimeSelector}
                            onPress={() => setRestTimeConfig(index)}
                          >
                            <Clock size={16} color={colors.primary} />
                            <Text style={styles.restTimeValue}>
                              {formatRestTime(ex.restTime)}
                            </Text>
                            <ChevronDown size={16} color={colors.primary} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.setsTable}>
                        <View style={styles.setsTableHeader}>
                          <Text style={styles.setsTableHeaderText}>SÉRIES</Text>
                          <Text style={styles.setsTableCountText}>{ex.numberOfSets} série{ex.numberOfSets !== 1 ? 's' : ''}</Text>
                        </View>

                        <View style={styles.setsList}>
                          {Array.from({ length: ex.numberOfSets }, (_, setIndex) => (
                            <View key={setIndex} style={styles.setsTableRow}>
                              <Text style={styles.setsTableRowText}>Série {setIndex + 1}</Text>
                              {ex.numberOfSets > 1 && (
                                <TouchableOpacity
                                  style={styles.removeSetButton}
                                  onPress={() => handleRemoveSet(index, setIndex)}
                                >
                                  <X size={16} color={colors.error} />
                                </TouchableOpacity>
                              )}
                            </View>
                          ))}
                        </View>

                        <TouchableOpacity
                          style={styles.addSetButton}
                          onPress={() => handleAddSet(index)}
                        >
                          <Plus size={20} color={colors.textOnPrimary} />
                          <Text style={styles.addSetButtonText}>Adicionar Série</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showExerciseModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowExerciseModal(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Adicionar Exercício</Text>
            <TouchableOpacity onPress={() => setShowExerciseModal(false)}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar exercícios..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9ca3af"
            />
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
                style={styles.exerciseOption}
                onPress={() => handleAddExercise(exercise)}
              >
                <Text style={styles.exerciseOptionName}>{exercise.name}</Text>
                <Text style={styles.exerciseOptionGroup}>
                  {exercise.muscleGroup}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={restTimeConfig !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setRestTimeConfig(null)}
      >
        <SafeAreaView style={styles.restConfigContainer} edges={['top', 'bottom']}>
          <View style={styles.restConfigHeader}>
            <View style={styles.restConfigHeaderTop}>
              <View style={styles.restConfigHandle} />
            </View>
            <View style={styles.restConfigHeaderContent}>
              <Text style={styles.restConfigTitle}>Tempo de Descanso</Text>
              {restTimeConfig !== null && exercises[restTimeConfig] && (
                <Text style={styles.restConfigExerciseName}>
                  {exercises[restTimeConfig].exercise.name}
                </Text>
              )}
            </View>
          </View>

          <ScrollView 
            style={styles.restConfigScrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.restConfigOptions}>
              {REST_TIME_OPTIONS.map((option) => {
                const isSelected = restTimeConfig !== null && 
                  exercises[restTimeConfig]?.restTime === option.seconds;
                
                return (
                  <TouchableOpacity
                    key={option.seconds}
                    style={[
                      styles.restConfigOption,
                      isSelected && styles.restConfigOptionSelected,
                    ]}
                    onPress={() => {
                      if (restTimeConfig !== null) {
                        handleUpdateExercise(restTimeConfig, {
                          restTime: option.seconds,
                        });
                      }
                    }}
                  >
                    <Text style={[
                      styles.restConfigOptionText,
                      isSelected && styles.restConfigOptionTextSelected,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.restConfigFooter}>
            <TouchableOpacity
              style={styles.restConfigDoneButton}
              onPress={() => setRestTimeConfig(null)}
            >
              <Text style={styles.restConfigDoneButtonText}>Feito</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <Toast
        message={toastMessage}
        type={toastMessage.includes('sucesso') ? 'success' : 'error'}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
        duration={toastMessage.includes('sucesso') ? 3000 : 4000}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.textSecondary + '20',
  },
  headerButton: {
    width: 60,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  exercisesSection: {
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.textSecondary + '20',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.textSecondary + '20',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  exerciseHeaderCollapsed: {
    marginBottom: 0,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  exerciseHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseSummary: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  removeExerciseButton: {
    padding: 4,
  },
  exerciseExpandedContent: {
    marginTop: 16,
  },
  exerciseInputs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  smallInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.textSecondary + '20',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.textSecondary + '20',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.textSecondary + '20',
  },
  exercisesList: {
    flex: 1,
  },
  exerciseOption: {
    backgroundColor: colors.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.textSecondary + '20',
  },
  exerciseOptionName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  exerciseOptionGroup: {
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.textSecondary + '20',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
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
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.textSecondary + '20',
    marginRight: 8,
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  filterChipTextSelected: {
    color: colors.textOnPrimary,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.textSecondary + '20',
    minWidth: 48,
    alignItems: 'center',
  },
  dayChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  dayChipTextSelected: {
    color: colors.textOnPrimary,
  },
  restTimeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryLight + '30',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.primaryLight + '60',
  },
  restTimeValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  setsTable: {
    marginTop: 8,
  },
  setsTableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.textSecondary + '20',
    backgroundColor: colors.background,
  },
  setsTableHeaderText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  setsTableCountText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  setsList: {
    maxHeight: 200,
  },
  setsTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.textSecondary + '10',
  },
  setsTableRowText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textPrimary,
  },
  removeSetButton: {
    padding: 4,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  addSetButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textOnPrimary,
  },
  restConfigContainer: {
    flex: 1,
    backgroundColor: colors.secondaryDark,
  },
  restConfigHeader: {
    paddingTop: 8,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
  },
  restConfigHeaderTop: {
    alignItems: 'center',
    paddingBottom: 12,
  },
  restConfigHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.secondaryLight,
    borderRadius: 2,
  },
  restConfigHeaderContent: {
    paddingHorizontal: 20,
  },
  restConfigTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.textOnPrimary,
    marginBottom: 8,
  },
  restConfigExerciseName: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  restConfigScrollView: {
    flex: 1,
  },
  restConfigOptions: {
    padding: 20,
    gap: 8,
  },
  restConfigOption: {
    padding: 18,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.secondaryLight,
  },
  restConfigOptionSelected: {
    backgroundColor: colors.secondaryLight,
    borderColor: colors.primary,
  },
  restConfigOptionText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  restConfigOptionTextSelected: {
    color: colors.textOnPrimary,
    fontWeight: '600' as const,
  },
  restConfigFooter: {
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.secondary,
  },
  restConfigDoneButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restConfigDoneButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textOnPrimary,
  },
});
