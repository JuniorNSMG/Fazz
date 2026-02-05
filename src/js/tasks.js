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
    if (!dateStr) return new Date();

    // Se já for um objeto Date, retornar
    if (dateStr instanceof Date) return dateStr;

    // Parse manual para evitar conversão UTC
    const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));
    return new Date(year, month - 1, day);
  }

  // Obter data de hoje no formato YYYY-MM-DD (fuso horário local)
  getTodayString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Carregar tarefas (do Supabase ou localStorage)
  async loadTasks() {
    // Se estiver autenticado no Supabase, buscar de lá
    if (window.supabaseClient.isAuthenticated()) {
      const { data, error } = await window.supabaseClient.fetchTasks();

      if (!error && data) {
        // Inicializar tags e anexos como arrays vazios se não existirem
        data.forEach(task => {
          task.tags = task.tags || [];
          task.attachments = task.attachments || [];

          // Debug: mostrar quantas tags cada tarefa tem
          if (task.tags.length > 0) {
            console.log(`📌 Tarefa "${task.title}" tem ${task.tags.length} tag(s):`, task.tags.map(t => t.name));
          }
        });

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
    const newTask = {
      id: this.generateId(),
      title: taskData.title,
      date: taskData.date,
      time: taskData.time || null,
      notes: taskData.notes || null,
      completed: false,
      tags: [],
      recurrence: taskData.recurrence || null, // Nova propriedade de recorrência
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Se estiver autenticado, salvar no Supabase
    if (window.supabaseClient.isAuthenticated()) {
      const { data, error } = await window.supabaseClient.createTask(newTask);

      if (!error && data) {
        data.tags = []; // Inicializar tags vazio
        this.tasks.push(data);
        this.saveTasks();
        return data;
      }
    }

    // Caso contrário, salvar localmente
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

      // Usar parseLocalDate para evitar problema de fuso horário
      const taskDate = this.parseLocalDate(task.date);
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

  // Limpar tarefas concluídas
  async clearCompleted() {
    const completedTasks = this.tasks.filter(t => t.completed);

    // Se estiver autenticado, deletar do Supabase
    if (window.supabaseClient.isAuthenticated()) {
      for (const task of completedTasks) {
        await window.supabaseClient.deleteTask(task.id);
      }
    }

    // Remover localmente
    this.tasks = this.tasks.filter(t => !t.completed);
    this.saveTasks();

    return completedTasks.length;
  }

  // Formatar data para exibição
  formatDate(dateStr) {
    // Usar parseLocalDate para evitar problema de fuso horário
    const date = this.parseLocalDate(dateStr);
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

  // ==========================================
  // SISTEMA DE RECORRÊNCIA
  // ==========================================

  // Calcular próxima data de recorrência
  calculateNextRecurrence(task) {
    if (!task.recurrence || !task.recurrence.enabled) return null;

    const currentDate = this.parseLocalDate(task.date);
    const recurrence = task.recurrence;
    let nextDate = new Date(currentDate);

    switch (recurrence.type) {
      case 'daily':
        // Diariamente - adiciona N dias
        nextDate.setDate(nextDate.getDate() + (recurrence.interval || 1));
        break;

      case 'weekly':
        // Semanalmente - mesmo(s) dia(s) da semana
        nextDate.setDate(nextDate.getDate() + 7 * (recurrence.interval || 1));
        break;

      case 'monthly-date':
        // Mensalmente - mesmo dia do mês (ex: dia 15 de cada mês)
        nextDate.setMonth(nextDate.getMonth() + (recurrence.interval || 1));
        break;

      case 'monthly-weekday':
        // Mensalmente - mesmo dia da semana (ex: primeira segunda-feira)
        const weekOfMonth = Math.ceil(currentDate.getDate() / 7);
        const dayOfWeek = currentDate.getDay();
        nextDate.setMonth(nextDate.getMonth() + (recurrence.interval || 1));
        nextDate.setDate(1);

        // Encontrar o dia da semana correto
        while (nextDate.getDay() !== dayOfWeek) {
          nextDate.setDate(nextDate.getDate() + 1);
        }

        // Avançar para a semana correta
        nextDate.setDate(nextDate.getDate() + (weekOfMonth - 1) * 7);
        break;

      case 'monthly-workday':
        // Dia útil do mês (ex: 5º dia útil)
        const workdayNumber = recurrence.workdayNumber || 1;
        nextDate.setMonth(nextDate.getMonth() + (recurrence.interval || 1));
        nextDate.setDate(1);

        let workdaysCount = 0;
        while (workdaysCount < workdayNumber) {
          const day = nextDate.getDay();
          // Segunda a sexta (1-5)
          if (day !== 0 && day !== 6) {
            workdaysCount++;
          }
          if (workdaysCount < workdayNumber) {
            nextDate.setDate(nextDate.getDate() + 1);
          }
        }
        break;

      case 'yearly':
        // Anualmente - mesma data
        nextDate.setFullYear(nextDate.getFullYear() + (recurrence.interval || 1));
        break;

      case 'custom-weekdays':
        // Dias da semana específicos (ex: seg, qua, sex)
        const selectedDays = recurrence.weekdays || [];
        nextDate.setDate(nextDate.getDate() + 1);

        // Encontrar próximo dia da semana selecionado
        while (!selectedDays.includes(nextDate.getDay())) {
          nextDate.setDate(nextDate.getDate() + 1);
        }
        break;
    }

    // Verificar se passou da data de fim (se houver)
    if (recurrence.endDate) {
      const endDate = this.parseLocalDate(recurrence.endDate);
      if (nextDate > endDate) {
        return null; // Recorrência terminou
      }
    }

    // Verificar se passou do limite de ocorrências (se houver)
    if (recurrence.occurrences && recurrence.currentOccurrence >= recurrence.occurrences) {
      return null; // Atingiu limite de ocorrências
    }

    return this.formatDateToString(nextDate);
  }

  // Formatar Date para string YYYY-MM-DD
  formatDateToString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Criar próxima ocorrência de tarefa recorrente
  async createNextRecurrence(completedTask) {
    console.log('🔄 createNextRecurrence chamado para:', completedTask.title);
    console.log('🔄 Recorrência da tarefa:', completedTask.recurrence);

    if (!completedTask.recurrence || !completedTask.recurrence.enabled) {
      console.log('❌ Tarefa não tem recorrência habilitada');
      return null;
    }

    const nextDate = this.calculateNextRecurrence(completedTask);
    console.log('🔄 Próxima data calculada:', nextDate);

    if (!nextDate) {
      console.log('❌ Recorrência terminou (sem próxima data)');
      return null; // Recorrência terminou
    }

    // Criar nova tarefa com a mesma configuração
    const newTaskData = {
      title: completedTask.title,
      date: nextDate,
      time: completedTask.time,
      notes: completedTask.notes,
      tags: completedTask.tags,
      recurrence: {
        ...completedTask.recurrence,
        currentOccurrence: (completedTask.recurrence.currentOccurrence || 0) + 1
      }
    };

    console.log('🔄 Criando nova tarefa com dados:', newTaskData);
    const newTask = await this.createTask(newTaskData);
    console.log('✅ Nova tarefa recorrente criada:', newTask);

    return newTask;
  }

  // Override do toggleComplete para lidar com recorrência
  async toggleComplete(id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return null;

    console.log('🔄 toggleComplete chamado para:', task.title);
    console.log('🔄 Tarefa tem recorrência?', task.recurrence);

    const wasCompleted = task.completed;

    // IMPORTANTE: Preservar recorrência ao atualizar
    const updates = {
      completed: !task.completed,
      recurrence: task.recurrence // Preservar recorrência
    };

    const updatedTask = await this.updateTask(id, updates);

    console.log('🔄 wasCompleted:', wasCompleted, 'updatedTask.completed:', updatedTask.completed);
    console.log('🔄 updatedTask.recurrence após update:', updatedTask.recurrence);

    // Se a tarefa foi marcada como concluída e tem recorrência
    if (!wasCompleted && updatedTask.completed && updatedTask.recurrence && updatedTask.recurrence.enabled) {
      console.log('✅ Criando próxima ocorrência da tarefa recorrente');
      const nextTask = await this.createNextRecurrence(updatedTask);
      console.log('✅ Próxima tarefa criada:', nextTask);
    } else {
      console.log('❌ Não criou próxima ocorrência. Motivos:', {
        wasCompleted,
        isCompleted: updatedTask.completed,
        hasRecurrence: !!updatedTask.recurrence,
        isEnabled: updatedTask.recurrence?.enabled
      });
    }

    return updatedTask;
  }

  // Obter descrição da recorrência para exibição
  getRecurrenceDescription(recurrence) {
    if (!recurrence || !recurrence.enabled) return null;

    const interval = recurrence.interval || 1;
    let description = '';

    switch (recurrence.type) {
      case 'daily':
        description = interval === 1 ? 'Diariamente' : `A cada ${interval} dias`;
        break;
      case 'weekly':
        description = interval === 1 ? 'Semanalmente' : `A cada ${interval} semanas`;
        break;
      case 'monthly-date':
        description = interval === 1 ? 'Mensalmente' : `A cada ${interval} meses`;
        break;
      case 'monthly-weekday':
        description = 'Mensalmente (mesmo dia da semana)';
        break;
      case 'monthly-workday':
        const workday = recurrence.workdayNumber || 1;
        description = `${workday}º dia útil do mês`;
        break;
      case 'yearly':
        description = interval === 1 ? 'Anualmente' : `A cada ${interval} anos`;
        break;
      case 'custom-weekdays':
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const selectedDays = (recurrence.weekdays || []).map(d => days[d]).join(', ');
        description = `Toda ${selectedDays}`;
        break;
    }

    // Adicionar informação de fim
    if (recurrence.endDate) {
      description += ` até ${this.formatDate(recurrence.endDate)}`;
    } else if (recurrence.occurrences) {
      description += ` (${recurrence.occurrences} vezes)`;
    }

    return description;
  }
}

// Exportar instância global
window.tasksManager = new TasksManager();
