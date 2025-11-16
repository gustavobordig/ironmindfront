import {
  apiPost,
  apiGet,
  saveAuthTokens,
  clearAuthTokens,
  refreshToken as refreshTokenApi,
} from './api';
import type {
  RegisterData,
  LoginData,
  AuthResponse,
  RefreshTokenResponse,
  User,
} from '@/types/api';

/**
 * Registra um novo usuário
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  const response = await apiPost<AuthResponse>('/auth/register', data);
  await saveAuthTokens(response.token, response.refreshToken, response.user);
  return response;
}

/**
 * Faz login do usuário
 */
export async function login(data: LoginData): Promise<AuthResponse> {
  const response = await apiPost<AuthResponse>('/auth/login', data);
  await saveAuthTokens(response.token, response.refreshToken, response.user);
  return response;
}

/**
 * Faz logout do usuário
 */
export async function logout(): Promise<void> {
  try {
    await apiPost('/auth/logout');
  } finally {
    await clearAuthTokens();
  }
}

/**
 * Renova o token de acesso
 */
export async function refreshToken(): Promise<string> {
  return refreshTokenApi();
}

/**
 * Obtém o perfil do usuário atual do storage local
 * Nota: A API pode não ter endpoint /auth/me, então usamos o usuário salvo
 */
export async function getCurrentUser(): Promise<User | null> {
  const { getCurrentUser: getStoredUser } = await import('./api');
  return getStoredUser();
}

