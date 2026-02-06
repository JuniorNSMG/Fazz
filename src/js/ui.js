// ==========================================
// FAZZ - UI Manager
// ==========================================

class UIManager {
  constructor() {
    this.taskModal = null;
    this.taskForm = null;
    this.tagModal = null;
    this.imageModal = null;
    this.currentEditingId = null;
    this.selectedTags = [];
    this.selectedColor = 'blue';
    this.currentAttachments = [];
    this.pendingFiles = [];
    this.currentImageAttachment = null;
    this.currentView = 'inbox'; // View padrão: Entrada
  }

  init() {
    this.taskModal = document.getElementById('taskModal');
    this.taskForm = document.getElementById('taskForm');
    this.tagModal = document.getElementById('tagModal');
    this.imageModal = document.getElementById('imageModal');

    this.setupEventListeners();
    this.updateTime();
    setInterval(() => this.updateTime(), 60000); // Atualizar a cada minuto

    // Carregar tags
    this.loadAvailableTags();
  }

  setupEventListeners() {
    // FAB - Adicionar Tarefa
    document.getElementById('fabAddTask')?.addEventListener('click', () => {
      this.openTaskModal();
    });

    // Fechar Modal
    document.getElementById('btnCloseModal')?.addEventListener('click', () => {
      this.closeTaskModal();
    });

    document.getElementById('btnCancelTask')?.addEventListener('click', () => {
      this.closeTaskModal();
    });

    // Excluir Tarefa
    document.getElementById('btnDeleteTask')?.addEventListener('click', () => {
      this.handleDeleteTask();
    });

    // Overlay do Modal
    this.taskModal?.querySelector('.modal-overlay')?.addEventListener('click', () => {
      this.closeTaskModal();
    });

    // Form de Tarefa
    this.taskForm?.addEventListener('submit', (e) => this.handleTaskSubmit(e));

    // Bottom Nav
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => this.handleNavigation(item.dataset.view));
    });

    // Botão Reagendar Atrasadas
    document.getElementById('btnRescheduleOverdue')?.addEventListener('click', () => {
      this.handleRescheduleOverdue();
    });

    // Menu do usuário
    document.getElementById('btnMenu')?.addEventListener('click', () => {
      this.showUserMenu();
    });

    // Tags
    document.getElementById('btnAddTag')?.addEventListener('click', () => {
      this.openTagModal();
    });

    document.getElementById('btnCloseTagModal')?.addEventListener('click', () => {
      this.closeTagModal();
    });

    document.getElementById('btnCancelTag')?.addEventListener('click', () => {
      this.closeTagModal();
    });

    // Toggle new tag form
    document.getElementById('btnToggleNewTag')?.addEventListener('click', () => {
      const form = document.getElementById('tagForm');
      const btn = document.getElementById('btnToggleNewTag');
      if (form && btn) {
        form.classList.toggle('hidden');
        btn.textContent = form.classList.contains('hidden') ? 'Criar Nova Tag' : 'Cancelar';
      }
    });

    document.getElementById('tagForm')?.addEventListener('submit', (e) => {
      this.handleTagSubmit(e);
    });

    // Color picker (compact version)
    const colorOptions = document.querySelectorAll('.color-option-small');
    colorOptions.forEach(option => {
      option.addEventListener('click', () => {
        colorOptions.forEach(o => o.classList.remove('active'));
        option.classList.add('active');
        this.selectedColor = option.dataset.color;
      });
    });

    // Anexos
    document.getElementById('btnAddAttachment')?.addEventListener('click', () => {
      document.getElementById('fileInput')?.click();
    });

    document.getElementById('fileInput')?.addEventListener('change', (e) => {
      this.handleFileSelect(e);
    });

    // Image modal
    document.getElementById('btnCloseImageModal')?.addEventListener('click', () => {
      this.closeImageModal();
    });

    document.getElementById('btnDownloadImage')?.addEventListener('click', () => {
      if (this.currentImageAttachment) {
        this.downloadAttachment(this.currentImageAttachment);
      }
    });

    // Fechar modal ao clicar no overlay
    this.imageModal?.querySelector('.modal-overlay')?.addEventListener('click', () => {
      this.closeImageModal();
    });

    // Recorrência
    const btnAddRecurrence = document.getElementById('btnAddRecurrence');
    console.log('🔄 Botão de recorrência encontrado:', btnAddRecurrence);
    if (btnAddRecurrence) {
      btnAddRecurrence.addEventListener('click', () => {
        console.log('🔄 Clique no botão de recorrência detectado!');
        this.openRecurrenceModal();
      });
    } else {
      console.error('❌ Botão btnAddRecurrence não encontrado!');
    }

    document.getElementById('btnCloseRecurrenceModal')?.addEventListener('click', () => {
      this.closeRecurrenceModal();
    });

    document.getElementById('btnCancelRecurrence')?.addEventListener('click', () => {
      this.closeRecurrenceModal();
    });

    document.getElementById('btnSaveRecurrence')?.addEventListener('click', () => {
      this.saveRecurrence();
    });

    document.getElementById('btnRemoveRecurrence')?.addEventListener('click', () => {
      this.removeRecurrence();
    });

    // Recurrence modal overlay
    document.getElementById('recurrenceModal')?.querySelector('.modal-overlay')?.addEventListener('click', () => {
      this.closeRecurrenceModal();
    });

    // Tipo de recorrência - mostrar/ocultar campos
    document.getElementById('recurrenceType')?.addEventListener('change', (e) => {
      this.handleRecurrenceTypeChange(e.target.value);
    });

    // Tipo de término - mostrar/ocultar campos
    document.getElementById('recurrenceEndType')?.addEventListener('change', (e) => {
      this.handleRecurrenceEndTypeChange(e.target.value);
    });
  }

  // Atualizar relógio do header
  updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeElement = document.getElementById('currentTime');

    if (timeElement) {
      timeElement.textContent = `${hours}:${minutes}`;
    }
  }

  // Renderizar todas as tarefas
  renderTasks() {
    // Usar view atual se definida, senão renderizar tudo
    if (this.currentView) {
      this.renderTasksByView(this.currentView);
    } else {
      const grouped = window.tasksManager.getGroupedTasks();

      // Renderizar Atrasadas
      this.renderOverdueTasks(grouped.overdue);

      // Renderizar Datas (Hoje + Futuras)
      this.renderDateSections(grouped);

      // Renderizar Concluídas
      this.renderCompletedTasks(grouped.completed);
    }
  }

  // Renderizar Tarefas Atrasadas
  renderOverdueTasks(tasks) {
    const overdueSection = document.getElementById('overdueSection');
    const overdueList = document.getElementById('overdueList');

    if (!overdueList) return;

    if (tasks.length === 0) {
      overdueSection.style.display = 'none';
      return;
    }

    overdueSection.style.display = 'flex';
    overdueList.innerHTML = '';

    tasks.forEach(task => {
      overdueList.appendChild(this.createTaskElement(task, true));
    });
  }

  // Renderizar Seções de Datas
  renderDateSections(grouped) {
    const dateSectionsContainer = document.getElementById('dateSections');
    if (!dateSectionsContainer) return;

    dateSectionsContainer.innerHTML = '';

    // Renderizar Hoje
    if (grouped.today.length > 0) {
      const todaySection = this.createDateSection('Hoje', grouped.today);
      dateSectionsContainer.appendChild(todaySection);
    }

    // Renderizar Datas Futuras (ordenadas)
    const upcomingDates = Object.keys(grouped.upcoming).sort();

    upcomingDates.forEach(dateStr => {
      const tasks = grouped.upcoming[dateStr];
      const formattedDate = window.tasksManager.formatSectionDate(dateStr);
      const section = this.createDateSection(formattedDate, tasks);
      dateSectionsContainer.appendChild(section);
    });
  }

  // Criar Seção de Data
  createDateSection(title, tasks) {
    const section = document.createElement('section');
    section.className = 'task-section';

    const header = document.createElement('div');
    header.className = 'section-header';

    const titleElement = document.createElement('h2');
    titleElement.className = 'section-title';
    titleElement.textContent = title;

    header.appendChild(titleElement);
    section.appendChild(header);

    const taskList = document.createElement('ul');
    taskList.className = 'task-list';

    tasks.forEach(task => {
      taskList.appendChild(this.createTaskElement(task, false));
    });

    section.appendChild(taskList);

    return section;
  }

  // Renderizar Tarefas Concluídas
  renderCompletedTasks(tasks) {
    const tasksContainer = document.getElementById('tasksContainer');
    if (!tasksContainer) return;

    // Remover seção antiga de concluídas (se existir)
    const oldSection = document.getElementById('completedSection');
    if (oldSection) {
      oldSection.remove();
    }

    if (tasks.length === 0) return;

    const section = document.createElement('section');
    section.className = 'task-section completed-section collapsed';
    section.id = 'completedSection';

    const header = document.createElement('div');
    header.className = 'section-header';

    // Título clicável para expandir/recolher
    const titleElement = document.createElement('h2');
    titleElement.className = 'section-title completed-title-toggle';
    titleElement.textContent = `Concluídas (${tasks.length})`;
    titleElement.addEventListener('click', () => {
      section.classList.toggle('collapsed');
    });

    header.appendChild(titleElement);
    section.appendChild(header);

    // Container de lista
    const taskList = document.createElement('ul');
    taskList.className = 'task-list';

    // Botão "Limpar" aparece como primeiro item quando expandido
    const clearListItem = document.createElement('li');
    clearListItem.className = 'clear-completed-item';

    const clearButton = document.createElement('button');
    clearButton.className = 'btn-clear-completed-inline';
    clearButton.textContent = 'Limpar concluídas';
    clearButton.addEventListener('click', () => this.handleClearCompleted());

    clearListItem.appendChild(clearButton);
    taskList.appendChild(clearListItem);

    // Adicionar tarefas
    tasks.forEach(task => {
      taskList.appendChild(this.createTaskElement(task, false));
    });

    section.appendChild(taskList);
    tasksContainer.appendChild(section);
  }

  // Criar Elemento de Tarefa
  createTaskElement(task, isOverdue = false) {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.dataset.taskId = task.id;

    if (task.completed) {
      li.classList.add('completed');
    }

    if (isOverdue) {
      li.classList.add('overdue');
    }

    // Checkbox
    const checkbox = document.createElement('div');
    checkbox.className = 'task-checkbox';
    checkbox.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    `;
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleToggleComplete(task.id);
    });

    // Content
    const content = document.createElement('div');
    content.className = 'task-content';

    const title = document.createElement('div');
    title.className = 'task-title';
    title.textContent = task.title;

    content.appendChild(title);

    // Tags (se houver)
    if (task.tags && task.tags.length > 0) {
      console.log(`🏷️ Renderizando ${task.tags.length} tag(s) para tarefa "${task.title}"`);
      const tagsContainer = document.createElement('div');
      tagsContainer.className = 'task-tags';
      task.tags.forEach(tag => {
        tagsContainer.appendChild(this.createTagElement(tag, false));
      });
      content.appendChild(tagsContainer);
    } else {
      console.log(`⚠️ Tarefa "${task.title}" não tem tags (tags:`, task.tags, ')');
    }

    const meta = document.createElement('div');
    meta.className = 'task-meta';

    // Data e Horário
    const dateDiv = document.createElement('div');
    dateDiv.className = 'task-date';

    const dateIcon = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    `;

    const dateText = window.tasksManager.formatDate(task.date);
    const timeText = task.time ? ` ${task.time}` : '';

    dateDiv.innerHTML = `${dateIcon} ${dateText}${timeText}`;

    meta.appendChild(dateDiv);

    // Indicador de observações
    if (task.notes && task.notes.trim()) {
      const notesIndicator = document.createElement('div');
      notesIndicator.className = 'task-indicator';
      notesIndicator.title = 'Possui observações';
      notesIndicator.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <line x1="10" y1="9" x2="8" y2="9"/>
        </svg>
      `;
      meta.appendChild(notesIndicator);
    }

    // Indicador de anexos
    if (task.attachments && task.attachments.length > 0) {
      const attachmentIndicator = document.createElement('div');
      attachmentIndicator.className = 'task-indicator';
      attachmentIndicator.title = `${task.attachments.length} anexo${task.attachments.length > 1 ? 's' : ''}`;
      attachmentIndicator.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
        </svg>
        <span class="indicator-count">${task.attachments.length}</span>
      `;
      meta.appendChild(attachmentIndicator);
    }

    // Indicador de recorrência
    if (task.recurrence && task.recurrence.enabled) {
      const recurrenceIndicator = document.createElement('div');
      recurrenceIndicator.className = 'task-indicator';
      recurrenceIndicator.title = 'Tarefa recorrente';
      recurrenceIndicator.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M23 4v6h-6"/>
          <path d="M1 20v-6h6"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
      `;
      meta.appendChild(recurrenceIndicator);
    }

    content.appendChild(meta);

    // Adicionar ao item
    li.appendChild(checkbox);
    li.appendChild(content);

    // Click para editar
    li.addEventListener('click', (e) => {
      if (e.target === checkbox || e.target.closest('.task-checkbox')) return;
      this.openTaskModal(task);
    });

    return li;
  }

  // Abrir Modal de Tarefa
  async openTaskModal(task = null) {
    this.editingTaskId = task?.id || null;
    this.currentEditingId = task?.id || null;
    this.selectedTags = [];
    this.pendingFiles = [];
    this.currentAttachments = [];
    this.currentRecurrence = null;

    const modalTitle = document.getElementById('modalTitle');
    const taskTitle = document.getElementById('taskTitle');
    const taskDate = document.getElementById('taskDate');
    const taskTime = document.getElementById('taskTime');
    const taskNotes = document.getElementById('taskNotes');
    const descElement = document.getElementById('recurrenceDescription');
    const btnText = document.getElementById('recurrenceButtonText');
    const btnDelete = document.getElementById('btnDeleteTask');

    if (task) {
      modalTitle.textContent = 'Editar Tarefa';
      taskTitle.value = task.title;
      taskDate.value = task.date;
      taskTime.value = task.time || '';
      taskNotes.value = task.notes || '';

      // Mostrar botão excluir no modo edição
      if (btnDelete) btnDelete.style.display = 'block';

      // Carregar tags da tarefa
      const taskTags = await window.tagsManager.getTaskTags(task.id);
      this.selectedTags = taskTags.map(tag => tag.id);

      // Carregar anexos da tarefa
      await this.loadAttachments(task.id);

      // Carregar recorrência
      if (task.recurrence && task.recurrence.enabled) {
        this.currentRecurrence = task.recurrence;
        this.updateRecurrenceDescription(task.recurrence);
      } else {
        if (descElement) descElement.classList.add('hidden');
        if (btnText) btnText.textContent = 'Adicionar Recorrência';
      }
    } else {
      modalTitle.textContent = 'Nova Tarefa';
      taskTitle.value = '';
      taskDate.value = window.tasksManager.getTodayString();
      taskTime.value = '';
      taskNotes.value = '';

      // Ocultar botão excluir no modo criar
      if (btnDelete) btnDelete.style.display = 'none';

      // Limpar lista de anexos
      this.renderPendingAttachments();

      // Limpar recorrência
      if (descElement) descElement.classList.add('hidden');
      if (btnText) btnText.textContent = 'Adicionar Recorrência';
    }

    this.renderAvailableTags();
    this.taskModal?.classList.add('active');
    taskTitle?.focus();
  }

  // Fechar Modal de Tarefa
  closeTaskModal() {
    this.taskModal?.classList.remove('active');
    this.currentEditingId = null;
    this.editingTaskId = null;
    this.currentRecurrence = null;
    this.taskForm?.reset();

    // Limpar descrição de recorrência
    const descElement = document.getElementById('recurrenceDescription');
    const btnText = document.getElementById('recurrenceButtonText');
    if (descElement) descElement.classList.add('hidden');
    if (btnText) btnText.textContent = 'Adicionar Recorrência';
  }

  // Submeter Formulário de Tarefa
  async handleTaskSubmit(e) {
    e.preventDefault();

    const taskData = {
      title: document.getElementById('taskTitle').value.trim(),
      date: document.getElementById('taskDate').value,
      time: document.getElementById('taskTime').value || null,
      notes: document.getElementById('taskNotes').value.trim() || null,
      recurrence: this.currentRecurrence || null
    };

    console.log('💾 Salvando tarefa com recorrência:', taskData.recurrence);

    if (!taskData.title || !taskData.date) {
      alert('Por favor, preencha o título e a data');
      return;
    }

    let taskId;
    if (this.currentEditingId) {
      // Atualizar tarefa existente
      const updatedTask = await window.tasksManager.updateTask(this.currentEditingId, taskData);
      console.log('💾 Tarefa atualizada:', updatedTask);
      taskId = this.currentEditingId;
    } else {
      // Criar nova tarefa
      const newTask = await window.tasksManager.createTask(taskData);
      console.log('💾 Nova tarefa criada:', newTask);
      taskId = newTask.id;
    }

    // Sincronizar tags
    const tagObjects = [];

    // Se estiver editando, obter tags atuais para comparar
    let currentTags = [];
    if (this.currentEditingId) {
      currentTags = await window.tagsManager.getTaskTags(taskId);
      const currentTagIds = currentTags.map(t => t.id);

      // Remover tags que foram desmarcadas
      for (const currentTag of currentTags) {
        if (!this.selectedTags.includes(currentTag.id)) {
          await window.tagsManager.removeTagFromTask(taskId, currentTag.id);
        }
      }

      // Adicionar apenas tags novas
      for (const tagId of this.selectedTags) {
        if (!currentTagIds.includes(tagId)) {
          await window.tagsManager.addTagToTask(taskId, tagId);
        }
        const tag = window.tagsManager.getTagById(tagId);
        if (tag) tagObjects.push(tag);
      }
    } else {
      // Nova tarefa: adicionar todas as tags
      for (const tagId of this.selectedTags) {
        await window.tagsManager.addTagToTask(taskId, tagId);
        const tag = window.tagsManager.getTagById(tagId);
        if (tag) tagObjects.push(tag);
      }
    }

    // Fazer upload de anexos pendentes
    const uploadedAttachments = [];
    if (this.pendingFiles.length > 0) {
      for (const file of this.pendingFiles) {
        const { data, error } = await window.attachmentsManager.uploadAttachment(taskId, file);
        if (!error && data) {
          uploadedAttachments.push(data);
        } else {
          console.error('Erro ao fazer upload de anexo:', file.name, error);
        }
      }
    }

    // Atualizar tarefa local com tags e anexos (preservando recorrência)
    const task = window.tasksManager.tasks.find(t => t.id === taskId);
    if (task) {
      task.tags = tagObjects;
      task.attachments = [...this.currentAttachments, ...uploadedAttachments];
      // IMPORTANTE: Preservar recorrência se foi definida
      if (this.currentRecurrence) {
        task.recurrence = this.currentRecurrence;
      }
      console.log('💾 Tarefa final após adicionar tags/anexos:', task);
      window.tasksManager.saveTasks();
    }

    this.closeTaskModal();
    this.selectedTags = [];
    this.pendingFiles = [];
    this.currentAttachments = [];
    this.renderTasks();
  }

  // Marcar/Desmarcar Tarefa como Concluída
  async handleToggleComplete(id) {
    await window.tasksManager.toggleComplete(id);
    this.renderTasks();
  }

  // Reagendar Tarefas Atrasadas
  async handleRescheduleOverdue() {
    if (confirm('Deseja reagendar todas as tarefas atrasadas para hoje?')) {
      const count = await window.tasksManager.rescheduleOverdue();
      alert(`${count} tarefa(s) reagendada(s) para hoje`);
      this.renderTasks();
    }
  }

  // Limpar tarefas concluídas
  async handleClearCompleted() {
    const completedCount = window.tasksManager.tasks.filter(t => t.completed).length;

    if (completedCount === 0) {
      alert('Não há tarefas concluídas para limpar');
      return;
    }

    if (confirm(`Deseja limpar ${completedCount} tarefa(s) concluída(s)? Esta ação não pode ser desfeita.`)) {
      const count = await window.tasksManager.clearCompleted();
      alert(`${count} tarefa(s) removida(s)`);
      this.renderTasks();
    }
  }

  // Excluir Tarefa
  async handleDeleteTask() {
    if (!this.editingTaskId) {
      alert('Nenhuma tarefa selecionada para excluir');
      return;
    }

    const task = window.tasksManager.tasks.find(t => t.id === this.editingTaskId);
    const taskTitle = task ? task.title : 'esta tarefa';

    if (confirm(`Deseja realmente excluir "${taskTitle}"? Esta ação não pode ser desfeita.`)) {
      try {
        await window.tasksManager.deleteTask(this.editingTaskId);
        this.closeTaskModal();
        this.renderTasks();
        alert('Tarefa excluída com sucesso');
      } catch (error) {
        console.error('Erro ao excluir tarefa:', error);
        alert('Erro ao excluir tarefa. Tente novamente.');
      }
    }
  }

  // Navegação
  handleNavigation(view) {
    this.currentView = view; // Salvar view atual

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.classList.remove('active');
    });

    const activeItem = document.querySelector(`[data-view="${view}"]`);
    activeItem?.classList.add('active');

    // Atualizar título da página
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) {
      const titles = {
        inbox: 'Entrada',
        today: 'Hoje',
        upcoming: 'Em Breve'
      };
      pageTitle.textContent = titles[view] || 'Fazz';
    }

    // Renderizar com filtro
    this.renderTasksByView(view);
  }

  // Renderizar tarefas por view
  renderTasksByView(view) {
    const grouped = window.tasksManager.getGroupedTasks();
    const tasksContainer = document.getElementById('tasksContainer');

    if (!tasksContainer) return;
    tasksContainer.innerHTML = '';

    switch(view) {
      case 'inbox':
        // Entrada: Atrasadas, Hoje e Amanhã
        this.renderOverdueTasks(grouped.overdue);
        this.renderTodayTasks(grouped.today);
        this.renderTomorrowTasks(grouped.upcoming);
        this.renderCompletedTasks(grouped.completed);
        break;

      case 'today':
        // Hoje: Só tarefas de hoje
        this.renderTodayTasks(grouped.today);
        this.renderCompletedTasks(grouped.completed);
        break;

      case 'upcoming':
        // Em Breve: Todas as tarefas futuras
        this.renderOverdueTasks(grouped.overdue);
        this.renderTodayTasks(grouped.today);
        this.renderUpcomingTasks(grouped.upcoming);
        this.renderCompletedTasks(grouped.completed);
        break;

      default:
        this.renderTasks();
    }
  }

  // Renderizar apenas tarefas de amanhã
  renderTomorrowTasks(upcomingTasks) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = window.tasksManager.formatDateToString(tomorrow);

    const tomorrowTasksMap = upcomingTasks[tomorrowStr] || [];

    if (tomorrowTasksMap.length === 0) return;

    const section = document.createElement('section');
    section.className = 'tasks-section';

    const titleElement = document.createElement('h2');
    titleElement.className = 'section-title';
    titleElement.textContent = `Amanhã (${tomorrowTasksMap.length})`;
    section.appendChild(titleElement);

    const tasksElement = document.createElement('div');
    tasksElement.className = 'tasks-list';

    tomorrowTasksMap.forEach(task => {
      const taskElement = this.createTaskElement(task);
      tasksElement.appendChild(taskElement);
    });

    section.appendChild(tasksElement);
    document.getElementById('tasksContainer')?.appendChild(section);
  }

  // Renderizar tarefas de hoje
  renderTodayTasks(todayTasks) {
    if (todayTasks.length === 0) return;

    const section = document.createElement('section');
    section.className = 'tasks-section';

    const titleElement = document.createElement('h2');
    titleElement.className = 'section-title';
    titleElement.textContent = `Hoje (${todayTasks.length})`;
    section.appendChild(titleElement);

    const tasksElement = document.createElement('div');
    tasksElement.className = 'tasks-list';

    todayTasks.forEach(task => {
      const taskElement = this.createTaskElement(task);
      tasksElement.appendChild(taskElement);
    });

    section.appendChild(tasksElement);
    document.getElementById('tasksContainer')?.appendChild(section);
  }

  // Renderizar todas as tarefas futuras
  renderUpcomingTasks(upcomingTasks) {
    const dates = Object.keys(upcomingTasks).sort();

    dates.forEach(dateStr => {
      const tasks = upcomingTasks[dateStr];
      if (tasks.length === 0) return;

      const section = document.createElement('section');
      section.className = 'tasks-section';

      const date = new Date(dateStr + 'T00:00:00');
      const dateTitle = this.formatDateTitle(date);

      const titleElement = document.createElement('h2');
      titleElement.className = 'section-title';
      titleElement.textContent = `${dateTitle} (${tasks.length})`;
      section.appendChild(titleElement);

      const tasksElement = document.createElement('div');
      tasksElement.className = 'tasks-list';

      tasks.forEach(task => {
        const taskElement = this.createTaskElement(task);
        tasksElement.appendChild(taskElement);
      });

      section.appendChild(tasksElement);
      document.getElementById('tasksContainer')?.appendChild(section);
    });
  }

  // Formatar título da data
  formatDateTitle(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    if (targetDate.getTime() === today.getTime()) {
      return 'Hoje';
    } else if (targetDate.getTime() === tomorrow.getTime()) {
      return 'Amanhã';
    } else {
      const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      return `${weekdays[targetDate.getDay()]}, ${targetDate.getDate()} ${months[targetDate.getMonth()]}`;
    }
  }

  // Menu do Usuário
  showUserMenu() {
    const options = ['Sair'];
    const choice = confirm('Deseja sair?');

    if (choice) {
      window.authManager.logout();
    }
  }

  // ==========================================
  // TAGS
  // ==========================================

  async loadAvailableTags() {
    await window.tagsManager.loadTags();
    this.renderAvailableTags();
  }

  renderAvailableTags() {
    const tagsList = document.getElementById('tagsList');
    if (!tagsList) return;

    tagsList.innerHTML = '';

    this.selectedTags.forEach(tagId => {
      const tag = window.tagsManager.getTagById(tagId);
      if (tag) {
        const tagElement = this.createTagElement(tag, true);
        tagsList.appendChild(tagElement);
      }
    });
  }

  createTagElement(tag, removable = false) {
    const tagEl = document.createElement('span');
    tagEl.className = `tag tag-${tag.color}`;
    if (removable) {
      tagEl.classList.add('tag-removable');
    }

    tagEl.innerHTML = `
      ${tag.name}
      ${removable ? `
        <span class="tag-remove" data-tag-id="${tag.id}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </span>
      ` : ''}
    `;

    if (removable) {
      tagEl.querySelector('.tag-remove')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeTagFromTask(tag.id);
      });
    }

    return tagEl;
  }

  removeTagFromTask(tagId) {
    this.selectedTags = this.selectedTags.filter(id => id !== tagId);
    this.renderAvailableTags();
  }

  openTagModal() {
    this.selectedColor = 'blue';
    document.getElementById('tagName').value = '';

    // Renderizar tags existentes para seleção
    this.renderExistingTagsSelector();

    // Resetar seleção de cores
    const colorOptions = document.querySelectorAll('.color-option-small');
    colorOptions.forEach(o => o.classList.remove('active'));
    colorOptions[0]?.classList.add('active');

    // Esconder form de criar nova tag
    const form = document.getElementById('tagForm');
    const btn = document.getElementById('btnToggleNewTag');
    if (form && btn) {
      form.classList.add('hidden');
      btn.textContent = 'Criar Nova Tag';
    }

    this.tagModal?.classList.add('active');
  }

  closeTagModal() {
    this.tagModal?.classList.remove('active');
  }

  renderExistingTagsSelector() {
    const existingTagsList = document.getElementById('existingTagsList');
    if (!existingTagsList) return;

    existingTagsList.innerHTML = '';

    if (window.tagsManager.tags.length === 0) {
      existingTagsList.innerHTML = `
        <p style="grid-column: 1 / -1; text-align: center; color: var(--color-text-secondary); padding: var(--spacing-lg);">
          Nenhuma tag criada ainda. Crie sua primeira tag abaixo!
        </p>
      `;
      return;
    }

    window.tagsManager.tags.forEach(tag => {
      const isSelected = this.selectedTags.includes(tag.id);

      const tagItem = document.createElement('div');
      tagItem.className = `tag-selector-item tag-${tag.color} ${isSelected ? 'selected' : ''}`;
      tagItem.dataset.tagId = tag.id;

      tagItem.innerHTML = `
        <div class="tag-selector-name">${tag.name}</div>
      `;

      tagItem.addEventListener('click', () => {
        this.toggleTagSelection(tag.id);
      });

      existingTagsList.appendChild(tagItem);
    });
  }

  toggleTagSelection(tagId) {
    const index = this.selectedTags.indexOf(tagId);

    if (index > -1) {
      // Remover tag
      this.selectedTags.splice(index, 1);
    } else {
      // Adicionar tag
      this.selectedTags.push(tagId);
    }

    // Re-renderizar seletor e lista de tags selecionadas
    this.renderExistingTagsSelector();
    this.renderAvailableTags();
  }

  async handleTagSubmit(e) {
    e.preventDefault();

    const tagName = document.getElementById('tagName').value.trim();

    if (!tagName) {
      alert('Por favor, digite um nome para a tag');
      return;
    }

    // Verificar se já existe
    const existing = window.tagsManager.getTagByName(tagName);
    if (existing) {
      // Se já existe, adicionar à tarefa atual
      if (!this.selectedTags.includes(existing.id)) {
        this.selectedTags.push(existing.id);
        this.renderAvailableTags();
      }

      // Limpar form e esconder
      document.getElementById('tagName').value = '';
      const form = document.getElementById('tagForm');
      const btn = document.getElementById('btnToggleNewTag');
      if (form && btn) {
        form.classList.add('hidden');
        btn.textContent = 'Criar Nova Tag';
      }

      // Re-renderizar o seletor
      this.renderExistingTagsSelector();
      return;
    }

    // Criar nova tag
    const newTag = await window.tagsManager.createTag(tagName, this.selectedColor);
    if (newTag) {
      this.selectedTags.push(newTag.id);
      this.renderAvailableTags();

      // Limpar form e esconder
      document.getElementById('tagName').value = '';
      const form = document.getElementById('tagForm');
      const btn = document.getElementById('btnToggleNewTag');
      if (form && btn) {
        form.classList.add('hidden');
        btn.textContent = 'Criar Nova Tag';
      }

      // Re-renderizar o seletor para mostrar a nova tag
      this.renderExistingTagsSelector();
    }
  }

  // ==========================================
  // ANEXOS
  // ==========================================

  async handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    for (const file of files) {
      const validation = window.attachmentsManager.validateFile(file);
      if (!validation.valid) {
        alert(validation.error + `: ${file.name}`);
        continue;
      }

      // Adicionar à lista de arquivos pendentes (serão enviados ao salvar a tarefa)
      this.pendingFiles.push(file);
    }

    // Limpar input
    e.target.value = '';

    // Renderizar preview dos arquivos
    this.renderPendingAttachments();
  }

  renderPendingAttachments() {
    const attachmentsList = document.getElementById('attachmentsList');
    if (!attachmentsList) return;

    // Limpar lista
    attachmentsList.innerHTML = '';

    // Renderizar arquivos pendentes
    this.pendingFiles.forEach((file, index) => {
      const attachmentEl = this.createAttachmentElement({
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        pending: true,
        index: index
      });
      attachmentsList.appendChild(attachmentEl);
    });

    // Renderizar anexos existentes (se editando tarefa)
    this.currentAttachments.forEach(attachment => {
      const attachmentEl = this.createAttachmentElement(attachment);
      attachmentsList.appendChild(attachmentEl);
    });
  }

  createAttachmentElement(attachment) {
    const div = document.createElement('div');
    div.className = 'attachment-item';

    const icon = document.createElement('div');
    icon.className = 'attachment-icon';
    icon.innerHTML = window.attachmentsManager.getFileIcon(attachment.file_type);

    const info = document.createElement('div');
    info.className = 'attachment-info';

    const name = document.createElement('div');
    name.className = 'attachment-name';
    name.textContent = attachment.file_name;

    const size = document.createElement('div');
    size.className = 'attachment-size';
    size.textContent = window.attachmentsManager.formatFileSize(attachment.file_size);

    info.appendChild(name);
    info.appendChild(size);

    // Se for imagem e não for pendente, permitir visualização ao clicar
    if (!attachment.pending && attachment.file_type.startsWith('image/')) {
      div.style.cursor = 'pointer';
      div.addEventListener('click', (e) => {
        // Não abrir se clicou em um botão de ação
        if (e.target.closest('.btn-attachment-action')) return;
        this.openImageModal(attachment);
      });
    }

    const actions = document.createElement('div');
    actions.className = 'attachment-actions';

    // Botão de download (somente para anexos já salvos)
    if (!attachment.pending) {
      const downloadBtn = document.createElement('button');
      downloadBtn.className = 'btn-attachment-action';
      downloadBtn.type = 'button';
      downloadBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      `;
      downloadBtn.addEventListener('click', () => this.downloadAttachment(attachment));
      actions.appendChild(downloadBtn);
    }

    // Botão de deletar
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-attachment-action delete';
    deleteBtn.type = 'button';
    deleteBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      </svg>
    `;
    deleteBtn.addEventListener('click', () => {
      if (attachment.pending) {
        this.removePendingFile(attachment.index);
      } else {
        this.deleteAttachment(attachment);
      }
    });
    actions.appendChild(deleteBtn);

    div.appendChild(icon);
    div.appendChild(info);
    div.appendChild(actions);

    return div;
  }

  removePendingFile(index) {
    this.pendingFiles.splice(index, 1);
    this.renderPendingAttachments();
  }

  async downloadAttachment(attachment) {
    try {
      console.log('Iniciando download:', attachment.file_name);

      // Usar o método download do Supabase
      const { data, error } = await window.supabaseClient.downloadAttachment(attachment.file_path);

      if (error) {
        console.error('Erro ao baixar:', error);
        alert('Erro ao baixar anexo');
        return;
      }

      if (data) {
        console.log('Download concluído, criando blob');

        // Criar URL do blob e forçar download
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.file_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Limpar URL do blob
        setTimeout(() => URL.revokeObjectURL(url), 100);

        console.log('Download iniciado com sucesso');
      } else {
        alert('Erro ao baixar anexo: arquivo não encontrado');
      }
    } catch (error) {
      console.error('Erro no download:', error);
      alert('Erro ao baixar anexo');
    }
  }

  async deleteAttachment(attachment) {
    if (!confirm(`Deseja deletar o anexo "${attachment.file_name}"?`)) {
      return;
    }

    const success = await window.attachmentsManager.deleteAttachment(attachment);
    if (success) {
      this.currentAttachments = this.currentAttachments.filter(a => a.id !== attachment.id);
      this.renderPendingAttachments();
    } else {
      alert('Erro ao deletar anexo');
    }
  }

  async loadAttachments(taskId) {
    this.currentAttachments = await window.attachmentsManager.getTaskAttachments(taskId);
    this.renderPendingAttachments();
  }

  // ==========================================
  // IMAGE MODAL
  // ==========================================

  async openImageModal(attachment) {
    this.currentImageAttachment = attachment;

    const imageTitle = document.getElementById('imageModalTitle');
    const imagePreview = document.getElementById('imagePreview');

    if (imageTitle) {
      imageTitle.textContent = attachment.file_name;
    }

    if (imagePreview) {
      imagePreview.src = '';
      imagePreview.alt = 'Carregando...';

      // Obter URL da imagem
      const url = await window.attachmentsManager.getAttachmentUrl(attachment);
      if (url) {
        imagePreview.src = url;
        imagePreview.alt = attachment.file_name;
      } else {
        alert('Erro ao carregar imagem');
        return;
      }
    }

    this.imageModal?.classList.add('active');
  }

  closeImageModal() {
    this.imageModal?.classList.remove('active');
    this.currentImageAttachment = null;

    const imagePreview = document.getElementById('imagePreview');
    if (imagePreview) {
      imagePreview.src = '';
    }
  }

  // ===== RECORRÊNCIA =====

  openRecurrenceModal() {
    console.log('🔄 openRecurrenceModal chamado!');
    const modal = document.getElementById('recurrenceModal');
    console.log('🔄 Modal encontrado:', modal);
    if (!modal) {
      console.error('❌ Modal de recorrência não encontrado!');
      return;
    }

    // Se já existe recorrência na tarefa sendo editada, preencher os campos
    if (this.editingTaskId) {
      const task = window.tasksManager.getTaskById(this.editingTaskId);
      if (task && task.recurrence && task.recurrence.enabled) {
        this.loadRecurrenceData(task.recurrence);
        document.getElementById('btnRemoveRecurrence').style.display = 'inline-flex';
      } else {
        this.resetRecurrenceForm();
        document.getElementById('btnRemoveRecurrence').style.display = 'none';
      }
    } else {
      this.resetRecurrenceForm();
      document.getElementById('btnRemoveRecurrence').style.display = 'none';
    }

    modal.classList.add('active');
  }

  closeRecurrenceModal() {
    const modal = document.getElementById('recurrenceModal');
    modal?.classList.remove('active');
  }

  resetRecurrenceForm() {
    document.getElementById('recurrenceType').value = '';
    document.getElementById('recurrenceInterval').value = '1';
    document.getElementById('workdayNumber').value = '1';
    document.getElementById('recurrenceEndType').value = 'never';
    document.getElementById('recurrenceEndDate').value = '';
    document.getElementById('recurrenceEndCount').value = '10';

    // Desmarcar todos os dias da semana
    const weekdayCheckboxes = document.querySelectorAll('.weekday-option input[type="checkbox"]');
    weekdayCheckboxes.forEach(cb => cb.checked = false);

    // Ocultar todos os grupos opcionais
    document.getElementById('intervalGroup').style.display = 'none';
    document.getElementById('workdayGroup').style.display = 'none';
    document.getElementById('weekdaysGroup').style.display = 'none';
    document.getElementById('endDateGroup').style.display = 'none';
    document.getElementById('endCountGroup').style.display = 'none';
  }

  loadRecurrenceData(recurrence) {
    document.getElementById('recurrenceType').value = recurrence.type;
    this.handleRecurrenceTypeChange(recurrence.type);

    if (recurrence.interval) {
      document.getElementById('recurrenceInterval').value = recurrence.interval;
    }

    if (recurrence.workday) {
      document.getElementById('workdayNumber').value = recurrence.workday;
    }

    if (recurrence.weekdays && recurrence.weekdays.length > 0) {
      const weekdayCheckboxes = document.querySelectorAll('.weekday-option input[type="checkbox"]');
      weekdayCheckboxes.forEach(cb => {
        cb.checked = recurrence.weekdays.includes(parseInt(cb.value));
      });
    }

    // Tipo de término
    if (recurrence.endDate) {
      document.getElementById('recurrenceEndType').value = 'date';
      document.getElementById('recurrenceEndDate').value = recurrence.endDate;
      this.handleRecurrenceEndTypeChange('date');
    } else if (recurrence.endCount) {
      document.getElementById('recurrenceEndType').value = 'count';
      document.getElementById('recurrenceEndCount').value = recurrence.endCount;
      this.handleRecurrenceEndTypeChange('count');
    } else {
      document.getElementById('recurrenceEndType').value = 'never';
      this.handleRecurrenceEndTypeChange('never');
    }
  }

  handleRecurrenceTypeChange(type) {
    const intervalGroup = document.getElementById('intervalGroup');
    const workdayGroup = document.getElementById('workdayGroup');
    const weekdaysGroup = document.getElementById('weekdaysGroup');
    const intervalLabel = document.getElementById('intervalLabel');

    // Ocultar todos primeiro
    intervalGroup.style.display = 'none';
    workdayGroup.style.display = 'none';
    weekdaysGroup.style.display = 'none';

    switch (type) {
      case 'daily':
        intervalGroup.style.display = 'block';
        intervalLabel.textContent = 'dia(s)';
        break;
      case 'weekly':
        intervalGroup.style.display = 'block';
        intervalLabel.textContent = 'semana(s)';
        break;
      case 'monthly-date':
        intervalGroup.style.display = 'block';
        intervalLabel.textContent = 'mês(es)';
        break;
      case 'monthly-weekday':
        intervalGroup.style.display = 'block';
        intervalLabel.textContent = 'mês(es)';
        break;
      case 'monthly-workday':
        workdayGroup.style.display = 'block';
        break;
      case 'yearly':
        intervalGroup.style.display = 'block';
        intervalLabel.textContent = 'ano(s)';
        break;
      case 'custom-weekdays':
        weekdaysGroup.style.display = 'block';
        break;
    }
  }

  handleRecurrenceEndTypeChange(type) {
    const endDateGroup = document.getElementById('endDateGroup');
    const endCountGroup = document.getElementById('endCountGroup');

    endDateGroup.style.display = 'none';
    endCountGroup.style.display = 'none';

    if (type === 'date') {
      endDateGroup.style.display = 'block';
    } else if (type === 'count') {
      endCountGroup.style.display = 'block';
    }
  }

  saveRecurrence() {
    const type = document.getElementById('recurrenceType').value;

    if (!type) {
      alert('Selecione um tipo de recorrência');
      return;
    }

    const recurrence = {
      enabled: true,
      type: type
    };

    // Intervalo (para tipos que usam)
    if (['daily', 'weekly', 'monthly-date', 'monthly-weekday', 'yearly'].includes(type)) {
      recurrence.interval = parseInt(document.getElementById('recurrenceInterval').value) || 1;
    }

    // Dia útil (para monthly-workday)
    if (type === 'monthly-workday') {
      recurrence.workday = parseInt(document.getElementById('workdayNumber').value);
      if (!recurrence.workday || recurrence.workday < 1) {
        alert('Informe um número válido para o dia útil');
        return;
      }
    }

    // Dias da semana (para custom-weekdays)
    if (type === 'custom-weekdays') {
      const selectedWeekdays = [];
      const weekdayCheckboxes = document.querySelectorAll('.weekday-option input[type="checkbox"]:checked');
      weekdayCheckboxes.forEach(cb => {
        selectedWeekdays.push(parseInt(cb.value));
      });

      if (selectedWeekdays.length === 0) {
        alert('Selecione pelo menos um dia da semana');
        return;
      }

      recurrence.weekdays = selectedWeekdays;
    }

    // Tipo de término
    const endType = document.getElementById('recurrenceEndType').value;
    if (endType === 'date') {
      const endDate = document.getElementById('recurrenceEndDate').value;
      if (!endDate) {
        alert('Informe a data de término');
        return;
      }
      recurrence.endDate = endDate;
    } else if (endType === 'count') {
      const endCount = parseInt(document.getElementById('recurrenceEndCount').value);
      if (!endCount || endCount < 1) {
        alert('Informe um número válido de ocorrências');
        return;
      }
      recurrence.endCount = endCount;
      recurrence.currentCount = 0;
    }

    // Salvar temporariamente (será salvo com a tarefa)
    this.currentRecurrence = recurrence;

    // Atualizar descrição no formulário
    this.updateRecurrenceDescription(recurrence);

    // Fechar modal
    this.closeRecurrenceModal();
  }

  removeRecurrence() {
    if (confirm('Deseja remover a recorrência desta tarefa?')) {
      this.currentRecurrence = null;

      // Limpar descrição
      const descElement = document.getElementById('recurrenceDescription');
      const btnText = document.getElementById('recurrenceButtonText');
      if (descElement) {
        descElement.classList.add('hidden');
        descElement.textContent = '';
      }
      if (btnText) {
        btnText.textContent = 'Adicionar Recorrência';
      }

      this.closeRecurrenceModal();
    }
  }

  updateRecurrenceDescription(recurrence) {
    const descElement = document.getElementById('recurrenceDescription');
    const btnText = document.getElementById('recurrenceButtonText');

    if (!descElement || !btnText) return;

    let description = '';

    switch (recurrence.type) {
      case 'daily':
        description = recurrence.interval === 1
          ? 'Todos os dias'
          : `A cada ${recurrence.interval} dias`;
        break;
      case 'weekly':
        description = recurrence.interval === 1
          ? 'Toda semana'
          : `A cada ${recurrence.interval} semanas`;
        break;
      case 'monthly-date':
        description = recurrence.interval === 1
          ? 'Todo mês (mesma data)'
          : `A cada ${recurrence.interval} meses (mesma data)`;
        break;
      case 'monthly-weekday':
        description = recurrence.interval === 1
          ? 'Todo mês (mesmo dia da semana)'
          : `A cada ${recurrence.interval} meses (mesmo dia da semana)`;
        break;
      case 'monthly-workday':
        description = `${recurrence.workday}º dia útil do mês`;
        break;
      case 'yearly':
        description = recurrence.interval === 1
          ? 'Todo ano'
          : `A cada ${recurrence.interval} anos`;
        break;
      case 'custom-weekdays':
        const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const selectedDays = recurrence.weekdays.map(d => weekdayNames[d]).join(', ');
        description = `Toda(s) ${selectedDays}`;
        break;
    }

    // Adicionar informação de término
    if (recurrence.endDate) {
      const endDate = new Date(recurrence.endDate + 'T00:00:00');
      description += ` até ${endDate.toLocaleDateString('pt-BR')}`;
    } else if (recurrence.endCount) {
      description += ` (${recurrence.endCount} vezes)`;
    }

    descElement.textContent = description;
    descElement.classList.remove('hidden');
    btnText.textContent = 'Editar Recorrência';
  }
}

// Exportar instância global
window.uiManager = new UIManager();
