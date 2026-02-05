// ==========================================
// FAZZ - Tasks Manager
// ==========================================

class TasksManager {
  constructor() {
    this.tasks = [];
    this.currentEditingTask = null;
  }

  // Converter string de data (YYYY-MM-DD) para Date local (corrigir problema de fuso horário)
  parseLocalDate(dateStr) {
    console.log('🔍 parseLocalDate - Input:', dateStr, 'Type:', typeof dateStr);

    if (!dateStr) {
      console.log('⚠️ parseLocalDate - dateStr vazio, retornando new Date()');
      return new Date();
    }

    // Se já for um objeto Date, retornar
    if (dateStr instanceof Date) {
      console.log('✓ parseLocalDate - Já é Date:', dateStr);
      return dateStr;
    }

    // Parse manual para evitar conversão UTC
    const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));
    const localDate = new Date(year, month - 1, day);

    console.log('📅 parseLocalDate - Parsed:', {
      input: dateStr,
      year, month, day,
      result: localDate.toISOString(),
      localString: localDate.toLocaleDateString('pt-BR'),
      dayOfMonth: localDate.getDate(),
      monthIndex: localDate.getMonth()
    });

    return localDate;
  }

  // Obter data de hoje no formato YYYY-MM-DD (fuso horário local)
  getTodayString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const result = `${year}-${month}-${day}`;

    console.log('📆 getTodayString:', {
      now: today.toISOString(),
      localDate: today.toLocaleDateString('pt-BR'),
      year, month, day,
      result
    });

    return result;
  }

  // Carregar tarefas (do Supabase ou localStorage)
  async loadTasks() {
    console.log('📂 loadTasks - Iniciando carregamento');

    // Se estiver autenticado no Supabase, buscar de lá
    if (window.supabaseClient.isAuthenticated()) {
      const { data, error } = await window.supabaseClient.fetchTasks();

      if (!error && data) {
        console.log('✓ loadTasks - Carregado do Supabase:', data.length, 'tarefas');
        data.forEach(task => {
          console.log('  - Tarefa:', task.title, 'Data:', task.date);
        });

        // Carregar tags e anexos de cada tarefa
        for (const task of data) {
          const tags = await window.tagsManager.getTaskTags(task.id);
          task.tags = tags;

          const attachments = await window.attachmentsManager.getTaskAttachments(task.id);
          task.attachments = attachments;
        }

        this.tasks = data;
        this.saveTasks(); // Salvar localmente como backup
        return this.tasks;
      }
    }

    // Caso contrário, buscar do localStorage
    const stored = localStorage.getItem(CONFIG.storage.TASKS_KEY);
    if (stored) {
      try {
        this.tasks = JSON.parse(stored);
        console.log('✓ loadTasks - Carregado do localStorage:', this.tasks.length, 'tarefas');
        this.tasks.forEach(task => {
          console.log('  - Tarefa:', task.title, 'Data:', task.date);
        });
      } catch (e) {
        console.error('Erro ao carregar tarefas do localStorage:', e);
        this.tasks = [];
      }
    }

    return this.tasks;
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
    console.log('✨ createTask - Input taskData:', taskData);

    const newTask = {
      id: this.generateId(),
      title: taskData.title,
      date: taskData.date,
      time: taskData.time || null,
      notes: taskData.notes || null,
      completed: false,
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('💾 createTask - newTask criada:', newTask);

    // Se estiver autenticado, salvar no Supabase
    if (window.supabaseClient.isAuthenticated()) {
      const { data, error } = await window.supabaseClient.createTask(newTask);

      if (!error && data) {
        console.log('✓ createTask - Salvo no Supabase:', data);
        data.tags = []; // Inicializar tags vazio
        this.tasks.push(data);
        this.saveTasks();
        return data;
      }
    }

    // Caso contrário, salvar localmente
    console.log('💾 createTask - Salvando localmente');
    this.tasks.push(newTask);
    this.saveTasks();
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
        return data;
      }
    }

    // Caso contrário, atualizar localmente
    this.tasks[taskIndex] = updatedTask;
    this.saveTasks();
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

    console.log('📋 getGroupedTasks - Hoje:', {
      today: today.toISOString(),
      localDate: today.toLocaleDateString('pt-BR'),
      timestamp: today.getTime()
    });

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

      console.log('🔄 getGroupedTasks - Processando tarefa:', {
        id: task.id,
        title: task.title,
        dateString: task.date
      });

      // Usar parseLocalDate para evitar problema de fuso horário
      const taskDate = this.parseLocalDate(task.date);
      taskDate.setHours(0, 0, 0, 0);

      console.log('⏰ getGroupedTasks - Comparação:', {
        taskDate: taskDate.toISOString(),
        taskLocalDate: taskDate.toLocaleDateString('pt-BR'),
        taskTimestamp: taskDate.getTime(),
        todayTimestamp: today.getTime(),
        diff: taskDate.getTime() - today.getTime(),
        isEqual: taskDate.getTime() === today.getTime(),
        isLess: taskDate < today,
        category: taskDate < today ? 'overdue' : (taskDate.getTime() === today.getTime() ? 'today' : 'upcoming')
      });

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
    const today = this.getTodayString();
    const overdueTasks = this.tasks.filter(task => {
      const taskDate = this.parseLocalDate(task.date);
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
    console.log('🎨 formatDate - Input:', dateStr);

    // Usar parseLocalDate para evitar problema de fuso horário
    const date = this.parseLocalDate(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Reset hours for comparison
    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);

    console.log('🎨 formatDate - Comparação:', {
      dateStr,
      date: date.toLocaleDateString('pt-BR'),
      today: today.toLocaleDateString('pt-BR'),
      tomorrow: tomorrow.toLocaleDateString('pt-BR'),
      isToday: date.getTime() === today.getTime(),
      isTomorrow: date.getTime() === tomorrow.getTime()
    });

    if (date.getTime() === today.getTime()) {
      console.log('✓ formatDate - Retornando "Hoje"');
      return 'Hoje';
    } else if (date.getTime() === tomorrow.getTime()) {
      console.log('✓ formatDate - Retornando "Amanhã"');
      return 'Amanhã';
    }

    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    const formatted = date.toLocaleDateString('pt-BR', options);
    console.log('✓ formatDate - Retornando formatado:', formatted);
    return formatted;
  }

  // Formatar data para título de seção
  formatSectionDate(dateStr) {
    // Usar parseLocalDate para evitar problema de fuso horário
    const date = this.parseLocalDate(dateStr);
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
