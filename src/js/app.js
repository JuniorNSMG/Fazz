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
      // 1. Inicializar Cache Manager (IndexedDB)
      if (window.cacheManager) {
        await window.cacheManager.init();
        console.log('✓ Cache Manager inicializado');
      }

      // 2. Inicializar Supabase
      await window.supabaseClient.init();

      // 3. Inicializar Auth (verifica sessão e pode mostrar modal se necessário)
      await window.authManager.init();

      // 4. Inicializar UI
      window.uiManager.init();

      // 5. Carregar tarefas e tags (cache-first)
      if (window.authManager.isGuest || window.supabaseClient.isAuthenticated()) {
        await this.loadTasks();
        await window.tagsManager.loadTags();
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
