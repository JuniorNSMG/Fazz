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
      // 1. Carregar cache local PRIMEIRO (instantâneo)
      window.tasksManager.loadTasksFromCache();

      // 2. Inicializar UI
      window.uiManager.init();

      // 3. Se já tem cache, renderizar imediatamente
      if (window.tasksManager.tasks.length > 0) {
        window.uiManager.renderTasks();
      }

      // 4. Inicializar Supabase
      await window.supabaseClient.init();

      // 5. Inicializar Auth (verificar sessão)
      await window.authManager.init();

      // 6. Sincronizar com servidor em background (se autenticado)
      if (window.authManager.isGuest || window.supabaseClient.isAuthenticated()) {
        // Não aguardar - sincroniza em background
        this.syncTasksInBackground();
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

  async syncTasksInBackground() {
    try {
      // Mostrar indicador de sincronização
      if (window.uiManager.showSyncIndicator) {
        window.uiManager.showSyncIndicator();
      }

      // Sincronizar com servidor
      await window.tasksManager.syncWithServer();

      // Atualizar UI com dados sincronizados
      window.uiManager.renderTasks();

      // Esconder indicador
      if (window.uiManager.hideSyncIndicator) {
        window.uiManager.hideSyncIndicator();
      }
    } catch (error) {
      console.error('Erro ao sincronizar em background:', error);
      if (window.uiManager.hideSyncIndicator) {
        window.uiManager.hideSyncIndicator();
      }
    }
  }

  async syncTasks() {
    if (!window.supabaseClient.isAuthenticated()) {
      console.log('Não autenticado, pulando sincronização');
      return;
    }

    try {
      // Mostrar indicador
      if (window.uiManager.showSyncIndicator) {
        window.uiManager.showSyncIndicator();
      }

      await window.tasksManager.syncWithServer();
      window.uiManager.renderTasks();
      console.log('✓ Tarefas sincronizadas');

      // Esconder indicador
      if (window.uiManager.hideSyncIndicator) {
        window.uiManager.hideSyncIndicator();
      }
    } catch (error) {
      console.error('Erro ao sincronizar tarefas:', error);
      if (window.uiManager.hideSyncIndicator) {
        window.uiManager.hideSyncIndicator();
      }
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
