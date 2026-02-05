// ==========================================
// FAZZ - Tasks Manager
// ==========================================

class TasksManager {
  constructor() {
    this.tasks = [];
    this.currentEditingTask = null;
  }

  /**
   * Cria um objeto Date a partir de uma string YYYY-MM-DD no timezone local
   * Evita problemas de conversão UTC que mudam a data
   */
  parseLocalDate(dateStr) {
    if (!dateStr) return null;

    // Se já é um objeto Date, retornar
    if (dateStr instanceof Date) return dateStr;

    // Dividir a string "YYYY-MM-DD" em partes
    const parts = dateStr.split('-');
    if (parts.length !== 3) return new Date(dateStr); // Fallback

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Mês é 0-indexed
    const day = parseInt(parts[2], 10);

    // Criar Date usando construtor com parâmetros (usa timezone local)
    return new Date(year, month, day);
  }

  // Carregar tarefas com estratégia cache-first
  async loadTasks(forceSync = false) {
    console.log(`📥 loadTasks chamado (forceSync: ${forceSync})`);

    // Verificar se cache está disponível e pronto
    const cacheReady = window.cacheManager && window.cacheManager.isReady();
    console.log(`  Cache status: ${cacheReady ? '✅ Pronto' : '❌ Não disponível'}`);

    // ESTRATÉGIA CACHE-FIRST: Carregar cache primeiro (se não for forceSync)
    if (cacheReady && !forceSync) {
      try {
        console.log('  🔍 Buscando tarefas no cache...');
        const cachedTasks = await window.cacheManager.getAll(window.cacheManager.stores.TASKS);

        if (cachedTasks && cachedTasks.length > 0) {
          console.log(`  💾 ${cachedTasks.length} tarefas encontradas no cache`);

          // Carregar tags e anexos do cache para cada tarefa
          for (const task of cachedTasks) {
            const tags = await window.cacheManager.getByIndex(
              window.cacheManager.stores.TASK_TAGS,
              'task_id',
              task.id
            );
            task.tags = tags || [];

            const attachments = await window.cacheManager.getByIndex(
              window.cacheManager.stores.ATTACHMENTS,
              'task_id',
              task.id
            );
            task.attachments = attachments || [];
          }

          this.tasks = cachedTasks;
          console.log(`✅ ${cachedTasks.length} tarefas carregadas do cache`);

          // Sincronizar em background (não bloqueia a UI)
          this.syncInBackground();

          return this.tasks;
        } else {
          console.log('  ℹ️ Cache vazio, buscando do servidor...');
        }
      } catch (error) {
        console.error('❌ Erro ao carregar do cache:', error);
      }
    } else if (forceSync) {
      console.log('  🔄 Sincronização forçada, indo direto ao servidor');
    }

    // Se não tem cache ou forceSync, buscar do servidor
    return await this.loadFromServer();
  }

  // Carregar do servidor e salvar no cache
  async loadFromServer() {
    console.log('↓ Carregando tarefas do servidor...');

    // Se estiver autenticado no Supabase, buscar de lá
    if (window.supabaseClient.isAuthenticated()) {
      const { data, error } = await window.supabaseClient.fetchTasks();

      if (!error && data) {
        // Carregar tags e anexos de cada tarefa
        for (const task of data) {
          const tags = await window.tagsManager.getTaskTags(task.id);
          task.tags = tags;

          const attachments = await window.attachmentsManager.getTaskAttachments(task.id);
          task.attachments = attachments;
        }

        this.tasks = data;

        // Salvar no cache IndexedDB
        if (window.cacheManager) {
          await this.saveToCache();
        }

        // Salvar no localStorage como backup
        this.saveTasks();

        console.log(`✓ ${data.length} tarefas carregadas do servidor`);
        return this.tasks;
      }
    }

    // Fallback: buscar do localStorage (modo guest ou offline)
    const stored = localStorage.getItem(CONFIG.storage.TASKS_KEY);
    if (stored) {
      try {
        this.tasks = JSON.parse(stored);
        console.log(`✓ ${this.tasks.length} tarefas carregadas do localStorage`);
      } catch (e) {
        console.error('Erro ao carregar tarefas do localStorage:', e);
        this.tasks = [];
      }
    }

    return this.tasks;
  }

