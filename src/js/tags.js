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

  // Carregar tags com estratégia cache-first
  async loadTags(forceSync = false) {
    const cacheAvailable = window.cacheManager && window.cacheManager.db;

    // ESTRATÉGIA CACHE-FIRST: Carregar cache primeiro
    if (cacheAvailable && !forceSync) {
      try {
        const cachedTags = await window.cacheManager.getAll(window.cacheManager.stores.TAGS);

        if (cachedTags && cachedTags.length > 0) {
          this.tags = cachedTags;
          console.log(`✓ ${cachedTags.length} tags carregadas do cache`);

          // Sincronizar em background
          this.syncInBackground();

          return this.tags;
        }
      } catch (error) {
        console.error('Erro ao carregar tags do cache:', error);
      }
    }

    // Se não tem cache ou forceSync, buscar do servidor
    return await this.loadFromServer();
  }

  // Carregar do servidor e salvar no cache
  async loadFromServer() {
    if (window.supabaseClient.isAuthenticated()) {
      const { data, error } = await window.supabaseClient.fetchTags();
      if (!error && data) {
        this.tags = data;

        // Salvar no cache IndexedDB
        if (window.cacheManager) {
          await window.cacheManager.saveMany(window.cacheManager.stores.TAGS, this.tags);
        }

        // Salvar no localStorage como backup
        this.saveTags();

        console.log(`✓ ${data.length} tags carregadas do servidor`);
        return this.tags;
      }
    }

    // Carregar do localStorage (modo guest ou offline)
    const stored = localStorage.getItem('fazz_tags');
    if (stored) {
      try {
        this.tags = JSON.parse(stored);
        console.log(`✓ ${this.tags.length} tags carregadas do localStorage`);
      } catch (e) {
        console.error('Erro ao carregar tags:', e);
        this.tags = [];
      }
    }

    return this.tags;
  }

  // Sincronizar com servidor em background
  async syncInBackground() {
    await new Promise(resolve => setTimeout(resolve, 300));

    if (window.supabaseClient.isAuthenticated()) {
      const { data, error } = await window.supabaseClient.fetchTags();

      if (!error && data) {
        const hasChanges = data.length !== this.tags.length ||
          data.some(serverTag => !this.tags.find(t => t.id === serverTag.id));

        if (hasChanges) {
          this.tags = data;

          // Atualizar cache
          if (window.cacheManager) {
            await window.cacheManager.saveMany(window.cacheManager.stores.TAGS, this.tags);
          }

          this.saveTags();
          console.log('✓ Tags sincronizadas');
        }
      }
    }
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
      console.log('Criando tag no Supabase:', newTag);
      const { data, error } = await window.supabaseClient.createTag(newTag);
      if (error) {
        console.error('Erro ao criar tag no Supabase:', error);
      }
      if (!error && data) {
        console.log('Tag criada no Supabase:', data);
        this.tags.push(data);
        this.saveTags();
        return data;
      }
    }

    console.log('Criando tag localmente:', newTag);
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
      console.log('Adicionando tag à tarefa no Supabase:', { taskId, tagId });
      const { error } = await window.supabaseClient.addTagToTask(taskId, tagId);
      if (error) {
        console.error('Erro ao adicionar tag à tarefa:', error);
        return false;
      }
      console.log('Tag adicionada à tarefa com sucesso');
    } else {
      console.log('Modo offline: salvando tag localmente');
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
