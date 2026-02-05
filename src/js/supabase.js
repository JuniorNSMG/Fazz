// ==========================================
// FAZZ - Supabase Client
// ==========================================

class SupabaseClient {
  constructor() {
    this.client = null;
    this.user = null;
    this.initialized = false;
  }

  // Inicializar Supabase
  async init() {
    if (!CONFIG.supabase.url || !CONFIG.supabase.anonKey) {
      console.warn('⚠️ Supabase não configurado. Usando modo offline.');
      this.initialized = false;
      return false;
    }

    try {
      // Importar Supabase dinamicamente via CDN
      if (!window.supabase) {
        await this.loadSupabaseSDK();
      }

      this.client = window.supabase.createClient(
        CONFIG.supabase.url,
        CONFIG.supabase.anonKey
      );

      // Verificar sessão atual
      const { data: { session } } = await this.client.auth.getSession();
      if (session) {
        this.user = session.user;
      }

      this.initialized = true;
      console.log('✓ Supabase inicializado');
      return true;
    } catch (error) {
      console.error('✗ Erro ao inicializar Supabase:', error);
      this.initialized = false;
      return false;
    }
  }

  // Carregar SDK do Supabase via CDN
  async loadSupabaseSDK() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Login
  async login(email, password) {
    if (!this.initialized) return { error: 'Supabase não inicializado' };

    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      this.user = data.user;
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return { data: null, error };
    }
  }

  // Registro
  async register(email, password) {
    if (!this.initialized) return { error: 'Supabase não inicializado' };

    try {
      const { data, error } = await this.client.auth.signUp({
        email,
        password
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Erro ao registrar:', error);
      return { data: null, error };
    }
  }

  // Logout
  async logout() {
    if (!this.initialized) return;

    try {
      await this.client.auth.signOut();
      this.user = null;
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }

  // Verificar se está autenticado
  isAuthenticated() {
    return this.user !== null;
  }

  // Obter usuário atual
  getCurrentUser() {
    return this.user;
  }

  // Buscar tarefas do usuário
  async fetchTasks() {
    if (!this.initialized || !this.user) return { data: [], error: null };

    try {
      const { data, error } = await this.client
        .from('tasks')
        .select('*')
        .eq('user_id', this.user.id)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      return { data: data || [], error };
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
      return { data: [], error };
    }
  }

  // Criar tarefa
  async createTask(task) {
    if (!this.initialized || !this.user) return { data: null, error: 'Usuário não autenticado' };

    try {
      const taskData = {
        title: task.title,
        date: task.date,
        time: task.time || null,
        notes: task.notes || null,
        completed: task.completed || false,
        user_id: this.user.id
      };

      const { data, error } = await this.client
        .from('tasks')
        .insert([taskData])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      return { data: null, error };
    }
  }

  // Atualizar tarefa
  async updateTask(id, updates) {
    if (!this.initialized || !this.user) return { data: null, error: 'Usuário não autenticado' };

    try {
      const { data, error } = await this.client
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .eq('user_id', this.user.id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      return { data: null, error };
    }
  }

  // Deletar tarefa
  async deleteTask(id) {
    if (!this.initialized || !this.user) return { error: 'Usuário não autenticado' };

    try {
      const { error } = await this.client
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', this.user.id);

      return { error };
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error);
      return { error };
    }
  }

  // ==========================================
  // TAGS
  // ==========================================

  // Buscar tags do usuário
  async fetchTags() {
    if (!this.initialized || !this.user) return { data: [], error: null };

    try {
      const { data, error } = await this.client
        .from('tags')
        .select('*')
        .eq('user_id', this.user.id)
        .order('name', { ascending: true });

      return { data: data || [], error };
    } catch (error) {
      console.error('Erro ao buscar tags:', error);
      return { data: [], error };
    }
  }

  // Criar tag
  async createTag(tag) {
    if (!this.initialized || !this.user) return { data: null, error: 'Usuário não autenticado' };

    try {
      const tagData = {
        name: tag.name,
        color: tag.color,
        user_id: this.user.id
      };

      const { data, error } = await this.client
        .from('tags')
        .insert([tagData])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Erro ao criar tag:', error);
      return { data: null, error };
    }
  }

  // Deletar tag
  async deleteTag(id) {
    if (!this.initialized || !this.user) return { error: 'Usuário não autenticado' };

    try {
      const { error } = await this.client
        .from('tags')
        .delete()
        .eq('id', id)
        .eq('user_id', this.user.id);

      return { error };
    } catch (error) {
      console.error('Erro ao deletar tag:', error);
      return { error };
    }
  }

  // Adicionar tag a tarefa
  async addTagToTask(taskId, tagId) {
    if (!this.initialized || !this.user) return { error: 'Usuário não autenticado' };

    try {
      const { error } = await this.client
        .from('task_tags')
        .insert([{ task_id: taskId, tag_id: tagId }]);

      return { error };
    } catch (error) {
      console.error('Erro ao adicionar tag à tarefa:', error);
      return { error };
    }
  }

  // Remover tag de tarefa
  async removeTagFromTask(taskId, tagId) {
    if (!this.initialized || !this.user) return { error: 'Usuário não autenticado' };

    try {
      const { error } = await this.client
        .from('task_tags')
        .delete()
        .eq('task_id', taskId)
        .eq('tag_id', tagId);

      return { error };
    } catch (error) {
      console.error('Erro ao remover tag da tarefa:', error);
      return { error };
    }
  }

  // Obter tags de uma tarefa
  async getTaskTags(taskId) {
    if (!this.initialized || !this.user) return { data: [], error: null };

    try {
      const { data, error } = await this.client
        .from('task_tags')
        .select('tag_id, tags(*)')
        .eq('task_id', taskId);

      return { data: data?.map(item => item.tags) || [], error };
    } catch (error) {
      console.error('Erro ao buscar tags da tarefa:', error);
      return { data: [], error };
    }
  }

  // ==========================================
  // ANEXOS (Attachments)
  // ==========================================

  // Upload de arquivo
  async uploadAttachment(taskId, file) {
    if (!this.initialized || !this.user) return { data: null, error: 'Usuário não autenticado' };

    try {
      // Gerar caminho único: user_id/task_id/timestamp_filename
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `${this.user.id}/${taskId}/${fileName}`;

      // Upload para Storage
      const { data: uploadData, error: uploadError } = await this.client.storage
        .from('task-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Salvar metadata no banco
      const attachmentData = {
        user_id: this.user.id,
        task_id: taskId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type
      };

      const { data, error } = await this.client
        .from('attachments')
        .insert([attachmentData])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Erro ao fazer upload de anexo:', error);
      return { data: null, error };
    }
  }

  // Buscar anexos de uma tarefa
  async getTaskAttachments(taskId) {
    if (!this.initialized || !this.user) return { data: [], error: 'Usuário não autenticado' };

    try {
      const { data, error } = await this.client
        .from('attachments')
        .select('*')
        .eq('task_id', taskId)
        .eq('user_id', this.user.id)
        .order('created_at', { ascending: false });

      return { data: data || [], error };
    } catch (error) {
      console.error('Erro ao buscar anexos:', error);
      return { data: [], error };
    }
  }

  // Obter URL pública temporária do arquivo
  async getAttachmentUrl(filePath) {
    if (!this.initialized) return { data: null, error: 'Não inicializado' };

    try {
      const { data, error } = await this.client.storage
        .from('task-attachments')
        .createSignedUrl(filePath, 3600); // URL válida por 1 hora

      return { data: data?.signedUrl, error };
    } catch (error) {
      console.error('Erro ao gerar URL do anexo:', error);
      return { data: null, error };
    }
  }

  // Deletar anexo
  async deleteAttachment(id, filePath) {
    if (!this.initialized || !this.user) return { error: 'Usuário não autenticado' };

    try {
      // Deletar do Storage
      const { error: storageError } = await this.client.storage
        .from('task-attachments')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Deletar do banco
      const { error } = await this.client
        .from('attachments')
        .delete()
        .eq('id', id)
        .eq('user_id', this.user.id);

      return { error };
    } catch (error) {
      console.error('Erro ao deletar anexo:', error);
      return { error };
    }
  }
}

// Exportar instância global
window.supabaseClient = new SupabaseClient();
