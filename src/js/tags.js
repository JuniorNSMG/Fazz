// ==========================================
// FAZZ - Tags Manager
// ==========================================

class TagsManager {
  constructor() {
    this.tags = [];
    this.availableColors = [
      'blue', 'green', 'orange', 'purple',
      'pink', 'teal', 'yellow', 'red'
    ];
  }

  // Carregar tags do usuário
  async loadTags() {
    if (window.supabaseClient.isAuthenticated()) {
      const { data, error } = await window.supabaseClient.fetchTags();
      if (!error && data) {
        this.tags = data;
        this.saveTags();
        return this.tags;
      }
    }

    // Carregar do localStorage
    const stored = localStorage.getItem('fazz_tags');
    if (stored) {
      try {
        this.tags = JSON.parse(stored);
      } catch (e) {
        console.error('Erro ao carregar tags:', e);
        this.tags = [];
      }
    }

    return this.tags;
  }

  // Salvar tags localmente
  saveTags() {
    try {
      localStorage.setItem('fazz_tags', JSON.stringify(this.tags));
    } catch (e) {
      console.error('Erro ao salvar tags:', e);
    }
  }

  // Criar nova tag
  async createTag(name, color) {
    const newTag = {
      id: this.generateId(),
      name: name.trim(),
      color: color,
      created_at: new Date().toISOString()
    };

    if (window.supabaseClient.isAuthenticated()) {
      const { data, error } = await window.supabaseClient.createTag(newTag);
      if (!error && data) {
        this.tags.push(data);
        this.saveTags();
        return data;
      }
    }

    this.tags.push(newTag);
    this.saveTags();
    return newTag;
  }

  // Deletar tag
  async deleteTag(id) {
    if (window.supabaseClient.isAuthenticated()) {
      const { error } = await window.supabaseClient.deleteTag(id);
      if (error) {
        console.error('Erro ao deletar tag:', error);
        return false;
      }
    }

    this.tags = this.tags.filter(t => t.id !== id);
    this.saveTags();
    return true;
  }

  // Buscar tag por ID
  getTagById(id) {
    return this.tags.find(t => t.id === id);
  }

  // Buscar tag por nome
  getTagByName(name) {
    return this.tags.find(t => t.name.toLowerCase() === name.toLowerCase());
  }

  // Gerar ID único
  generateId() {
    return 'tag_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Obter cor aleatória disponível
  getRandomColor() {
    return this.availableColors[Math.floor(Math.random() * this.availableColors.length)];
  }

  // Adicionar tag a uma tarefa
  async addTagToTask(taskId, tagId) {
    if (window.supabaseClient.isAuthenticated()) {
      const { error } = await window.supabaseClient.addTagToTask(taskId, tagId);
      if (error) {
        console.error('Erro ao adicionar tag à tarefa:', error);
        return false;
      }
    }
    return true;
  }

  // Remover tag de uma tarefa
  async removeTagFromTask(taskId, tagId) {
    if (window.supabaseClient.isAuthenticated()) {
      const { error } = await window.supabaseClient.removeTagFromTask(taskId, tagId);
      if (error) {
        console.error('Erro ao remover tag da tarefa:', error);
        return false;
      }
    }
    return true;
  }

  // Obter tags de uma tarefa
  async getTaskTags(taskId) {
    if (window.supabaseClient.isAuthenticated()) {
      const { data, error } = await window.supabaseClient.getTaskTags(taskId);
      if (!error && data) {
        return data;
      }
    }
    // Modo offline: tentar buscar do localStorage das tarefas
    const storedTasks = localStorage.getItem(CONFIG.storage.TASKS_KEY);
    if (storedTasks) {
      try {
        const tasks = JSON.parse(storedTasks);
        const task = tasks.find(t => t.id === taskId);
        return task?.tags || [];
      } catch (e) {
        console.error('Erro ao buscar tags offline:', e);
      }
    }
    return [];
  }
}

// Exportar instância global
window.tagsManager = new TagsManager();
