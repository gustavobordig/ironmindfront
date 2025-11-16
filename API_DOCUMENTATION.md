# Documentação da API - GymTracker

Este documento descreve todas as rotas e informações necessárias para que o backend suporte 100% das funcionalidades do aplicativo GymTracker de forma dinâmica.

## Índice

1. [Autenticação](#autenticação)
2. [Exercícios](#exercícios)
3. [Rotinas](#rotinas)
4. [Treinos](#treinos)
5. [Estatísticas e Progresso](#estatísticas-e-progresso)
6. [Estruturas de Dados](#estruturas-de-dados)

---

## Autenticação

### Base URL
```
/api/auth
```

### Rotas

#### 1. Registrar Usuário
```
POST /api/auth/register
```

**Body:**
```json
{
  "email": "usuario@email.com",
  "password": "senha123",
  "name": "Nome do Usuário"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "user_123",
    "email": "usuario@email.com",
    "name": "Nome do Usuário"
  },
  "token": "jwt_token_aqui"
}
```

#### 2. Login
```
POST /api/auth/login
```

**Body:**
```json
{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "user_123",
    "email": "usuario@email.com",
    "name": "Nome do Usuário"
  },
  "token": "jwt_token_aqui"
}
```

#### 3. Refresh Token
```
POST /api/auth/refresh
```

**Headers:**
```
Authorization: Bearer {refresh_token}
```

**Response (200):**
```json
{
  "token": "novo_jwt_token",
  "refreshToken": "novo_refresh_token"
}
```

#### 4. Logout
```
POST /api/auth/logout
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Logout realizado com sucesso"
}
```

---

## Exercícios

### Base URL
```
/api/exercises
```

### Rotas

#### 1. Listar Todos os Exercícios
```
GET /api/exercises
```

**Query Parameters:**
- `search` (string, opcional): Busca por nome
- `muscleGroup` (string, opcional): Filtrar por grupo muscular (`chest`, `back`, `shoulders`, `biceps`, `triceps`, `legs`, `core`, `glutes`, `cardio`, `other`)
- `equipment` (string, opcional): Filtrar por equipamento (`barra`, `halteres`, `maquina`, `cabo`, `peso-corporal`)
- `page` (number, opcional): Número da página (padrão: 1)
- `limit` (number, opcional): Itens por página (padrão: 50)

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "exercises": [
    {
      "id": "bench-press",
      "name": "Supino Reto",
      "muscleGroup": "chest",
      "isCustom": false,
      "equipment": "barra",
      "instructions": "Deite no banco, pegue a barra com pegada média...",
      "imageUrl": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

#### 2. Obter Exercício por ID
```
GET /api/exercises/:id
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "bench-press",
  "name": "Supino Reto",
  "muscleGroup": "chest",
  "isCustom": false,
  "equipment": "barra",
  "instructions": "Deite no banco...",
  "imageUrl": null
}
```

#### 3. Criar Exercício Customizado
```
POST /api/exercises
```

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "name": "Meu Exercício Customizado",
  "muscleGroup": "chest",
  "equipment": "halteres",
  "instructions": "Instruções do exercício...",
  "imageUrl": "https://exemplo.com/imagem.jpg"
}
```

**Response (201):**
```json
{
  "id": "custom_ex_123",
  "name": "Meu Exercício Customizado",
  "muscleGroup": "chest",
  "isCustom": true,
  "equipment": "halteres",
  "instructions": "Instruções do exercício...",
  "imageUrl": "https://exemplo.com/imagem.jpg",
  "userId": "user_123",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### 4. Atualizar Exercício Customizado
```
PUT /api/exercises/:id
```

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "name": "Nome Atualizado",
  "muscleGroup": "back",
  "equipment": "barra",
  "instructions": "Novas instruções...",
  "imageUrl": null
}
```

**Response (200):**
```json
{
  "id": "custom_ex_123",
  "name": "Nome Atualizado",
  "muscleGroup": "back",
  "isCustom": true,
  "equipment": "barra",
  "instructions": "Novas instruções...",
  "imageUrl": null,
  "updatedAt": "2024-01-15T11:00:00Z"
}
```

#### 5. Deletar Exercício Customizado
```
DELETE /api/exercises/:id
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Exercício deletado com sucesso"
}
```

---

## Rotinas

### Base URL
```
/api/routines
```

### Rotas

#### 1. Listar Rotinas do Usuário
```
GET /api/routines
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "routines": [
    {
      "id": "routine_123",
      "name": "Push A",
      "description": "Treino de peito, ombros e tríceps",
      "exercises": [
        {
          "id": "routine_ex_1",
          "exerciseId": "bench-press",
          "exercise": {
            "id": "bench-press",
            "name": "Supino Reto",
            "muscleGroup": "chest"
          },
          "targetSets": 4,
          "targetReps": 8,
          "targetWeight": 80,
          "restTime": 90,
          "notes": "Focar na técnica"
        }
      ],
      "daysOfWeek": [1, 3, 5],
      "createdAt": "2024-01-10T08:00:00Z",
      "isCustom": true
    }
  ]
}
```

#### 2. Obter Rotina por ID
```
GET /api/routines/:id
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "routine_123",
  "name": "Push A",
  "description": "Treino de peito, ombros e tríceps",
  "exercises": [...],
  "daysOfWeek": [1, 3, 5],
  "createdAt": "2024-01-10T08:00:00Z",
  "isCustom": true
}
```

#### 3. Criar Rotina
```
POST /api/routines
```

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "name": "Push A",
  "description": "Treino de peito, ombros e tríceps",
  "daysOfWeek": [1, 3, 5],
  "exercises": [
    {
      "exerciseId": "bench-press",
      "targetSets": 4,
      "targetReps": 8,
      "targetWeight": 80,
      "restTime": 90,
      "notes": "Focar na técnica"
    }
  ]
}
```

**Response (201):**
```json
{
  "id": "routine_123",
  "name": "Push A",
  "description": "Treino de peito, ombros e tríceps",
  "exercises": [...],
  "daysOfWeek": [1, 3, 5],
  "createdAt": "2024-01-15T10:00:00Z",
  "isCustom": true
}
```

#### 4. Atualizar Rotina
```
PUT /api/routines/:id
```

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "name": "Push A Atualizado",
  "description": "Nova descrição",
  "daysOfWeek": [1, 3, 5],
  "exercises": [
    {
      "exerciseId": "bench-press",
      "targetSets": 5,
      "targetReps": 10,
      "targetWeight": 85,
      "restTime": 120,
      "notes": null
    }
  ]
}
```

**Response (200):**
```json
{
  "id": "routine_123",
  "name": "Push A Atualizado",
  "description": "Nova descrição",
  "exercises": [...],
  "daysOfWeek": [1, 3, 5],
  "updatedAt": "2024-01-15T11:00:00Z"
}
```

#### 5. Deletar Rotina
```
DELETE /api/routines/:id
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Rotina deletada com sucesso"
}
```

#### 6. Duplicar Rotina
```
POST /api/routines/:id/duplicate
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (201):**
```json
{
  "id": "routine_456",
  "name": "Push A (Cópia)",
  "description": "Treino de peito, ombros e tríceps",
  "exercises": [...],
  "daysOfWeek": [1, 3, 5],
  "createdAt": "2024-01-15T12:00:00Z",
  "isCustom": true
}
```

---

## Treinos

### Base URL
```
/api/workouts
```

### Rotas

#### 1. Listar Treinos do Usuário (Histórico)
```
GET /api/workouts
```

**Query Parameters:**
- `period` (string, opcional): Período de filtro (`7`, `30`, `90`, `all`) - padrão: `all`
- `page` (number, opcional): Número da página
- `limit` (number, opcional): Itens por página

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "workouts": [
    {
      "id": "workout_123",
      "name": "Push A",
      "date": "2024-01-15T10:00:00Z",
      "duration": 75,
      "exercises": [
        {
          "id": "workout_ex_1",
          "exerciseId": "bench-press",
          "exercise": {
            "id": "bench-press",
            "name": "Supino Reto",
            "muscleGroup": "chest"
          },
          "sets": [
            {
              "id": "set_1",
              "reps": 8,
              "weight": 80,
              "type": "working",
              "completed": true
            }
          ],
          "restTime": 90,
          "notes": null
        }
      ],
      "notes": "Treino excelente hoje!",
      "isActive": false,
      "startedAt": "2024-01-15T10:00:00Z",
      "completedAt": "2024-01-15T11:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### 2. Obter Treino Ativo
```
GET /api/workouts/active
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "workout_456",
  "name": "Treino Livre",
  "date": "2024-01-15T14:00:00Z",
  "exercises": [...],
  "isActive": true,
  "startedAt": "2024-01-15T14:00:00Z",
  "completedAt": null
}
```

**Response (404) - Sem treino ativo:**
```json
{
  "message": "Nenhum treino ativo encontrado"
}
```

#### 3. Iniciar Treino
```
POST /api/workouts
```

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "name": "Push A",
  "routineId": "routine_123"
}
```

**OU para treino livre:**
```json
{
  "name": "Treino Livre"
}
```

**Response (201):**
```json
{
  "id": "workout_456",
  "name": "Push A",
  "date": "2024-01-15T14:00:00Z",
  "exercises": [
    {
      "id": "workout_ex_1",
      "exerciseId": "bench-press",
      "exercise": {
        "id": "bench-press",
        "name": "Supino Reto",
        "muscleGroup": "chest"
      },
      "sets": [
        {
          "id": "set_1",
          "reps": 8,
          "weight": 80,
          "type": "working",
          "completed": false
        }
      ],
      "restTime": 90,
      "notes": null
    }
  ],
  "isActive": true,
  "startedAt": "2024-01-15T14:00:00Z",
  "completedAt": null
}
```

#### 4. Adicionar Exercício ao Treino Ativo
```
POST /api/workouts/active/exercises
```

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "exerciseId": "bench-press",
  "restTime": 90
}
```

**Response (200):**
```json
{
  "id": "workout_ex_2",
  "exerciseId": "bench-press",
  "exercise": {
    "id": "bench-press",
    "name": "Supino Reto",
    "muscleGroup": "chest"
  },
  "sets": [],
  "restTime": 90,
  "notes": null
}
```

#### 5. Atualizar Tempo de Descanso do Exercício
```
PUT /api/workouts/active/exercises/:exerciseId/rest-time
```

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "restTime": 120
}
```

**Response (200):**
```json
{
  "message": "Tempo de descanso atualizado",
  "restTime": 120
}
```

#### 6. Adicionar Série ao Exercício
```
POST /api/workouts/active/exercises/:exerciseId/sets
```

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "reps": 10,
  "weight": 0,
  "type": "working"
}
```

**Response (201):**
```json
{
  "id": "set_2",
  "reps": 10,
  "weight": 0,
  "type": "working",
  "completed": false
}
```

#### 7. Atualizar Série
```
PUT /api/workouts/active/exercises/:exerciseId/sets/:setId
```

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "reps": 8,
  "weight": 80,
  "type": "working",
  "completed": true
}
```

**Response (200):**
```json
{
  "id": "set_2",
  "reps": 8,
  "weight": 80,
  "type": "working",
  "completed": true
}
```

#### 8. Deletar Série
```
DELETE /api/workouts/active/exercises/:exerciseId/sets/:setId
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Série deletada com sucesso"
}
```

#### 9. Completar Treino
```
POST /api/workouts/active/complete
```

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "notes": "Treino excelente hoje!"
}
```

