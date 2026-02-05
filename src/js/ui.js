// ==========================================
// FAZZ - UI Manager
// ==========================================

class UIManager {
  constructor() {
    this.taskModal = null;
    this.taskForm = null;
    this.tagModal = null;
    this.currentEditingId = null;
    this.selectedTags = [];
    this.selectedColor = 'blue';
  }

  init() {
    this.taskModal = document.getElementById('taskModal');
    this.taskForm = document.getElementById('taskForm');
    this.tagModal = document.getElementById('tagModal');

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

    document.getElementById('tagForm')?.addEventListener('submit', (e) => {
      this.handleTagSubmit(e);
    });

    // Color picker
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
      option.addEventListener('click', () => {
        colorOptions.forEach(o => o.classList.remove('active'));
        option.classList.add('active');
        this.selectedColor = option.dataset.color;
      });
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
    const grouped = window.tasksManager.getGroupedTasks();

    // Renderizar Atrasadas
    this.renderOverdueTasks(grouped.overdue);

    // Renderizar Datas (Hoje + Futuras)
    this.renderDateSections(grouped);

    // Renderizar Concluídas
    this.renderCompletedTasks(grouped.completed);
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
    const dateSectionsContainer = document.getElementById('dateSections');
    if (!dateSectionsContainer) return;

    // Remover seção antiga de concluídas (se existir)
    const oldSection = document.getElementById('completedSection');
    if (oldSection) {
      oldSection.remove();
    }

    if (tasks.length === 0) return;

    const section = document.createElement('section');
    section.className = 'task-section completed-section';
    section.id = 'completedSection';

    const header = document.createElement('div');
    header.className = 'section-header';

    const titleElement = document.createElement('h2');
    titleElement.className = 'section-title';
    titleElement.textContent = `Concluídas (${tasks.length})`;

    header.appendChild(titleElement);
    section.appendChild(header);

    const taskList = document.createElement('ul');
    taskList.className = 'task-list';

    tasks.forEach(task => {
      taskList.appendChild(this.createTaskElement(task, false));
    });

    section.appendChild(taskList);
    dateSectionsContainer.appendChild(section);
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

    // Tags (se houver)
    if (task.tags && task.tags.length > 0) {
      const tagsContainer = document.createElement('div');
      tagsContainer.className = 'task-tags';
      task.tags.forEach(tag => {
        tagsContainer.appendChild(this.createTagElement(tag, false));
      });
      content.appendChild(title);
      content.appendChild(tagsContainer);
    } else {
      content.appendChild(title);
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

    content.appendChild(title);
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
    this.currentEditingId = task?.id || null;
    this.selectedTags = [];

    const modalTitle = document.getElementById('modalTitle');
    const taskTitle = document.getElementById('taskTitle');
    const taskDate = document.getElementById('taskDate');
    const taskTime = document.getElementById('taskTime');
    const taskNotes = document.getElementById('taskNotes');

    if (task) {
      modalTitle.textContent = 'Editar Tarefa';
      taskTitle.value = task.title;
      taskDate.value = task.date;
      taskTime.value = task.time || '';
      taskNotes.value = task.notes || '';

      // Carregar tags da tarefa
      const taskTags = await window.tagsManager.getTaskTags(task.id);
      this.selectedTags = taskTags.map(tag => tag.id);
    } else {
      modalTitle.textContent = 'Nova Tarefa';
      taskTitle.value = '';
      taskDate.value = new Date().toISOString().split('T')[0];
      taskTime.value = '';
      taskNotes.value = '';
    }

    this.renderAvailableTags();
    this.taskModal?.classList.add('active');
    taskTitle?.focus();
  }

  // Fechar Modal de Tarefa
  closeTaskModal() {
    this.taskModal?.classList.remove('active');
    this.currentEditingId = null;
    this.taskForm?.reset();
  }

  // Submeter Formulário de Tarefa
  async handleTaskSubmit(e) {
    e.preventDefault();

    const taskData = {
      title: document.getElementById('taskTitle').value.trim(),
      date: document.getElementById('taskDate').value,
      time: document.getElementById('taskTime').value || null,
      notes: document.getElementById('taskNotes').value.trim() || null
    };

    if (!taskData.title || !taskData.date) {
      alert('Por favor, preencha o título e a data');
      return;
    }

    let taskId;
    if (this.currentEditingId) {
      // Atualizar tarefa existente
      await window.tasksManager.updateTask(this.currentEditingId, taskData);
      taskId = this.currentEditingId;
    } else {
      // Criar nova tarefa
      const newTask = await window.tasksManager.createTask(taskData);
      taskId = newTask.id;
    }

    // Salvar tags
    const tagObjects = [];
    if (this.selectedTags.length > 0) {
      for (const tagId of this.selectedTags) {
        await window.tagsManager.addTagToTask(taskId, tagId);
        const tag = window.tagsManager.getTagById(tagId);
        if (tag) tagObjects.push(tag);
      }
    }

    // Atualizar tarefa local com as tags
    const task = window.tasksManager.tasks.find(t => t.id === taskId);
    if (task) {
      task.tags = tagObjects;
      window.tasksManager.saveTasks();
    }

    this.closeTaskModal();
    this.selectedTags = [];
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

  // Navegação
  handleNavigation(view) {
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
        upcoming: 'Em Breve',
        navigate: 'Navegar'
      };
      pageTitle.textContent = titles[view] || 'Fazz';
    }

    // Aqui você pode adicionar lógica para filtrar tarefas por view
    // Por enquanto, apenas renderiza todas
    this.renderTasks();
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

    // Resetar seleção de cores
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(o => o.classList.remove('active'));
    colorOptions[0]?.classList.add('active');

    this.tagModal?.classList.add('active');
    document.getElementById('tagName')?.focus();
  }

  closeTagModal() {
    this.tagModal?.classList.remove('active');
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
      this.closeTagModal();
      return;
    }

    // Criar nova tag
    const newTag = await window.tagsManager.createTag(tagName, this.selectedColor);
    if (newTag) {
      this.selectedTags.push(newTag.id);
      this.renderAvailableTags();
    }

    this.closeTagModal();
  }
}

// Exportar instância global
window.uiManager = new UIManager();
