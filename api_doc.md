# Guia de Integração Frontend - GymTracker API

Este guia explica como integrar o frontend com a API do GymTracker.

## 📋 Índice

1. [Configuração Inicial](#configuração-inicial)
2. [Autenticação](#autenticação)
3. [Estrutura de Requisições](#estrutura-de-requisições)
4. [Endpoints Principais](#endpoints-principais)
5. [Exemplos Práticos](#exemplos-práticos)
6. [Tratamento de Erros](#tratamento-de-erros)
7. [Tipos TypeScript](#tipos-typescript)

---

## 🔧 Configuração Inicial

### Base URL

```
http://localhost:3000/api
```

### Configuração do Axios/Fetch

#### Com Axios

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirecionar para login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

#### Com Fetch

```typescript
const API_BASE_URL = 'http://localhost:3000/api';

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Não autenticado');
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro na requisição');
  }

  return response.json();
}
```

---

## 🔐 Autenticação

### 1. Registrar Usuário

```typescript
interface RegisterData {
  email: string;
  password: string;
  name: string;
}

async function register(data: RegisterData) {
  const response = await api.post('/auth/register', data);
  const { user, token, refreshToken } = response.data;
  
  // Salvar tokens
  localStorage.setItem('token', token);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('user', JSON.stringify(user));
  
  return { user, token };
}
```

### 2. Login

```typescript
interface LoginData {
  email: string;
  password: string;
}

async function login(data: LoginData) {
  const response = await api.post('/auth/login', data);
  const { user, token, refreshToken } = response.data;
  
  // Salvar tokens
  localStorage.setItem('token', token);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('user', JSON.stringify(user));
  
  return { user, token };
}
```

### 3. Refresh Token

```typescript
async function refreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    throw new Error('Refresh token não encontrado');
  }

  const response = await api.post('/auth/refresh', {}, {
    headers: {
      Authorization: `Bearer ${refreshToken}`,
    },
  });
  
  const { token, refreshToken: newRefreshToken } = response.data;
  
  localStorage.setItem('token', token);
  localStorage.setItem('refreshToken', newRefreshToken);
  
  return token;
}
```

### 4. Logout

```typescript
async function logout() {
  try {
    await api.post('/auth/logout');
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
}
```

---

## 📦 Estrutura de Requisições

### Headers Obrigatórios

Todas as requisições autenticadas precisam do header:

```
Authorization: Bearer {token}
```

### Formato de Resposta

Todas as respostas seguem este padrão:

```typescript
// Sucesso (200/201)
{
  // Dados da resposta
}

// Erro (400/401/403/404/500)
{
  "message": "Mensagem de erro",
  "statusCode": 400
}
```

---

## 🎯 Endpoints Principais

### Exercícios

#### Listar Exercícios

```typescript
interface ExerciseFilters {
  search?: string;
  muscleGroup?: 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'legs' | 'core' | 'glutes' | 'cardio' | 'other';
  equipment?: 'barra' | 'halteres' | 'maquina' | 'cabo' | 'peso-corporal';
  page?: number;
  limit?: number;
}

async function getExercises(filters?: ExerciseFilters) {
  const response = await api.get('/exercises', { params: filters });
  return response.data;
  // Retorna: { exercises: [...], pagination: {...} }
}
```

#### Obter Exercício por ID

```typescript
async function getExerciseById(id: string) {
  const response = await api.get(`/exercises/${id}`);
  return response.data;
}
```

#### Criar Exercício Customizado

```typescript
interface CreateExerciseData {
  name: string;
  muscleGroup: 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'legs' | 'core' | 'glutes' | 'cardio' | 'other';
  equipment?: 'barra' | 'halteres' | 'maquina' | 'cabo' | 'peso-corporal';
  instructions?: string;
  imageUrl?: string;
}

async function createExercise(data: CreateExerciseData) {
  const response = await api.post('/exercises', data);
  return response.data;
}
```

#### Atualizar Exercício

```typescript
async function updateExercise(id: string, data: Partial<CreateExerciseData>) {
  const response = await api.patch(`/exercises/${id}`, data);
  return response.data;
}
```

#### Deletar Exercício

```typescript
async function deleteExercise(id: string) {
  const response = await api.delete(`/exercises/${id}`);
  return response.data;
}
```

### Rotinas

#### Listar Rotinas

```typescript
async function getRoutines() {
  const response = await api.get('/routines');
  return response.data.routines;
}
```

#### Criar Rotina

```typescript
interface RoutineExercise {
  exerciseId: string;
  targetSets: number;
  targetReps: number;
  targetWeight?: number;
  restTime?: number;
  notes?: string;
}

interface CreateRoutineData {
  name: string;
  description?: string;
  daysOfWeek: number[]; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  exercises: RoutineExercise[];
}

async function createRoutine(data: CreateRoutineData) {
  const response = await api.post('/routines', data);
  return response.data;
}
```

#### Duplicar Rotina

```typescript
async function duplicateRoutine(id: string) {
  const response = await api.post(`/routines/${id}/duplicate`);
  return response.data;
}
```

### Treinos

#### Iniciar Treino

```typescript
interface CreateWorkoutData {
  name: string;
  routineId?: string; // Opcional: se não fornecido, cria treino livre
}

async function startWorkout(data: CreateWorkoutData) {
  const response = await api.post('/workouts', data);
  return response.data;
}
```

#### Obter Treino Ativo

```typescript
async function getActiveWorkout() {
  try {
    const response = await api.get('/workouts/active');
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null; // Nenhum treino ativo
    }
    throw error;
  }
}
```

#### Adicionar Exercício ao Treino

```typescript
async function addExerciseToWorkout(exerciseId: string, restTime?: number) {
  const response = await api.post('/workouts/active/exercises', {
    exerciseId,
    restTime: restTime || 90,
  });
  return response.data;
}
```

#### Adicionar Série

```typescript
interface CreateSetData {
  reps: number;
  weight: number;
  type?: 'working' | 'warmup' | 'dropset' | 'failure' | 'superset';
}

async function addSet(exerciseId: string, setData: CreateSetData) {
  const response = await api.post(
    `/workouts/active/exercises/${exerciseId}/sets`,
    setData
  );
  return response.data;
}
```

#### Atualizar Série

```typescript
interface UpdateSetData {
  reps?: number;
  weight?: number;
  type?: 'working' | 'warmup' | 'dropset' | 'failure' | 'superset';
  completed?: boolean;
}

async function updateSet(exerciseId: string, setId: string, data: UpdateSetData) {
  const response = await api.patch(
    `/workouts/active/exercises/${exerciseId}/sets/${setId}`,
    data
  );
  return response.data;
}
```

#### Completar Treino

```typescript
async function completeWorkout(notes?: string) {
  const response = await api.post('/workouts/active/complete', { notes });
  return response.data;
}
```

#### Cancelar Treino

```typescript
async function cancelWorkout() {
  const response = await api.delete('/workouts/active');
  return response.data;
}
```

#### Listar Histórico de Treinos

```typescript
interface WorkoutFilters {
  period?: '7' | '30' | '90' | 'all';
  page?: number;
  limit?: number;
}

async function getWorkoutHistory(filters?: WorkoutFilters) {
  const response = await api.get('/workouts', { params: filters });
  return response.data;
}
```

### Estatísticas

#### Estatísticas Gerais

```typescript
interface StatsFilters {
  muscleGroup?: string;
  period?: '7' | '30' | '90' | 'all';
}

async function getOverview(filters?: StatsFilters) {
  const response = await api.get('/stats/overview', { params: filters });
  return response.data;
}
```

#### Progresso por Grupo Muscular

```typescript
async function getMuscleGroupStats(period?: '7' | '30' | '90' | 'all') {
  const response = await api.get('/stats/muscle-groups', {
    params: { period },
  });
  return response.data;
}
```

#### Histórico de Exercício

```typescript
async function getExerciseHistory(exerciseId: string) {
  const response = await api.get(`/stats/exercises/${exerciseId}/history`);
  return response.data;
}
```

#### Recorde Pessoal

```typescript
async function getPersonalRecord(exerciseId: string) {
  try {
    const response = await api.get(`/stats/exercises/${exerciseId}/personal-record`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null; // Sem recorde pessoal
    }
    throw error;
  }
}
```

---

## 💡 Exemplos Práticos

### Exemplo Completo: Fluxo de Treino

```typescript
// 1. Iniciar treino a partir de uma rotina
const workout = await startWorkout({
  name: 'Push A',
  routineId: 'routine_123',
});

// 2. Adicionar exercício extra
await addExerciseToWorkout('exercise_456', 90);

// 3. Adicionar séries
await addSet('workout_exercise_1', {
  reps: 10,
  weight: 80,
  type: 'working',
});

// 4. Atualizar série
await updateSet('workout_exercise_1', 'set_1', {
  reps: 8,
  weight: 85,
  completed: true,
});

// 5. Completar treino
await completeWorkout('Treino excelente hoje!');
```

### Exemplo: Criar Rotina Completa

```typescript
const routine = await createRoutine({
  name: 'Push A',
  description: 'Treino de peito, ombros e tríceps',
  daysOfWeek: [1, 3, 5], // Segunda, Quarta, Sexta
  exercises: [
    {
      exerciseId: 'supino-reto',
      targetSets: 4,
      targetReps: 8,
      targetWeight: 80,
      restTime: 90,
      notes: 'Focar na técnica',
    },
    {
      exerciseId: 'desenvolvimento',
      targetSets: 3,
      targetReps: 10,
      targetWeight: 50,
      restTime: 60,
    },
  ],
});
```

### Exemplo: Buscar e Filtrar Exercícios

```typescript
// Buscar exercícios de peito
const chestExercises = await getExercises({
  muscleGroup: 'chest',
  limit: 20,
});

// Buscar por nome
const searchResults = await getExercises({
  search: 'supino',
});

// Filtrar por equipamento
const barExercises = await getExercises({
  equipment: 'barra',
});
```

---

## ⚠️ Tratamento de Erros

### Códigos de Status HTTP

- `200 OK` - Requisição bem-sucedida
- `201 Created` - Recurso criado com sucesso
- `400 Bad Request` - Dados inválidos
- `401 Unauthorized` - Token ausente ou inválido
- `403 Forbidden` - Sem permissão
- `404 Not Found` - Recurso não encontrado
- `409 Conflict` - Conflito (ex: treino ativo já existe)
- `422 Unprocessable Entity` - Dados válidos mas não processáveis
- `500 Internal Server Error` - Erro interno

### Exemplo de Tratamento

```typescript
async function safeApiCall<T>(
  apiCall: () => Promise<T>
): Promise<{ data?: T; error?: string }> {
  try {
    const data = await apiCall();
    return { data };
  } catch (error: any) {
    if (error.response) {
      // Erro da API
      const message = error.response.data?.message || 'Erro desconhecido';
      const status = error.response.status;
      
      switch (status) {
        case 401:
          // Redirecionar para login
          window.location.href = '/login';
          return { error: 'Sessão expirada' };
        case 403:
          return { error: 'Você não tem permissão para esta ação' };
        case 404:
          return { error: 'Recurso não encontrado' };
        case 409:
          return { error: message };
        default:
          return { error: message };
      }
    } else {
      // Erro de rede
      return { error: 'Erro de conexão. Verifique sua internet.' };
    }
  }
}

// Uso
const { data, error } = await safeApiCall(() => getExercises());
if (error) {
  console.error(error);
  // Mostrar erro para o usuário
} else {
  // Usar os dados
  console.log(data);
}
```

---

## 📝 Tipos TypeScript

### Tipos Principais

```typescript
// User
interface User {
  id: string;
  email: string;
  name: string;
}

// Exercise
interface Exercise {
  id: string;
  name: string;
  muscleGroup: 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'legs' | 'core' | 'glutes' | 'cardio' | 'other';
  isCustom: boolean;
  equipment?: 'barra' | 'halteres' | 'maquina' | 'cabo' | 'peso-corporal';
  instructions?: string;
  imageUrl?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Routine
interface Routine {
  id: string;
  name: string;
  description?: string;
  exercises: RoutineExercise[];
  daysOfWeek: number[];
  createdAt: string;
  isCustom: boolean;
}

interface RoutineExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  targetSets: number;
  targetReps: number;
  targetWeight?: number;
  restTime: number;
  notes?: string;
}

// Workout
interface Workout {
  id: string;
  name: string;
  date: string;
  exercises: WorkoutExercise[];
  duration?: number;
  notes?: string;
  isActive: boolean;
  startedAt?: string;
  completedAt?: string;
}

interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  sets: WorkoutSet[];
  restTime: number;
  notes?: string;
}

interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
  type: 'working' | 'warmup' | 'dropset' | 'failure' | 'superset';
  completed: boolean;
}

// Stats
interface OverviewStats {
  totalWorkouts: number;
  totalSets: number;
  totalExercises: number;
  totalVolume: number;
  averageDuration: number;
  period: string;
}

interface MuscleGroupStats {
  muscleGroup: string;
  totalWorkouts: number;
  totalSets: number;
  totalVolume: number;
  averageWeight: number;
}
```

---

## 🔄 Fluxo Recomendado

### 1. Ao Carregar a Aplicação

```typescript
// Verificar se há token salvo
const token = localStorage.getItem('token');
if (token) {
  // Verificar se o token ainda é válido
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    // Token válido, usuário autenticado
  } catch {
    // Token inválido, fazer logout
    logout();
  }
}
```

### 2. Durante o Uso

- Sempre verificar se há treino ativo antes de iniciar novo
- Atualizar o token antes de expirar (usar refresh token)
- Tratar erros 401 automaticamente (redirecionar para login)

### 3. Ao Fazer Logout

- Limpar todos os dados do localStorage
- Cancelar qualquer treino ativo
- Redirecionar para tela de login

---

## 📚 Documentação Adicional

- **Swagger UI**: `http://localhost:3000/api/docs` - Interface interativa para testar a API
- **Documentação Completa**: Veja o arquivo `description.md` para detalhes completos de todos os endpoints

---

## 🚀 Dicas de Performance

1. **Cache de Exercícios**: Os exercícios padrão raramente mudam, considere cachear
2. **Paginação**: Sempre use paginação ao listar recursos grandes
3. **Lazy Loading**: Carregue estatísticas apenas quando necessário
4. **Otimistic Updates**: Atualize a UI antes de confirmar com o servidor para melhor UX

---

## ❓ Perguntas Frequentes

**Q: Como saber se há um treino ativo?**
A: Chame `getActiveWorkout()`. Se retornar `null`, não há treino ativo.

**Q: O que fazer quando o token expira?**
A: Use o `refreshToken()` para obter um novo token. Se falhar, redirecione para login.

**Q: Como calcular o volume total?**
A: Volume = soma de (reps × weight) de todas as séries completadas (excluindo warmup).

**Q: Posso ter múltiplos treinos ativos?**
A: Não, apenas um treino ativo por usuário. Iniciar um novo cancela o anterior.

---

**Última atualização**: 2024-01-15  
**Versão da API**: 1.0.0