  // Sincronizar com servidor em background
  async syncInBackground() {
    // Aguardar 500ms antes de sincronizar (debounce)
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('🔄 Sincronizando com servidor em background...');

    if (window.supabaseClient.isAuthenticated()) {
      const { data, error } = await window.supabaseClient.fetchTasks();

      if (!error && data) {
        // Comparar com cache atual
        const hasChanges = this.detectChanges(data);

        if (hasChanges) {
          console.log('✓ Mudanças detectadas, atualizando...');

          // Carregar tags e anexos
          for (const task of data) {
            const tags = await window.tagsManager.getTaskTags(task.id);
            task.tags = tags;

            const attachments = await window.attachmentsManager.getTaskAttachments(task.id);
            task.attachments = attachments;
          }

          this.tasks = data;

          // Atualizar cache
          await this.saveToCache();
          this.saveTasks();

          // Atualizar UI
          if (window.uiManager) {
            window.uiManager.renderTasks();
          }

          console.log('✓ Sincronização concluída');
        } else {
          console.log('✓ Nenhuma mudança detectada');
        }

        // Atualizar timestamp de sincronização
        if (window.cacheManager) {
          await window.cacheManager.setLastSync('tasks');
        }
      }
    }
  }

  // Detectar se há mudanças entre dados do servidor e cache
  detectChanges(serverData) {
    if (serverData.length !== this.tasks.length) return true;

    // Comparar timestamps de atualização
    for (const serverTask of serverData) {
      const cachedTask = this.tasks.find(t => t.id === serverTask.id);

      if (!cachedTask) return true;

      if (serverTask.updated_at !== cachedTask.updated_at) return true;
    }

    return false;
  }

  // Salvar no cache IndexedDB
  async saveToCache() {
    if (!window.cacheManager) return;

    try {
      // Salvar tarefas
      await window.cacheManager.saveMany(window.cacheManager.stores.TASKS, this.tasks);

      // Salvar tags relacionadas
      const allTaskTags = [];
      const allAttachments = [];

      for (const task of this.tasks) {
        if (task.tags && task.tags.length > 0) {
          allTaskTags.push(...task.tags);
        }
        if (task.attachments && task.attachments.length > 0) {
          allAttachments.push(...task.attachments);
        }
      }

      if (allTaskTags.length > 0) {
        await window.cacheManager.saveMany(window.cacheManager.stores.TASK_TAGS, allTaskTags);
      }

      if (allAttachments.length > 0) {
        await window.cacheManager.saveMany(window.cacheManager.stores.ATTACHMENTS, allAttachments);
      }

      console.log('✓ Cache atualizado');
    } catch (error) {
      console.error('Erro ao salvar no cache:', error);
    }
  }

  // Salvar tarefas no localStorage
  saveTasks() {
    try {
      localStorage.setItem(CONFIG.storage.TASKS_KEY, JSON.stringify(this.tasks));
    } catch (e) {
      console.error('Erro ao salvar tarefas:', e);
    }
  }

