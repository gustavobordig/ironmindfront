// Sistema de Cores do App
export const colors = {
  primary: '#FF8225',          // Blurple
  primaryLight: '#7983FF',     // Blurple claro
  primaryDark: '#4752C4',      // Blurple escuro

  secondary: '#2F3136',        // Painéis laterais
  secondaryLight: '#36393F',   // Chat background
  secondaryDark: '#202225',    // Header/Sidebar mais escuro

  background: '#313338',       // Base do app (novo Discord 2024)
  surface: '#1E1F22',          // Cartões/panels internos

  textPrimary: '#FFFFFF',      // Textos principais
  textSecondary: '#B9BBBE',    // Textos fracos

  textOnPrimary: '#FFFFFF',

  success: '#3BA55D',          // Verde Discord
  warning: '#FEE75C',          // Amarelo Discord
  error: '#ED4245',            // Vermelho Discord
} as const;



// Cores adicionais para compatibilidade
export const theme = {
  light: {
    text: colors.textPrimary,
    background: colors.background,
    tint: colors.primary,
    tabIconDefault: colors.textSecondary,
    tabIconSelected: colors.primary,
  },
};

export default colors;
