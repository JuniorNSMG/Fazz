// ==========================================
// FAZZ - Main Application
// ==========================================

class FazzApp {
  constructor() {
    this.initialized = false;
  }

  async init() {
    console.log('🚀 Inicializando Fazz...');

    try {
      // 1. Inicializar Supabase
      await window.supabaseClient.init();

      // 2. Inicializar Auth
      window.authManager.init();

      // 3. Inicializar UI
      window.uiManager.init();

      // 4. Carregar tarefas (se já estiver autenticado)
      if (window.authManager.isGuest || window.supabaseClient.isAuthenticated()) {
        await this.loadTasks();
      }

      this.initialized = true;
      console.log('✓ Fazz inicializado com sucesso!');
    } catch (error) {
      console.error('✗ Erro ao inicializar Fazz:', error);
    }
  }

  async loadTasks() {
    try {
      await window.tasksManager.loadTasks();
      window.uiManager.renderTasks();
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    }
  }

  async syncTasks() {
    if (!window.supabaseClient.isAuthenticated()) {
      console.log('Não autenticado, pulando sincronização');
      return;
    }

    try {
      await window.tasksManager.loadTasks();
      window.uiManager.renderTasks();
      console.log('✓ Tarefas sincronizadas');
    } catch (error) {
      console.error('Erro ao sincronizar tarefas:', error);
    }
  }
}

// Inicializar quando o DOM estiver pronto
window.app = new FazzApp();

document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});

// Sincronizar quando a aba ficar visível novamente
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && window.app.initialized) {
    window.app.syncTasks();
  }
});

// Sincronizar quando voltar a ficar online
window.addEventListener('online', () => {
  console.log('✓ Voltou online');
  if (window.app.initialized) {
    window.app.syncTasks();
  }
});

window.addEventListener('offline', () => {
  console.log('⚠️ Você está offline');
});