  // Criar nova tarefa
  async createTask(taskData) {
    const newTask = {
      id: this.generateId(),
      title: taskData.title,
      date: taskData.date,
      time: taskData.time || null,
      notes: taskData.notes || null,
      completed: false,
      tags: [],
      attachments: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Se estiver autenticado, salvar no Supabase
    if (window.supabaseClient.isAuthenticated()) {
      const { data, error } = await window.supabaseClient.createTask(newTask);

      if (!error && data) {
        data.tags = []; // Inicializar tags vazio
        data.attachments = [];
        this.tasks.push(data);
        this.saveTasks();

        // Salvar no cache IndexedDB
        if (window.cacheManager && window.cacheManager.isReady()) {
          await window.cacheManager.save(window.cacheManager.stores.TASKS, data);
          console.log('💾 Tarefa salva no cache');
        }

        return data;
      }
    }

    // Caso contrário, salvar localmente
    this.tasks.push(newTask);
    this.saveTasks();

    // Salvar no cache IndexedDB
    if (window.cacheManager && window.cacheManager.isReady()) {
      await window.cacheManager.save(window.cacheManager.stores.TASKS, newTask);
      console.log('💾 Tarefa salva no cache');
    }

    return newTask;
  }

  // Atualizar tarefa
  async updateTask(id, updates) {
    const taskIndex = this.tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return null;

    const updatedTask = {
      ...this.tasks[taskIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };

    // Se estiver autenticado, atualizar no Supabase
    if (window.supabaseClient.isAuthenticated()) {
      const { data, error } = await window.supabaseClient.updateTask(id, updates);

      if (!error && data) {
        this.tasks[taskIndex] = data;
        this.saveTasks();

        // Atualizar no cache IndexedDB
        if (window.cacheManager && window.cacheManager.isReady()) {
          await window.cacheManager.save(window.cacheManager.stores.TASKS, data);
          console.log('💾 Tarefa atualizada no cache');
        }

        return data;
      }
    }

    // Caso contrário, atualizar localmente
    this.tasks[taskIndex] = updatedTask;
    this.saveTasks();

    // Atualizar no cache IndexedDB
    if (window.cacheManager && window.cacheManager.isReady()) {
      await window.cacheManager.save(window.cacheManager.stores.TASKS, updatedTask);
      console.log('💾 Tarefa atualizada no cache');
    }

    return updatedTask;
  }

  // Deletar tarefa
  async deleteTask(id) {
    // Se estiver autenticado, deletar do Supabase
    if (window.supabaseClient.isAuthenticated()) {
      const { error } = await window.supabaseClient.deleteTask(id);

      if (error) {
        console.error('Erro ao deletar tarefa:', error);
        return false;
      }
    }

    // Deletar localmente
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.saveTasks();

    // Deletar do cache IndexedDB
    if (window.cacheManager && window.cacheManager.isReady()) {
      await window.cacheManager.delete(window.cacheManager.stores.TASKS, id);
      console.log('💾 Tarefa removida do cache');
    }

    return true;
  }

  // Marcar/desmarcar como concluída
  async toggleComplete(id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return null;

    return await this.updateTask(id, { completed: !task.completed });
  }

  // Obter tarefas agrupadas por data
  getGroupedTasks() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const groups = {
      overdue: [],
      today: [],
      upcoming: {},
      completed: []
    };

    this.tasks.forEach(task => {
      // Separar concluídas
      if (task.completed) {
        groups.completed.push(task);
        return;
      }

      // Usar parseLocalDate para evitar problemas de timezone
      const taskDate = this.parseLocalDate(task.date);
      if (!taskDate) return;

      taskDate.setHours(0, 0, 0, 0);

      // Atrasadas
      if (taskDate < today) {
        groups.overdue.push(task);
      }
      // Hoje
      else if (taskDate.getTime() === today.getTime()) {
        groups.today.push(task);
      }
      // Futuras
      else {
        const dateKey = task.date;
        if (!groups.upcoming[dateKey]) {
          groups.upcoming[dateKey] = [];
        }
        groups.upcoming[dateKey].push(task);
      }
    });

    // Ordenar cada grupo por horário
    groups.overdue.sort(this.sortByTime);
    groups.today.sort(this.sortByTime);
    groups.completed.sort((a, b) => {
      // Ordenar concluídas por data de conclusão (mais recentes primeiro)
      return new Date(b.updated_at) - new Date(a.updated_at);
    });

    Object.keys(groups.upcoming).forEach(dateKey => {
      groups.upcoming[dateKey].sort(this.sortByTime);
    });

    return groups;
  }

  // Ordenar por horário
  sortByTime(a, b) {
    if (!a.time && !b.time) return 0;
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  }

  // Gerar ID único
  generateId() {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Reagendar tarefas atrasadas
  async rescheduleOverdue() {
    const today = new Date().toISOString().split('T')[0];
    const overdueTasks = this.tasks.filter(task => {
      // Usar parseLocalDate para evitar problemas de timezone
      const taskDate = this.parseLocalDate(task.date);
      if (!taskDate) return false;

      const now = new Date();
      taskDate.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      return taskDate < now && !task.completed;
    });

    for (const task of overdueTasks) {
      await this.updateTask(task.id, { date: today });
    }

    return overdueTasks.length;
  }

  // Buscar tarefa por ID
  getTaskById(id) {
    return this.tasks.find(t => t.id === id);
  }

  // Formatar data para exibição
  formatDate(dateStr) {
    // Usar parseLocalDate para evitar problemas de timezone
    const date = this.parseLocalDate(dateStr);
    if (!date) return dateStr;

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Reset hours for comparison
    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) {
      return 'Hoje';
    } else if (date.getTime() === tomorrow.getTime()) {
      return 'Amanhã';
    }

    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('pt-BR', options);
  }

  // Formatar data para título de seção
  formatSectionDate(dateStr) {
    // Usar parseLocalDate para evitar problemas de timezone
    const date = this.parseLocalDate(dateStr);
    if (!date) return dateStr;

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) {
      return 'Hoje';
    } else if (date.getTime() === tomorrow.getTime()) {
      return 'Amanhã';
    }

    const dayOfWeek = date.toLocaleDateString('pt-BR', { weekday: 'long' });
    const dayMonth = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    const year = date.getFullYear() !== today.getFullYear() ? `, ${date.getFullYear()}` : '';

    return `${dayMonth}${year} · ${dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)}`;
  }
}

// Exportar instância global
window.tasksManager = new TasksManager();
