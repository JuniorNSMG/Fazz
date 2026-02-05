// ==========================================
// FAZZ - Authentication Module
// ==========================================

class AuthManager {
  constructor() {
    this.isGuest = false;
    this.authModal = null;
    this.loginForm = null;
    this.registerForm = null;
  }

  init() {
    this.authModal = document.getElementById('authModal');
    this.loginForm = document.getElementById('loginForm');
    this.registerForm = document.getElementById('registerForm');

    this.setupEventListeners();
    this.checkExistingSession();
  }

  setupEventListeners() {
    // Tabs de Login/Registro
    const authTabs = document.querySelectorAll('.auth-tab');
    authTabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchAuthTab(tab.dataset.tab));
    });

    // Form de Login
    this.loginForm?.addEventListener('submit', (e) => this.handleLogin(e));

    // Form de Registro
    this.registerForm?.addEventListener('submit', (e) => this.handleRegister(e));

    // Modo Convidado
    const guestButtons = document.querySelectorAll('#btnGuestMode, #btnGuestMode2');
    guestButtons.forEach(btn => {
      btn.addEventListener('click', () => this.enterGuestMode());
    });
  }

  switchAuthTab(tab) {
    const authTabs = document.querySelectorAll('.auth-tab');
    authTabs.forEach(t => t.classList.remove('active'));

    const activeTab = document.querySelector(`[data-tab="${tab}"]`);
    activeTab?.classList.add('active');

    if (tab === 'login') {
      this.loginForm.classList.remove('hidden');
      this.registerForm.classList.add('hidden');
    } else {
      this.loginForm.classList.add('hidden');
      this.registerForm.classList.remove('hidden');
    }
  }

  async handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      this.showError('Por favor, preencha todos os campos');
      return;
    }

    // Se Supabase não estiver configurado, usar modo guest
    if (!window.supabaseClient.initialized) {
      this.showError('Supabase não configurado. Use o modo convidado.');
      return;
    }

    const { data, error } = await window.supabaseClient.login(email, password);

    if (error) {
      this.showError(error.message || 'Erro ao fazer login');
      return;
    }

    this.closeAuthModal();
    await window.app.loadTasks();
  }

  async handleRegister(e) {
    e.preventDefault();

    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerPasswordConfirm').value;

    if (!email || !password || !confirmPassword) {
      this.showError('Por favor, preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      this.showError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      this.showError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (!window.supabaseClient.initialized) {
      this.showError('Supabase não configurado. Use o modo convidado.');
      return;
    }

    const { data, error } = await window.supabaseClient.register(email, password);

    if (error) {
      this.showError(error.message || 'Erro ao criar conta');
      return;
    }

    this.showSuccess('Conta criada! Verifique seu e-mail.');
    this.switchAuthTab('login');
  }

  enterGuestMode() {
    this.isGuest = true;
    localStorage.setItem(CONFIG.storage.USER_KEY, JSON.stringify({ guest: true }));
    this.closeAuthModal();
    window.app.loadTasks();
  }

  checkExistingSession() {
    // Verificar se tem usuário no localStorage
    const storedUser = localStorage.getItem(CONFIG.storage.USER_KEY);

    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.guest) {
        this.isGuest = true;
        this.closeAuthModal();
        return;
      }
    }

    // Verificar se tem sessão do Supabase
    if (window.supabaseClient.isAuthenticated()) {
      this.closeAuthModal();
      return;
    }

    // Se não tem nada, mostrar modal de auth
    this.showAuthModal();
  }

  showAuthModal() {
    this.authModal?.classList.add('active');
  }

  closeAuthModal() {
    this.authModal?.classList.remove('active');
  }

  showError(message) {
    alert(message); // Substituir por toast notification depois
  }

  showSuccess(message) {
    alert(message); // Substituir por toast notification depois
  }

  async logout() {
    if (confirm('Deseja realmente sair?')) {
      await window.supabaseClient.logout();
      localStorage.removeItem(CONFIG.storage.USER_KEY);
      localStorage.removeItem(CONFIG.storage.TASKS_KEY);
      this.isGuest = false;
      window.location.reload();
    }
  }
}

// Exportar instância global
window.authManager = new AuthManager();
