// ==========================================
// FAZZ - Attachments Manager
// ==========================================

class AttachmentsManager {
  constructor() {
    this.attachments = [];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip'
    ];
  }

  // Validar arquivo
  validateFile(file) {
    if (file.size > this.maxFileSize) {
      return {
        valid: false,
        error: `Arquivo muito grande. Tamanho máximo: ${this.formatFileSize(this.maxFileSize)}`
      };
    }

    if (!this.allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
      return {
        valid: false,
        error: 'Tipo de arquivo não permitido'
      };
    }

    return { valid: true };
  }

  // Fazer upload de anexo
  async uploadAttachment(taskId, file) {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      return { data: null, error: validation.error };
    }

    if (window.supabaseClient.isAuthenticated()) {
      console.log('Fazendo upload de anexo:', file.name);
      const { data, error } = await window.supabaseClient.uploadAttachment(taskId, file);
      if (error) {
        console.error('Erro ao fazer upload:', error);
        return { data: null, error };
      }
      console.log('Anexo enviado com sucesso:', data);
      return { data, error: null };
    }

    // Modo offline: salvar metadata localmente
    const localAttachment = {
      id: this.generateId(),
      task_id: taskId,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      created_at: new Date().toISOString(),
      offline: true
    };

    return { data: localAttachment, error: null };
  }

  // Buscar anexos de uma tarefa
  async getTaskAttachments(taskId) {
    if (window.supabaseClient.isAuthenticated()) {
      const { data, error } = await window.supabaseClient.getTaskAttachments(taskId);
      if (!error && data) {
        return data;
      }
    }

    // Modo offline: buscar do localStorage
    const storedTasks = localStorage.getItem(CONFIG.storage.TASKS_KEY);
    if (storedTasks) {
      try {
        const tasks = JSON.parse(storedTasks);
        const task = tasks.find(t => t.id === taskId);
        return task?.attachments || [];
      } catch (e) {
        console.error('Erro ao buscar anexos offline:', e);
      }
    }

    return [];
  }

  // Obter URL do arquivo
  async getAttachmentUrl(attachment) {
    if (!attachment.file_path) return null;

    const { data, error } = await window.supabaseClient.getAttachmentUrl(attachment.file_path);
    if (error) {
      console.error('Erro ao obter URL:', error);
      return null;
    }

    return data;
  }

  // Deletar anexo
  async deleteAttachment(attachment) {
    if (window.supabaseClient.isAuthenticated() && attachment.file_path) {
      const { error } = await window.supabaseClient.deleteAttachment(attachment.id, attachment.file_path);
      if (error) {
        console.error('Erro ao deletar anexo:', error);
        return false;
      }
    }

    return true;
  }

  // Gerar ID único
  generateId() {
    return 'attachment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Formatar tamanho de arquivo
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  // Obter ícone baseado no tipo de arquivo
  getFileIcon(fileType) {
    if (fileType.startsWith('image/')) {
      return `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="M21 15l-5-5L5 21"/>
        </svg>
      `;
    } else if (fileType === 'application/pdf') {
      return `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <path d="M9 15h6"/>
        </svg>
      `;
    } else if (fileType.includes('word') || fileType === 'text/plain') {
      return `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      `;
    } else if (fileType.includes('excel') || fileType.includes('sheet')) {
      return `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <path d="M8 13h8M8 17h8M8 9h2"/>
        </svg>
      `;
    } else {
      return `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      `;
    }
  }
}

// Exportar instância global
window.attachmentsManager = new AttachmentsManager();