**Response (200):**
```json
{
  "id": "workout_456",
  "name": "Push A",
  "date": "2024-01-15T14:00:00Z",
  "duration": 75,
  "exercises": [...],
  "notes": "Treino excelente hoje!",
  "isActive": false,
  "startedAt": "2024-01-15T14:00:00Z",
  "completedAt": "2024-01-15T15:15:00Z"
}
```

#### 10. Cancelar Treino
```
DELETE /api/workouts/active
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Treino cancelado com sucesso"
}
```

#### 11. Obter Treino por ID
```
GET /api/workouts/:id
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "workout_123",
  "name": "Push A",
  "date": "2024-01-15T10:00:00Z",
  "duration": 75,
  "exercises": [...],
  "notes": "Treino excelente!",
  "isActive": false,
  "startedAt": "2024-01-15T10:00:00Z",
  "completedAt": "2024-01-15T11:15:00Z"
}
```

---

## Estatísticas e Progresso

### Base URL
```
/api/stats
```

### Rotas

#### 1. Estatísticas Gerais
```
GET /api/stats/overview
```

**Query Parameters:**
- `muscleGroup` (string, opcional): Filtrar por grupo muscular
- `period` (string, opcional): Período (`7`, `30`, `90`, `all`)

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "totalWorkouts": 45,
  "totalSets": 320,
  "totalExercises": 28,
  "totalVolume": 125000,
  "averageDuration": 75,
  "period": "all"
}
```

#### 2. Progresso por Grupo Muscular
```
GET /api/stats/muscle-groups
```

**Query Parameters:**
- `period` (string, opcional): Período (`7`, `30`, `90`, `all`)

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "muscleGroups": [
    {
      "muscleGroup": "chest",
      "totalWorkouts": 15,
      "totalSets": 120,
      "totalVolume": 45000,
      "averageWeight": 80
    },
    {
      "muscleGroup": "back",
      "totalWorkouts": 12,
      "totalSets": 95,
      "totalVolume": 38000,
      "averageWeight": 70
    }
  ]
}
```

