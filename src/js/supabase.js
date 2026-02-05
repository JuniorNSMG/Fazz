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
        ...task,
        user_id: this.user.id,
        created_at: new Date().toISOString()
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
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
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
}

// Exportar instância global
window.supabaseClient = new SupabaseClient();
