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
import * as googleAuth from './google-auth.service';

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
 * Faz login com Google
 */
export async function loginWithGoogle(): Promise<AuthResponse> {
  try {
    // 1. Autenticar com Google
    const googleResult = await googleAuth.signInWithGoogle();

    // 2. Enviar token para o backend
    const backendResponse = await googleAuth.authenticateWithBackend(
      googleResult.accessToken
    );

    // 3. Salvar tokens da aplicação
    await saveAuthTokens(
      backendResponse.token,
      backendResponse.refreshToken,
      backendResponse.user
    );

    return backendResponse;
  } catch (error: any) {
    console.error('Erro no loginWithGoogle:', error);
    throw error;
  }
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