#### 3. Histórico de Exercício
```
GET /api/stats/exercises/:exerciseId/history
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "exercise": {
    "id": "bench-press",
    "name": "Supino Reto",
    "muscleGroup": "chest"
  },
  "history": [
    {
      "workout": {
        "id": "workout_123",
        "name": "Push A",
        "date": "2024-01-15T10:00:00Z"
      },
      "exercise": {
        "id": "workout_ex_1",
        "sets": [
          {
            "id": "set_1",
            "reps": 8,
            "weight": 80,
            "type": "working",
            "completed": true
          }
        ]
      }
    }
  ]
}
```

#### 4. Recorde Pessoal (PR) de um Exercício
```
GET /api/stats/exercises/:exerciseId/personal-record
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "exerciseId": "bench-press",
  "weight": 100,
  "reps": 5,
  "date": "2024-01-10T10:00:00Z",
  "estimatedOneRepMax": 116.7,
  "workoutId": "workout_100"
}
```

**Response (404) - Sem PR:**
```json
{
  "message": "Nenhum recorde pessoal encontrado para este exercício"
}
```

#### 5. Estatísticas de uma Rotina
```
GET /api/stats/routines/:routineId
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "routine": {
    "id": "routine_123",
    "name": "Push A"
  },
  "totalWorkouts": 12,
  "averageStats": {
    "volume": 45000,
    "duration": 75,
    "exercises": 6,
    "sets": 24
  },
  "lastWorkout": {
    "id": "workout_123",
    "date": "2024-01-15T10:00:00Z"
  }
}
```

