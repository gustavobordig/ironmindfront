# Requisições para Backend - Tela de Progresso

Este documento descreve as funcionalidades necessárias no backend para suportar completamente a nova tela de progresso.

## 📊 Funcionalidades Necessárias

### 1. Volume Total por Treino Filtrado por Grupo Muscular

**Endpoint Necessário:**
```
GET /api/stats/workouts/volume
```

**Query Parameters:**
- `muscleGroup` (string, opcional): Filtrar por grupo muscular (`chest`, `back`, `shoulders`, etc.)
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
      "workoutName": "Push A",
      "date": "2024-01-15T10:00:00Z",
      "totalVolume": 12500,
      "totalSets": 24,
      "exerciseCount": 4
    },
    {
      "workoutId": "workout_124",
      "workoutName": "Push B",
      "date": "2024-01-17T10:00:00Z",
      "totalVolume": 13200,
      "totalSets": 26,
      "exerciseCount": 5
    }
  ]
}
```

**Descrição:**
- Retorna lista de treinos com volume total calculado
- Quando `muscleGroup` é fornecido, calcula apenas o volume dos exercícios daquele grupo muscular
- Ordenado por data (mais recente primeiro)
- Volume = soma de `weight * reps` de todas as séries completadas (excluindo warmup)

---

### 2. Evolução de Exercício Específico (Peso, Reps e Volume)

**Endpoint Necessário:**
```
GET /api/stats/exercises/:exerciseId/progression
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
  "exercise": {
    "id": "bench-press",
    "name": "Supino Reto",
    "muscleGroup": "chest"
  },
  "progression": [
    {
      "workoutId": "workout_123",
      "workoutName": "Push A",
      "date": "2024-01-15T10:00:00Z",
      "stats": {
        "averageWeight": 80.5,
        "averageReps": 8.2,
        "totalVolume": 2640,
        "totalSets": 4,
        "maxWeight": 85,
        "maxReps": 10,
        "minWeight": 75,
        "minReps": 6
      },
      "sets": [
        {
          "id": "set_1",
          "reps": 8,
          "weight": 80,
          "type": "working",
          "volume": 640
        },
        {
          "id": "set_2",
          "reps": 8,
          "weight": 82.5,
          "type": "working",
          "volume": 660
        }
      ]
    },
    {
      "workoutId": "workout_124",
      "workoutName": "Push B",
      "date": "2024-01-17T10:00:00Z",
      "stats": {
        "averageWeight": 82.0,
        "averageReps": 8.5,
        "totalVolume": 2788,
        "totalSets": 4,
        "maxWeight": 85,
        "maxReps": 10,
        "minWeight": 78,
        "minReps": 7
      },
      "sets": [...]
    }
  ]
}
```

**Descrição:**
- Retorna histórico de um exercício específico com estatísticas agregadas por treino
- Inclui apenas séries completadas do tipo `working` (exclui warmup)
- Calcula médias, máximos, mínimos e volume total por treino
- Ordenado por data (mais recente primeiro)
- Permite visualizar evolução de peso, reps e volume ao longo do tempo

---

### 3. Lista de Exercícios por Grupo Muscular

**Endpoint Necessário:**
```
GET /api/stats/muscle-groups/:muscleGroup/exercises
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
  "muscleGroup": "chest",
  "exercises": [
    {
      "id": "bench-press",
      "name": "Supino Reto",
      "totalWorkouts": 15,
      "lastPerformed": "2024-01-15T10:00:00Z"
    },
    {
      "id": "incline-bench-press",
      "name": "Supino Inclinado",
      "totalWorkouts": 12,
      "lastPerformed": "2024-01-14T10:00:00Z"
    }
  ]
}
```

**Descrição:**
- Retorna lista de exercícios que foram realizados para um grupo muscular específico
- Ordenado por data da última execução (mais recente primeiro)
- Útil para seleção de exercício específico no gráfico

---

## 🔄 Endpoints Existentes que Podem Ser Melhorados

### 1. `/api/stats/workouts/volume` (Atual)

**Melhorias Necessárias:**
- Adicionar suporte ao parâmetro `muscleGroup`
- Adicionar `workoutName` e `exerciseCount` na resposta
- Garantir ordenação por data

### 2. `/api/stats/exercises/:exerciseId/history` (Atual)

**Melhorias Necessárias:**
- Adicionar estatísticas agregadas por treino (média de peso, reps, volume total)
- Adicionar cálculo de máximos e mínimos por treino
- Incluir apenas séries do tipo `working` nos cálculos
- Adicionar suporte ao parâmetro `period`

---

## 📝 Notas de Implementação

### Cálculo de Volume
- Volume = soma de `weight * reps` para todas as séries completadas
- Excluir séries do tipo `warmup` do cálculo
- Considerar apenas séries com `completed: true`

### Filtro por Grupo Muscular
- Quando `muscleGroup` é fornecido, filtrar exercícios pelo campo `exercise.muscleGroup`
- Calcular volume apenas dos exercícios que correspondem ao grupo muscular

### Ordenação
- Sempre ordenar por data (mais recente primeiro)
- Usar campo `workout.date` ou `workout.completedAt`

### Performance
- Considerar paginação se houver muitos treinos
- Cachear resultados quando possível
- Índices recomendados:
  - `workouts.userId` + `workouts.date`
  - `workout_exercises.exerciseId`
  - `workout_exercises.muscleGroup` (se existir)

---

## ✅ Checklist de Implementação Backend

- [ ] Adicionar parâmetro `muscleGroup` ao endpoint `/api/stats/workouts/volume`
- [ ] Criar endpoint `/api/stats/exercises/:exerciseId/progression`
- [ ] Criar endpoint `/api/stats/muscle-groups/:muscleGroup/exercises`
- [ ] Melhorar endpoint `/api/stats/exercises/:exerciseId/history` com estatísticas agregadas
- [ ] Adicionar suporte ao parâmetro `period` em todos os endpoints de progresso
- [ ] Garantir ordenação por data em todos os endpoints
- [ ] Validar filtros de grupo muscular
- [ ] Testar cálculos de volume (excluindo warmup)
- [ ] Otimizar queries com índices apropriados

---

**Data de Criação:** 2024-01-15  
**Versão:** 1.0.0

