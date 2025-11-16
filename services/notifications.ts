import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Workout, WorkoutExercise, WorkoutSet } from '@/types/workout';

// Configurar como as notificações devem ser tratadas quando o app está em foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Solicitar permissões de notificação
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Permissão de notificação não concedida');
      return false;
    }

    // Configurar canal para Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('workout', {
        name: 'Treinamento',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        showBadge: true,
        enableVibrate: true,
      });
    }

    return true;
  } catch (error) {
    console.error('Erro ao solicitar permissões de notificação:', error);
    return false;
  }
}

// Cancelar todas as notificações
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.dismissAllNotificationsAsync();
}

// Obter o exercício atual e set atual do treino
function getCurrentExerciseAndSet(workout: Workout): {
  exercise: WorkoutExercise | null;
  currentSet: WorkoutSet | null;
  setNumber: number;
  totalSets: number;
} {
  if (!workout || !workout.exercises || workout.exercises.length === 0) {
    return { exercise: null, currentSet: null, setNumber: 0, totalSets: 0 };
  }

  // Encontrar o primeiro exercício que não está completo
  for (const exercise of workout.exercises) {
    const workingSets = exercise.sets.filter(s => s.type === 'working');
    const completedSets = workingSets.filter(s => s.completed);
    
    if (completedSets.length < workingSets.length) {
      // Encontrar o próximo set não completado
      const currentSetIndex = completedSets.length;
      const currentSet = workingSets[currentSetIndex];
      
      return {
        exercise,
        currentSet: currentSet || null,
        setNumber: currentSetIndex + 1,
        totalSets: workingSets.length,
      };
    }
  }

  // Se todos os exercícios estão completos, retornar o último
  const lastExercise = workout.exercises[workout.exercises.length - 1];
  const workingSets = lastExercise.sets.filter(s => s.type === 'working');
  const lastSet = workingSets[workingSets.length - 1];
  
  return {
    exercise: lastExercise,
    currentSet: lastSet || null,
    setNumber: workingSets.length,
    totalSets: workingSets.length,
  };
}

// Atualizar notificação do treino ativo
export async function updateWorkoutNotification(workout: Workout | null, restTimeRemaining?: number) {
  // Cancelar notificações anteriores
  await cancelAllNotifications();

  if (!workout || !workout.isActive) {
    return;
  }

  const { exercise, currentSet, setNumber, totalSets } = getCurrentExerciseAndSet(workout);

  if (!exercise || !currentSet) {
    return;
  }

  const exerciseName = exercise.exercise.name;
  const weight = currentSet.weight || 0;
  const reps = currentSet.reps || 0;
  const restTime = exercise.restTime || 0;

  // Formatar tempo de descanso
  let restTimeText = '';
  if (restTimeRemaining !== undefined && restTimeRemaining > 0) {
    const minutes = Math.floor(restTimeRemaining / 60);
    const seconds = restTimeRemaining % 60;
    if (minutes > 0) {
      restTimeText = `${minutes}min ${seconds}s`;
    } else {
      restTimeText = `${seconds}s`;
    }
  } else if (restTime > 0) {
    const minutes = Math.floor(restTime / 60);
    const seconds = restTime % 60;
    if (minutes > 0) {
      restTimeText = `${minutes}min ${seconds}s`;
    } else {
      restTimeText = `${restTime}s`;
    }
  }

  // Criar corpo da notificação
  const body = `${weight} kg x ${reps} repetições`;
  
  // Criar subtitle com informações do exercício e tempo de descanso se houver
  let subtitle = `${exerciseName} • Set ${setNumber} de ${totalSets}`;
  if (restTimeText) {
    subtitle += ` • ${restTimeText}`;
  }

  // Criar notificação persistente (que aparece na tela de bloqueio)
  // Usar presentNotificationAsync para notificação imediata que fica visível
  await Notifications.presentNotificationAsync({
    title: 'Treinamento',
    body: body,
    subtitle: subtitle,
    data: {
      workoutId: workout.id,
      exerciseId: exercise.id,
      setId: currentSet.id,
    },
    categoryIdentifier: 'workout',
    sound: false,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  });
}