#### 6. Volume Total por Treino
```
GET /api/stats/workouts/volume
```

**Query Parameters:**
- `period` (string, opcional): Período (`7`, `30`, `90`, `all`)

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "workouts": [
    {
      "workoutId": "workout_123",
      "date": "2024-01-15T10:00:00Z",
      "totalVolume": 12500,
      "totalSets": 24
    }
  ]
}
```

#### 7. Status de Treinos por Data
```
GET /api/stats/workout-statuses
```

**Query Parameters:**
- `month` (number, opcional): Mês (1-12)
- `year` (number, opcional): Ano

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "statuses": {
    "2024-01-15": "completed",
    "2024-01-16": "missed",
    "2024-01-17": "rest",
    "2024-01-18": "incomplete"
  }
}
```

---

## Estruturas de Dados

### Exercise (Exercício)
```typescript
{
  id: string;
  name: string;
  muscleGroup: 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'legs' | 'core' | 'glutes' | 'cardio' | 'other';
  isCustom: boolean;
  equipment?: 'barra' | 'halteres' | 'maquina' | 'cabo' | 'peso-corporal';
  instructions?: string;
  imageUrl?: string;
  userId?: string; // Apenas para exercícios customizados
  createdAt?: string;
  updatedAt?: string;
}
```

### RoutineExercise (Exercício da Rotina)
```typescript
{
  id: string;
  exerciseId: string;
  exercise: Exercise;
  targetSets: number;
  targetReps: number;
  targetWeight?: number;
  restTime: number;
  notes?: string;
}
```

### Routine (Rotina)
```typescript
{
  id: string;
  name: string;
  description?: string;
  exercises: RoutineExercise[];
  daysOfWeek: number[]; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  createdAt: string;
  isCustom: boolean;
  userId: string;
}
```

### WorkoutSet (Série)
```typescript
{
  id: string;
  reps: number;
  weight: number;
  type: 'working' | 'warmup' | 'dropset' | 'failure' | 'superset';
  completed: boolean;
  restTime?: number;
  notes?: string;
}
```

### WorkoutExercise (Exercício do Treino)
```typescript
{
  id: string;
  exerciseId: string;
  exercise: Exercise;
  sets: WorkoutSet[];
  restTime: number;
  notes?: string;
}
```

### Workout (Treino)
```typescript
{
  id: string;
  name: string;
  date: string; // ISO 8601
  exercises: WorkoutExercise[];
  duration?: number; // em minutos
  notes?: string;
  isActive: boolean;
  startedAt?: string; // ISO 8601
  completedAt?: string; // ISO 8601
  userId: string;
}
```

### PersonalRecord (Recorde Pessoal)
```typescript
{
  exerciseId: string;
  weight: number;
  reps: number;
  date: string; // ISO 8601
  estimatedOneRepMax: number;
  workoutId: string;
}
```

---

## Códigos de Status HTTP

- `200 OK`: Requisição bem-sucedida
- `201 Created`: Recurso criado com sucesso
- `400 Bad Request`: Dados inválidos na requisição
- `401 Unauthorized`: Token ausente ou inválido
- `403 Forbidden`: Usuário não tem permissão
- `404 Not Found`: Recurso não encontrado
- `409 Conflict`: Conflito (ex: treino ativo já existe)
- `422 Unprocessable Entity`: Dados válidos mas não processáveis
- `500 Internal Server Error`: Erro interno do servidor

