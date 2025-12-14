import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Função para obter a URL base da API
function getApiBaseUrl(): string {
  // PRIORIDADE 1: Se houver variável de ambiente definida, usar ela (sempre)
  const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envApiUrl) {
    let apiUrl = envApiUrl.trim();
    
    // Garantir que a URL tenha protocolo (http:// ou https://)
    if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
      // Se não tiver protocolo, adicionar https://
      apiUrl = `https://${apiUrl}`;
      console.warn('⚠️ Protocolo não encontrado na URL. Adicionando https://');
    }
    
    // Garantir que a URL não tenha barra no final
    const finalUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    console.log('🔗 Usando URL da API da variável de ambiente:', finalUrl);
    return finalUrl;
  }
  
  console.warn('⚠️ EXPO_PUBLIC_API_URL não encontrada. Verificando fallbacks...');

  // PRIORIDADE 2: Para desenvolvimento local (apenas se não houver variável de ambiente)
  if (__DEV__) {
    // Tentar obter o IP do manifest (quando rodando no Expo Go)
    const debuggerHost = Constants.expoConfig?.hostUri;
    
    if (debuggerHost) {
      // Extrair o IP do hostUri (formato: IP:porta)
      const ip = debuggerHost.split(':')[0];
      console.log('🔗 API URL detectada automaticamente (dev):', `http://${ip}:3000/api`);
      return `http://${ip}:3000/api`;
    }
    
    // Fallback: usar localhost para web/android
    if (Platform.OS === 'web' || Platform.OS === 'android') {
      console.log('🔗 Usando localhost para desenvolvimento');
      return 'http://localhost:3000/api';
    }
    
    // Para iOS sem hostUri, tentar usar um IP comum
    console.warn('⚠️ Não foi possível detectar o IP automaticamente. Usando fallback.');
    return 'http://localhost:3000/api';
  }

  // PRIORIDADE 3: Produção - variável de ambiente obrigatória
  throw new Error(
    'EXPO_PUBLIC_API_URL não está configurada. ' +
    'Configure a variável de ambiente com a URL do seu backend na nuvem. ' +
    'Exemplo: EXPO_PUBLIC_API_URL=https://ironmindback-production.up.railway.app/api'
  );
}

// Calcular a URL base uma vez e logar para debug
const API_BASE_URL = (() => {
  const url = `${getApiBaseUrl()}/api`;
  console.log('✅ API_BASE_URL final:', url);
  console.log('✅ Tipo:', typeof url);
  console.log('✅ Tem protocolo?', url.startsWith('http://') || url.startsWith('https://'));
  return url;
})();

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

  // Garantir que o endpoint comece com /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${normalizedEndpoint}`;
  
  console.log('🌐 Fazendo requisição para:', url);
  const response = await fetch(url, config);

  // Tratar erro 401 (não autenticado)
  if (response.status === 401) {
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
    // Redirecionar para login se houver router disponível
    if (router) {
      router.replace('/login');
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

