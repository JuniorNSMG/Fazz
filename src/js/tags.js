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
    console.log(`🏷️ loadTags chamado (forceSync: ${forceSync})`);

    // Verificar se cache está disponível e pronto
    const cacheReady = window.cacheManager && window.cacheManager.isReady();
    console.log(`  Cache status: ${cacheReady ? '✅ Pronto' : '❌ Não disponível'}`);

    // ESTRATÉGIA CACHE-FIRST: Carregar cache primeiro
    if (cacheReady && !forceSync) {
      try {
        console.log('  🔍 Buscando tags no cache...');
        const cachedTags = await window.cacheManager.getAll(window.cacheManager.stores.TAGS);

        if (cachedTags && cachedTags.length > 0) {
          this.tags = cachedTags;
          console.log(`✅ ${cachedTags.length} tags carregadas do cache`);

          // Sincronizar em background
          this.syncInBackground();

          return this.tags;
        } else {
          console.log('  ℹ️ Cache de tags vazio, buscando do servidor...');
        }
      } catch (error) {
        console.error('❌ Erro ao carregar tags do cache:', error);
      }
    } else if (forceSync) {
      console.log('  🔄 Sincronização forçada, indo direto ao servidor');
    }

    // Se não tem cache ou forceSync, buscar do servidor
    return await this.loadFromServer();
  }

  // Carregar do servidor e salvar no cache
  async loadFromServer() {
    if (window.supabaseClient.isAuthenticated()) {
      console.log('☁️ Buscando tags do Supabase...');
      const { data, error } = await window.supabaseClient.fetchTags();

      if (!error && data) {
        console.log(`  📥 Recebidas ${data.length} tags do servidor`);
        this.tags = data;

        // Limpar cache antigo e salvar novo
        if (window.cacheManager && window.cacheManager.isReady()) {
          await window.cacheManager.clear(window.cacheManager.stores.TAGS);
          if (data.length > 0) {
            await window.cacheManager.saveMany(window.cacheManager.stores.TAGS, this.tags);
            console.log('  💾 Tags salvas no cache');
          }
        }

        // Salvar no localStorage como backup
        this.saveTags();

        console.log(`✅ ${data.length} tags carregadas do servidor`);
        return this.tags;
      } else if (error) {
        console.error('❌ Erro ao buscar tags do servidor:', error);
      }
    }

    // Carregar do localStorage (modo guest ou offline)
    const stored = localStorage.getItem('fazz_tags');
    if (stored) {
      try {
        this.tags = JSON.parse(stored);
        console.log(`📦 ${this.tags.length} tags carregadas do localStorage (modo guest/offline)`);
      } catch (e) {
        console.error('❌ Erro ao carregar tags do localStorage:', e);
        this.tags = [];
      }
    } else {
      console.log('ℹ️ Nenhuma tag encontrada localmente');
      this.tags = [];
    }

    return this.tags;
  }

  // Sincronizar com servidor em background
  async syncInBackground() {
    await new Promise(resolve => setTimeout(resolve, 300));

    if (window.supabaseClient.isAuthenticated()) {
      console.log('🔄 Sincronizando tags com servidor...');
      const { data, error } = await window.supabaseClient.fetchTags();

      if (!error && data) {
        console.log(`  📊 Servidor: ${data.length} tags | Local: ${this.tags.length} tags`);

        const hasChanges = data.length !== this.tags.length ||
          data.some(serverTag => !this.tags.find(t => t.id === serverTag.id)) ||
          this.tags.some(localTag => !data.find(t => t.id === localTag.id));

        if (hasChanges) {
          console.log('  ⚠️ Diferenças detectadas, atualizando...');
          this.tags = data;

          // Limpar e atualizar cache completamente
          if (window.cacheManager && window.cacheManager.isReady()) {
            await window.cacheManager.clear(window.cacheManager.stores.TAGS);
            if (data.length > 0) {
              await window.cacheManager.saveMany(window.cacheManager.stores.TAGS, this.tags);
            }
          }

          this.saveTags();

          // Atualizar UI se disponível
          if (window.uiManager && window.uiManager.renderTasks) {
            window.uiManager.renderTasks();
          }

          console.log('✅ Tags sincronizadas com servidor');
        } else {
          console.log('  ✓ Tags já estão sincronizadas');
        }
      } else if (error) {
        console.error('❌ Erro ao sincronizar tags:', error);
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
      console.log('🏷️ Criando tag no Supabase:', newTag);
      const { data, error } = await window.supabaseClient.createTag(newTag);
      if (error) {
        console.error('❌ Erro ao criar tag no Supabase:', error);
        // Mesmo com erro no servidor, salvar localmente
        this.tags.push(newTag);
        this.saveTags();
        if (window.cacheManager && window.cacheManager.isReady()) {
          await window.cacheManager.save(window.cacheManager.stores.TAGS, newTag);
        }
        return newTag;
      }
      if (!error && data) {
        console.log('✅ Tag criada no Supabase:', data);
        this.tags.push(data);
        this.saveTags();

        // Salvar no cache IndexedDB
        if (window.cacheManager && window.cacheManager.isReady()) {
          await window.cacheManager.save(window.cacheManager.stores.TAGS, data);
          console.log('💾 Tag salva no cache');
        }

        return data;
      }
    }

    console.log('🏷️ Criando tag localmente (modo guest/offline):', newTag);
    this.tags.push(newTag);
    this.saveTags();

    // Salvar no cache IndexedDB
    if (window.cacheManager && window.cacheManager.isReady()) {
      await window.cacheManager.save(window.cacheManager.stores.TAGS, newTag);
      console.log('💾 Tag salva no cache');
    }

    return newTag;
  }

  // Deletar tag
  async deleteTag(id) {
    if (window.supabaseClient.isAuthenticated()) {
      const { error } = await window.supabaseClient.deleteTag(id);
      if (error) {
        console.error('❌ Erro ao deletar tag:', error);
        return false;
      }
    }

    this.tags = this.tags.filter(t => t.id !== id);
    this.saveTags();

    // Deletar do cache IndexedDB
    if (window.cacheManager && window.cacheManager.isReady()) {
      await window.cacheManager.delete(window.cacheManager.stores.TAGS, id);
      console.log('💾 Tag removida do cache');
    }

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
