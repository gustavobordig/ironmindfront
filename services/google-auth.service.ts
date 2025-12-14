import { AuthRequest, ResponseType, makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configurar WebBrowser para fechar automaticamente após autenticação
WebBrowser.maybeCompleteAuthSession();

/**
 * Configuração do Google OAuth Discovery
 */
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://www.googleapis.com/oauth2/v4/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

/**
 * Lê o Client ID do arquivo plist do Google Services (síncrono)
 * Extrai do caminho do arquivo configurado no app.json
 */
function getClientIdFromPlistSync(): string | null {
  try {
    const plistPath = Constants.expoConfig?.ios?.googleServicesFile;
    if (!plistPath) {
      return null;
    }
    
    // Extrair Client ID do nome do arquivo plist
    // Formato: client_132825076670-6f9khmsh89kkskk5at34gtijjg580fgs.apps.googleusercontent.com.plist
    // Ou: ./client_132825076670-6f9khmsh89kkskk5at34gtijjg580fgs.apps.googleusercontent.com.plist
    const fileName = plistPath.split('/').pop() || plistPath;
    const clientIdMatch = fileName.match(/client_([^\.]+)\.apps\.googleusercontent\.com/);
    if (clientIdMatch && clientIdMatch[1]) {
      const clientId = `${clientIdMatch[1]}.apps.googleusercontent.com`;
      if (__DEV__) {
        console.log('[Google Auth] Client ID extraído do plist:', clientId.substring(0, 20) + '...');
      }
      return clientId;
    }
    
    return null;
  } catch (error) {
    if (__DEV__) {
      console.warn('[Google Auth] Erro ao extrair Client ID do plist:', error);
    }
    return null;
  }
}

/**
 * Obtém o Client ID do Google baseado na plataforma
 * Prioridade: Web Client ID (sempre priorizado) > Client ID específico da plataforma > app.json > plist file
 */
const getGoogleClientId = (): string => {
  // PRIORIDADE 1: Web Client ID (configurado com http://localhost:8081/auth)
  const envWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (envWebClientId) {
    if (__DEV__) {
      console.log('[Google Auth] ✅ Usando Web Client ID (priorizado - aceita redirect URIs HTTP)');
    }
    return envWebClientId.trim();
  }

  // PRIORIDADE 2: Client ID específico da plataforma (fallback)
  if (Platform.OS === 'ios') {
    const envClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    if (envClientId) {
      if (__DEV__) {
        console.log('[Google Auth] Usando iOS Client ID (fallback)');
      }
      return envClientId.trim();
    }
  }

  if (Platform.OS === 'android') {
    const envClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
    if (envClientId) {
      if (__DEV__) {
        console.log('[Google Auth] Usando Android Client ID (fallback)');
      }
      return envClientId.trim();
    }
  }

  // PRIORIDADE 3: app.json (extra) - fallback
  const extra = Constants.expoConfig?.extra;

  // Tentar Web Client ID do app.json primeiro
  if (extra?.googleWebClientId) {
    if (__DEV__) {
      console.log('[Google Auth] Usando Web Client ID do app.json (fallback)');
    }
    return extra.googleWebClientId;
  }

  if (Platform.OS === 'ios') {
    const appJsonClientId = extra?.googleIosClientId;
    if (appJsonClientId) {
      if (__DEV__) {
        console.log('[Google Auth] Usando iOS Client ID do app.json (fallback)');
      }
      return appJsonClientId;
    }
    
    // PRIORIDADE 4: Tentar extrair do arquivo plist (apenas iOS)
    const plistClientId = getClientIdFromPlistSync();
    if (plistClientId) {
      if (__DEV__) {
        console.log('[Google Auth] Usando Client ID do arquivo plist (fallback)');
      }
      return plistClientId;
    }
  }

  if (Platform.OS === 'android') {
    const appJsonClientId = extra?.googleAndroidClientId;
    if (appJsonClientId) {
      if (__DEV__) {
        console.log('[Google Auth] Usando Android Client ID do app.json (fallback)');
      }
      return appJsonClientId;
    }
  }

  return '';
};


/**
 * Obtém o identificador da plataforma (Package Name no Android, Bundle ID no iOS)
 */
const getPlatformIdentifier = (): string => {
  if (Platform.OS === 'android') {
    return Constants.expoConfig?.android?.package || 'com.gustavcodes.gymtrackerappgo3wkdc';
  } else if (Platform.OS === 'ios') {
    return Constants.expoConfig?.ios?.bundleIdentifier || 'app.gym-tracker.gym-tracker-app-go3wkdc';
  }
  return 'N/A';
};

/**
 * Valida se o Client ID está configurado corretamente
 */
const validateClientId = (clientId: string): void => {
  // Verificar se é um placeholder
  const placeholderPatterns = [
    'SEU_GOOGLE',
    'YOUR_GOOGLE',
    'COLE_AQUI',
    'AQUI',
    'HERE',
  ];

  const isPlaceholder = placeholderPatterns.some((pattern) =>
    clientId.toUpperCase().includes(pattern)
  );

  if (isPlaceholder) {
    throw new Error(
      'Google Client ID não configurado. Os valores no app.json ainda são placeholders. ' +
      'Por favor, configure os Client IDs reais seguindo o guia COMO_OBTER_CLIENT_IDS.md'
    );
  }

  // Verificar formato básico do Client ID
  if (!clientId.includes('.apps.googleusercontent.com')) {
    throw new Error(
      'Google Client ID inválido. O Client ID deve terminar com .apps.googleusercontent.com'
    );
  }
};

/**
 * Interface para informações do usuário do Google
 */
export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  givenName?: string;
  familyName?: string;
}

