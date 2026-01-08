import { useWorkout } from '@/contexts/WorkoutContext';
import { Search } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';

export default function ExercisesScreen() {
  const { allExercises } = useWorkout();
  const [searchQuery, setSearchQuery] = useState('');
  const insets = useSafeAreaInsets();

  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) return allExercises;

    const query = searchQuery.toLowerCase();
    return allExercises.filter(
      (ex) =>
        ex.name.toLowerCase().includes(query) ||
        ex.muscleGroup.toLowerCase().includes(query)
    );
  }, [allExercises, searchQuery]);

  const groupedExercises = useMemo(() => {
    const groups: Record<string, typeof filteredExercises> = {};

    filteredExercises.forEach((exercise) => {
      const group = exercise.muscleGroup;
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(exercise);
    });

    return groups;
  }, [filteredExercises]);

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

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Exercícios</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar exercícios..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.statsCard}>
          <Text style={styles.statsNumber}>{allExercises.length}</Text>
          <Text style={styles.statsLabel}>exercícios disponíveis</Text>
        </View>

        {Object.entries(groupedExercises).map(([group, exercises]) => (
          <View key={group} style={styles.section}>
            <Text style={styles.sectionTitle}>{muscleGroupLabels[group] || group}</Text>

            {exercises.map((exercise) => (
              <View key={exercise.id} style={styles.exerciseCard}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  {exercise.isCustom && (
                    <View style={styles.customBadge}>
                      <Text style={styles.customBadgeText}>Custom</Text>
                    </View>
                  )}
                </View>
                {exercise.instructions && (
                  <Text style={styles.exerciseInstructions} numberOfLines={2}>
                    {exercise.instructions}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))}

        {filteredExercises.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Nenhum exercício encontrado</Text>
            <Text style={styles.emptyStateText}>
              Tente buscar com outros termos
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#111827',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  statsCard: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    marginTop: 8,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statsNumber: {
    fontSize: 48,
    fontWeight: '800' as const,
    color: '#fff',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 16,
    color: '#dbeafe',
    fontWeight: '500' as const,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#374151',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exerciseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  exerciseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    flex: 1,
  },
  customBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  customBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#3b82f6',
  },
  exerciseInstructions: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    paddingTop: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