---

## Autenticação

Todas as rotas (exceto `/api/auth/*`) requerem autenticação via JWT token no header:

```
Authorization: Bearer {jwt_token}
```

O token deve ser incluído em todas as requisições autenticadas.

---

## Paginação

Rotas que retornam listas podem usar paginação:

**Query Parameters:**
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 20, máximo: 100)

**Response com Paginação:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## Filtros e Busca

### Filtros de Período
- `7`: Últimos 7 dias
- `30`: Últimos 30 dias
- `90`: Últimos 90 dias
- `all`: Todos os registros

### Filtros de Grupo Muscular
- `chest`: Peito
- `back`: Costas
- `shoulders`: Ombros
- `biceps`: Bíceps
- `triceps`: Tríceps
- `legs`: Pernas
- `core`: Core
- `glutes`: Glúteos
- `cardio`: Cardio
- `other`: Outros

### Filtros de Equipamento
- `barra`: Barra
- `halteres`: Halteres
- `maquina`: Máquina
- `cabo`: Cabo
- `peso-corporal`: Peso Corporal

---

## Observações Importantes

1. **Treino Ativo**: Apenas um treino ativo pode existir por usuário. Ao iniciar um novo treino, o anterior deve ser cancelado ou completado.

2. **Exercícios Customizados**: Apenas o usuário que criou pode editar/deletar seus exercícios customizados.

3. **Rotinas**: Apenas o usuário que criou pode editar/deletar suas rotinas.

4. **Cálculo de PR**: O backend deve calcular automaticamente os recordes pessoais baseado nos treinos completados.

5. **Duração do Treino**: Calculada automaticamente quando o treino é completado (diferença entre `startedAt` e `completedAt`).

6. **Volume Total**: Calculado como soma de `weight * reps` de todas as séries completadas (excluindo warmup).

7. **Status de Treino**: Calculado baseado na rotina agendada e treinos completados:
   - `completed`: Treino completo (≥80% dos exercícios)
   - `incomplete`: Treino iniciado mas não completo
   - `missed`: Rotina agendada mas não realizada
   - `rest`: Dia de descanso (sem rotina agendada)

---

## Exemplo de Fluxo Completo

### 1. Usuário faz login
```
POST /api/auth/login
→ Recebe token JWT
```

### 2. Lista exercícios disponíveis
```
GET /api/exercises?muscleGroup=chest
→ Vê exercícios de peito
```

### 3. Cria uma rotina
```
POST /api/routines
→ Rotina criada com exercícios
```

### 4. Inicia treino baseado na rotina
```
POST /api/workouts
→ Treino ativo criado
```

### 5. Adiciona exercício extra ao treino
```
POST /api/workouts/active/exercises
→ Exercício adicionado
```

### 6. Adiciona séries e atualiza valores
```
POST /api/workouts/active/exercises/:id/sets
PUT /api/workouts/active/exercises/:id/sets/:setId
→ Séries adicionadas e atualizadas
```

### 7. Completa o treino
```
POST /api/workouts/active/complete
→ Treino salvo no histórico
```

### 8. Visualiza progresso
```
GET /api/stats/overview
GET /api/stats/exercises/:id/personal-record
→ Estatísticas e PRs
```

---

## Considerações de Implementação

### Banco de Dados Sugerido

**Tabelas principais:**
- `users`: Usuários
- `exercises`: Exercícios (padrão + customizados)
- `routines`: Rotinas
- `routine_exercises`: Exercícios das rotinas
- `workouts`: Treinos
- `workout_exercises`: Exercícios dos treinos
- `workout_sets`: Séries dos treinos
- `personal_records`: Recordes pessoais (pode ser calculado ou armazenado)

### Índices Recomendados
- `users.email` (único)
- `exercises.userId` (para exercícios customizados)
- `routines.userId`
- `workouts.userId`
- `workouts.isActive` + `workouts.userId` (único quando isActive = true)
- `workouts.date` (para filtros de período)
- `workout_sets.exerciseId` (para histórico)

### Validações Importantes
- Um usuário só pode ter um treino ativo
- Exercícios customizados só podem ser editados pelo criador
- Rotinas só podem ser editadas pelo criador
- Séries só podem ser editadas em treinos ativos
- Validação de tipos de série (`working`, `warmup`, etc.)
- Validação de grupos musculares e equipamentos

---

**Documento criado em:** 2024-01-15
**Versão da API:** 1.0.0

