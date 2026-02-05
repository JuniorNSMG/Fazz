/**
 * Serviço de Cache Local com IndexedDB
 * Gerencia armazenamento offline de tarefas, tags e anexos
 */

class CacheManager {
  constructor() {
    this.dbName = 'FazzDB';
    this.version = 1;
    this.db = null;
    this.stores = {
      TASKS: 'tasks',
      TAGS: 'tags',
      TASK_TAGS: 'task_tags',
      ATTACHMENTS: 'attachments',
      METADATA: 'metadata'
    };
  }

  /**
   * Inicializa o banco de dados IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Erro ao abrir IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB inicializado com sucesso');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Object Store para Tarefas
        if (!db.objectStoreNames.contains(this.stores.TASKS)) {
          const taskStore = db.createObjectStore(this.stores.TASKS, { keyPath: 'id' });
          taskStore.createIndex('user_id', 'user_id', { unique: false });
          taskStore.createIndex('due_date', 'due_date', { unique: false });
          taskStore.createIndex('completed', 'completed', { unique: false });
        }

        // Object Store para Tags
        if (!db.objectStoreNames.contains(this.stores.TAGS)) {
          const tagStore = db.createObjectStore(this.stores.TAGS, { keyPath: 'id' });
          tagStore.createIndex('user_id', 'user_id', { unique: false });
        }

        // Object Store para relação Task-Tags
        if (!db.objectStoreNames.contains(this.stores.TASK_TAGS)) {
          const taskTagStore = db.createObjectStore(this.stores.TASK_TAGS, { keyPath: 'id' });
          taskTagStore.createIndex('task_id', 'task_id', { unique: false });
          taskTagStore.createIndex('tag_id', 'tag_id', { unique: false });
        }

        // Object Store para Anexos
        if (!db.objectStoreNames.contains(this.stores.ATTACHMENTS)) {
          const attachmentStore = db.createObjectStore(this.stores.ATTACHMENTS, { keyPath: 'id' });
          attachmentStore.createIndex('task_id', 'task_id', { unique: false });
        }

        // Object Store para Metadata (timestamps de sincronização)
        if (!db.objectStoreNames.contains(this.stores.METADATA)) {
          db.createObjectStore(this.stores.METADATA, { keyPath: 'key' });
        }

        console.log('Estrutura do IndexedDB criada');
      };
    });
  }

  /**
   * Salva múltiplos itens em um store
   */
  async saveMany(storeName, items) {
    if (!this.db) await this.init();
    if (!items || items.length === 0) return { success: true, count: 0 };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      let count = 0;

      transaction.oncomplete = () => {
        console.log(`${count} itens salvos em ${storeName}`);
        resolve({ success: true, count });
      };

      transaction.onerror = () => {
        console.error(`Erro ao salvar em ${storeName}:`, transaction.error);
        reject(transaction.error);
      };

      items.forEach(item => {
        store.put(item);
        count++;
      });
    });
  }

  /**
   * Salva um único item em um store
   */
  async save(storeName, item) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve({ success: true, id: request.result });
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Busca todos os itens de um store
   */
  async getAll(storeName) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        console.log(`${request.result.length} itens carregados de ${storeName}`);
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Busca um item por ID
   */
  async getById(storeName, id) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Busca itens por um índice
   */
  async getByIndex(storeName, indexName, value) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove um item por ID
   */
  async delete(storeName, id) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve({ success: true });
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Limpa todos os itens de um store
   */
  async clear(storeName) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        console.log(`Store ${storeName} limpo`);
        resolve({ success: true });
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Salva timestamp de última sincronização
   */
  async setLastSync(key, timestamp = Date.now()) {
    return this.save(this.stores.METADATA, { key, timestamp });
  }

  /**
   * Busca timestamp de última sincronização
   */
  async getLastSync(key) {
    const metadata = await this.getById(this.stores.METADATA, key);
    return metadata ? metadata.timestamp : null;
  }

  /**
   * Limpa todo o cache (usado no logout)
   */
  async clearAll() {
    if (!this.db) return;

    const stores = [
      this.stores.TASKS,
      this.stores.TAGS,
      this.stores.TASK_TAGS,
      this.stores.ATTACHMENTS,
      this.stores.METADATA
    ];

    for (const store of stores) {
      await this.clear(store);
    }

    console.log('Cache limpo completamente');
  }

  /**
   * Verifica se há dados em cache
   */
  async hasCache(storeName) {
    const items = await this.getAll(storeName);
    return items.length > 0;
  }
}

// Instância global do CacheManager
window.cacheManager = new CacheManager();