/**
 * Interface para resultado da autenticação Google
 */
export interface GoogleAuthResult {
  accessToken: string;
  user: GoogleUserInfo;
}

/**
 * Faz login com Google usando OAuth
 * @returns Token de acesso do Google e informações do usuário
 */
export async function signInWithGoogle(): Promise<GoogleAuthResult> {
  try {
    const clientId = getGoogleClientId();

    if (!clientId || clientId.trim() === '') {
      throw new Error(
        'Google Client ID não configurado. Verifique app.json e adicione os Client IDs em expo.extra'
      );
    }

    // Validar Client ID
    validateClientId(clientId);

    // Detectar se está rodando no Expo Go
    const isExpoGo = Constants.executionEnvironment === 'storeClient';

    let redirectUri: string;

    if (isExpoGo) {
      // No Expo Go, usar o IP do Metro Bundler ou localhost
      const debuggerHost = Constants.expoConfig?.hostUri;
      if (debuggerHost) {
        const ip = debuggerHost.split(':')[0];
        redirectUri = `http://${ip}:8081/auth`;
        if (__DEV__) {
          console.log('[Google Auth] Expo Go detectado, usando IP do Metro:', redirectUri);
        }
      } else {
        redirectUri = 'http://localhost:8081/auth';
        if (__DEV__) {
          console.log('[Google Auth] Expo Go detectado, usando localhost:', redirectUri);
        }
      }
    } else {
      // Em development builds, usar makeRedirectUri
      redirectUri = makeRedirectUri({
        scheme: 'gym-tracker-app',
        path: 'auth',
        preferLocalhost: true,
      });
    }

    // Log para debug (apenas em desenvolvimento)
    if (__DEV__) {
      const platformIdentifier = getPlatformIdentifier();
      const isWebClientId = clientId === process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 
                           clientId === Constants.expoConfig?.extra?.googleWebClientId;
      
      console.log('[Google Auth] Client ID:', clientId.substring(0, 20) + '...');
      if (isWebClientId) {
        console.log('[Google Auth] Web Client ID: usando URL HTTP válida');
      }
      console.log('[Google Auth] ✅ Redirect URI gerado:', redirectUri);
      console.log('[Google Auth] ✅ ' + (Platform.OS === 'android' ? 'Package Name' : 'Bundle ID') + 
                  ' que será validado pelo Google:', platformIdentifier);
    }

    const request = new AuthRequest({
      clientId,
      scopes: ['openid', 'profile', 'email'],
      responseType: ResponseType.Token,
      redirectUri: redirectUri,
      usePKCE: false,
    });

    // Obter URL de autorização
    const authUrl = await request.makeAuthUrlAsync(discovery);

    if (__DEV__) {
      console.log('[Google Auth] Auth URL gerada com sucesso');
    }

    // Abrir navegador para autenticação
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (__DEV__) {
      console.log('[Google Auth] Result type:', result.type);
    }

    if (result.type === 'success') {
      // Parsear a URL de retorno para extrair o token
      const urlParts = result.url.split('#');
      if (urlParts.length < 2) {
        throw new Error('URL de retorno inválida do Google');
      }

      const params = new URLSearchParams(urlParts[1]);
      const access_token = params.get('access_token');
      const error = params.get('error');
      const error_description = params.get('error_description');

      // Verificar se há erro na resposta
      if (error) {
        let errorMessage = `Erro do Google: ${error}`;
        if (error_description) {
          errorMessage += ` - ${error_description}`;
        }

        // Mensagens específicas para erros comuns
        if (error === 'redirect_uri_mismatch') {
          errorMessage +=
            '\n\nO redirect URI não está autorizado no Google Cloud Console. ' +
            `Adicione "${redirectUri}" nas URIs de redirecionamento autorizadas do seu Client ID.`;
        } else if (error === 'invalid_client') {
          errorMessage +=
            '\n\nClient ID inválido. Verifique se o Client ID está correto no app.json e se corresponde ao tipo correto (Android/iOS/Web).';
        } else if (error === 'invalid_request') {
          errorMessage +=
            '\n\nO app não está em conformidade com a política OAuth 2.0 do Google. ' +
            'Verifique no Google Cloud Console:\n' +
            '1. Tela de Consentimento OAuth está configurada e publicada (ou você está na lista de testadores)\n' +
            '2. Os escopos solicitados (openid, profile, email) estão aprovados\n' +
            '3. O tipo de aplicativo está correto (Android/iOS)\n' +
            '4. O Package Name (Android) ou Bundle ID (iOS) corresponde exatamente ao configurado';
        } else if (error === 'access_denied') {
          errorMessage = 'Acesso negado pelo usuário';
        }

        throw new Error(errorMessage);
      }

      if (!access_token) {
        throw new Error('Token de acesso não recebido do Google');
      }

      // Buscar informações do usuário
      const userInfoResponse = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`
      );

      if (!userInfoResponse.ok) {
        const errorText = await userInfoResponse.text();
        console.error('[Google Auth] Erro ao buscar userinfo:', errorText);
        throw new Error('Erro ao buscar informações do usuário do Google');
      }

      const userInfo = await userInfoResponse.json();

      return {
        accessToken: access_token,
        user: {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          givenName: userInfo.given_name,
          familyName: userInfo.family_name,
        },
      };
    } else if (result.type === 'cancel') {
      throw new Error('Login cancelado pelo usuário');
    } else if (result.type === 'dismiss') {
      throw new Error('Tela de autenticação fechada');
    } else if (result.type === 'locked') {
      throw new Error(
        'Erro 400: O app não está em conformidade com a política OAuth 2.0 do Google.\n\n' +
        'Soluções:\n' +
        '1. Configure a Tela de Consentimento OAuth no Google Cloud Console:\n' +
        '   - Vá em "APIs e serviços" > "Tela de consentimento OAuth"\n' +
        '   - Preencha todos os campos obrigatórios\n' +
        '   - Se estiver em modo de teste, adicione seu email na lista de testadores\n' +
        '   - Publique a tela de consentimento\n\n' +
        '2. Verifique se os escopos estão aprovados:\n' +
        '   - openid, profile, email devem estar habilitados\n\n' +
        '3. Confirme o Package Name (Android) ou Bundle ID (iOS) no Client ID'
      );
    } else {
      // Log detalhado do resultado para debug
      if (__DEV__) {
        console.error('[Google Auth] Result completo:', JSON.stringify(result, null, 2));
      }
      
      // Se o tipo não é 'success', provavelmente houve um erro
      // O erro 400 geralmente aparece quando a tela de consentimento não está configurada
      throw new Error(
        'Erro 400: O app não está em conformidade com a política OAuth 2.0 do Google.\n\n' +
        '⚠️ IMPORTANTE: Este erro acontece porque a Tela de Consentimento OAuth não está configurada corretamente.\n\n' +
        '📋 PASSO A PASSO PARA RESOLVER:\n\n' +
        '1️⃣ Configure a Tela de Consentimento OAuth:\n' +
        '   • Acesse: https://console.cloud.google.com/\n' +
        '   • Selecione seu projeto\n' +
        '   • Vá em "APIs e serviços" > "Tela de consentimento OAuth"\n' +
        '   • Selecione "Externo" (para desenvolvimento)\n' +
        '   • Preencha os campos OBRIGATÓRIOS:\n' +
        '     - Nome do aplicativo: "Iron Mind" (ou o nome do seu app)\n' +
        '     - Email de suporte do usuário: seu email\n' +
        '     - Email de contato do desenvolvedor: seu email\n' +
        '   • Clique em "SALVAR E CONTINUAR" em todas as telas\n\n' +
        '2️⃣ Adicione seu email como testador (SE ESTIVER EM MODO DE TESTE):\n' +
        '   • Na tela de consentimento, vá em "Testadores"\n' +
        '   • Clique em "+ ADICIONAR USUÁRIOS"\n' +
        '   • Adicione: gustavobordig@gmail.com\n' +
        '   • Salve\n\n' +
        '3️⃣ Verifique o Client ID iOS:\n' +
        '   • Vá em "APIs e serviços" > "Credenciais"\n' +
        '   • Clique no seu Client ID iOS\n' +
        '   • Verifique se o Bundle ID é EXATAMENTE: app.gym-tracker.gym-tracker-app-go3wkdc\n' +
        '   • ⚠️ IMPORTANTE: Client IDs iOS NÃO têm campo "URIs de redirecionamento"\n' +
        '   • O Google valida iOS apenas pelo Bundle ID\n\n' +
        '💡 ALTERNATIVA: Tente usar o Web Client ID temporariamente:\n' +
        '   • No .env, use EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID para iOS também\n' +
        '   • Web Client IDs têm mais flexibilidade no Expo Go\n\n' +
        '4️⃣ Aguarde alguns minutos e tente novamente\n\n' +
        '💡 Dica: Se estiver usando Expo Go, considere criar um development build para melhor compatibilidade.'
      );
    }
  } catch (error: any) {
    console.error('[Google Auth] Erro completo:', error);
    
    // Melhorar mensagem de erro se for um erro de rede ou HTTP
    if (error.message?.includes('400')) {
      throw new Error(
        'Erro 400 do Google: A solicitação é inválida. ' +
        'Verifique se:\n' +
        '1. O Client ID está correto e configurado no app.json\n' +
        '2. O redirect URI está autorizado no Google Cloud Console\n' +
        '3. O tipo de Client ID corresponde à plataforma (Android/iOS)\n' +
        'Consulte o arquivo COMO_OBTER_CLIENT_IDS.md para mais detalhes.'
      );
    }

    throw error;
  }
}

/**
 * Envia token do Google para o backend e recebe token da aplicação
 * @param googleAccessToken Token de acesso do Google
 * @returns Resposta de autenticação com token da aplicação
 */
export async function authenticateWithBackend(
  googleAccessToken: string
): Promise<{
  token: string;
  refreshToken: string;
  user: any;
}> {
  // Importar dinamicamente para evitar dependência circular
  const { apiPost } = await import('./api');

  // Enviar token para o backend
  // O backend deve validar o token e retornar o token da aplicação
  const response = await apiPost<{
    token: string;
    refreshToken: string;
    user: any;
  }>('/auth/google', {
    accessToken: googleAccessToken,
  });

  return response;
}

