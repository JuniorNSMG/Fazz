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
    this.pendingFiles = [];
    this.currentAttachments = [];

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

      // Carregar anexos da tarefa
      await this.loadAttachments(task.id);
    } else {
      modalTitle.textContent = 'Nova Tarefa';
      taskTitle.value = '';
      taskDate.value = window.tasksManager.getTodayString();
      taskTime.value = '';
      taskNotes.value = '';

      // Limpar lista de anexos
      this.renderPendingAttachments();
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

    // Atualizar tarefa local com tags e anexos
    const task = window.tasksManager.tasks.find(t => t.id === taskId);
    if (task) {
      task.tags = tagObjects;
      task.attachments = [...this.currentAttachments, ...uploadedAttachments];
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
}

// Exportar instância global
window.uiManager = new UIManager();
