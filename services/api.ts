import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Função para obter a URL base da API
function getApiBaseUrl(): string {
  // Se houver variável de ambiente definida, usar ela
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Para desenvolvimento no Expo Go
  // No iOS, precisamos usar o IP local da máquina ao invés de localhost
  if (__DEV__) {
    // Tentar obter o IP do manifest (quando rodando no Expo Go)
    const debuggerHost = Constants.expoConfig?.hostUri;
    
    if (debuggerHost) {
      // Extrair o IP do hostUri (formato: IP:porta)
      const ip = debuggerHost.split(':')[0];
      console.log('🔗 API URL detectada automaticamente:', `http://${ip}:3000/api`);
      return `http://${ip}:3000/api`;
    }
    
    // Fallback: usar localhost para web/android
    if (Platform.OS === 'web' || Platform.OS === 'android') {
      return 'http://localhost:3000/api';
    }
    
    // Para iOS sem hostUri, tentar usar um IP comum
    // Você pode substituir pelo IP da sua máquina se necessário
    console.warn('⚠️ Não foi possível detectar o IP automaticamente. Usando fallback.');
    return 'http://localhost:3000/api';
  }

  // Produção: usar URL de produção
  return 'https://api.seudominio.com/api';
}

const API_BASE_URL = getApiBaseUrl();

// Chaves do AsyncStorage
const TOKEN_KEY = '@gym_tracker_token';
const REFRESH_TOKEN_KEY = '@gym_tracker_refresh_token';
const USER_KEY = '@gym_tracker_user';

/**
 * Classe de erro customizada para erros da API
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Função auxiliar para fazer requisições à API
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, config);

  // Tratar erro 401 (não autenticado)
  if (response.status === 401) {
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
    // Redirecionar para login se houver router disponível
    if (router) {
      router.replace('/(tabs)');
    }
    throw new ApiError('Sessão expirada. Faça login novamente.', 401);
  }

  // Tratar outros erros
  if (!response.ok) {
    let errorMessage = 'Erro na requisição';
    let errorData = null;

    try {
      const errorJson = await response.json();
      errorMessage = errorJson.message || errorMessage;
      errorData = errorJson;
    } catch {
      // Se não conseguir parsear o JSON, usar mensagem padrão
    }

    throw new ApiError(errorMessage, response.status, errorData);
  }

  // Retornar dados parseados
  try {
    return await response.json();
  } catch {
    // Se não houver JSON, retornar resposta vazia
    return {} as T;
  }
}

/**
 * Função auxiliar para requisições GET
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

/**
 * Função auxiliar para requisições POST
 */
export async function apiPost<T>(
  endpoint: string,
  data?: any
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Função auxiliar para requisições PATCH
 */
export async function apiPatch<T>(
  endpoint: string,
  data?: any
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Função auxiliar para requisições DELETE
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}

/**
 * Função para salvar tokens após autenticação
 */
export async function saveAuthTokens(
  token: string,
  refreshToken: string,
  user: any
): Promise<void> {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [REFRESH_TOKEN_KEY, refreshToken],
    [USER_KEY, JSON.stringify(user)],
  ]);
}

/**
 * Função para obter token atual
 */
export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

/**
 * Função para obter refresh token
 */
export async function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Função para obter usuário atual
 */
export async function getCurrentUser(): Promise<any | null> {
  const userStr = await AsyncStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
}

/**
 * Função para limpar tokens (logout)
 */
export async function clearAuthTokens(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
}

/**
 * Função para fazer refresh do token
 */
export async function refreshToken(): Promise<string> {
  const refreshTokenValue = await getRefreshToken();

  if (!refreshTokenValue) {
    throw new ApiError('Refresh token não encontrado', 401);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshTokenValue}`,
      },
    });

    if (!response.ok) {
      throw new ApiError('Erro ao renovar token', response.status);
    }

    const data = await response.json();
    const { token, refreshToken: newRefreshToken } = data;

    await AsyncStorage.multiSet([
      [TOKEN_KEY, token],
      [REFRESH_TOKEN_KEY, newRefreshToken],
    ]);

    return token;
  } catch (error) {
    await clearAuthTokens();
    throw error;
  }
}

/**
 * Função auxiliar para tratamento seguro de chamadas à API
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<T>
): Promise<{ data?: T; error?: string }> {
  try {
    const data = await apiCall();
    return { data };
  } catch (error: any) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    return { error: 'Erro de conexão. Verifique sua internet.' };
  }
}

export default {
  get: apiGet,
  post: apiPost,
  patch: apiPatch,
  delete: apiDelete,
  saveAuthTokens,
  getToken,
  getRefreshToken,
  getCurrentUser,
  clearAuthTokens,
  refreshToken,
  safeApiCall,
};

