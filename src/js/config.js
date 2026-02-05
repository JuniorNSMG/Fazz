// ==========================================
// FAZZ - Configuration
// ==========================================

const CONFIG = {
  // Supabase - Preencher após criar projeto
  supabase: {
    url: '', // Será preenchido depois
    anonKey: '' // Será preenchido depois
  },

  // Storage Keys
  storage: {
    USER_KEY: 'fazz_user',
    TASKS_KEY: 'fazz_tasks_offline',
    LAST_SYNC: 'fazz_last_sync'
  },

  // App Settings
  app: {
    name: 'Fazz',
    version: '1.0.0',
    guestMode: true // Permite uso sem login
  }
};

// Export para uso global
window.CONFIG = CONFIG;
