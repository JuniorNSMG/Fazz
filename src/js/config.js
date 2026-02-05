// ==========================================
// FAZZ - Configuration
// ==========================================

const CONFIG = {
  // Supabase
  supabase: {
    url: 'https://rajutjzpmnfxjdnacpvm.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhanV0anpwbW5meGpkbmFjcHZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNDg1NzEsImV4cCI6MjA4NTgyNDU3MX0.vZYAtkkD4aQbiN5k7AkUHTVH2fLlxcEbAqnoJyla8c0'
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
