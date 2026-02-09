// ==========================================
// FAZZ - Gerenciador Financeiro
// ==========================================

class FinanceiroManager {
  constructor() {
    this.baseUrl = 'http://juniornsmg.ddns.net:5000';
    this.titulosPagar = [];
    this.lastFetchDate = null;
  }

  // Buscar títulos a pagar do período
  async fetchTitulosPagar(dataInicio, dataFim) {
    try {
      const params = new URLSearchParams({
        dataInicio: this.formatDate(dataInicio),
        dataFim: this.formatDate(dataFim)
      });

      const url = `${this.baseUrl}/api/detalhes-titulos-pagar-periodo?${params}`;
      console.log('💰 Buscando títulos:', url);

      const response = await fetch(url);

      console.log('💰 Resposta HTTP:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Erro ao buscar títulos: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      console.log('💰 Dados recebidos:', data);
      console.log('💰 Quantidade de títulos:', Array.isArray(data) ? data.length : 'não é array');

      // Processar títulos e consolidar notinhas
      this.titulosPagar = await this.processarTitulos(data);
      this.lastFetchDate = new Date();

      console.log('💰 Títulos processados:', this.titulosPagar.length);

      return this.titulosPagar;
    } catch (error) {
      console.error('💰 ❌ ERRO ao buscar títulos a pagar:', error);
      console.error('💰 ❌ Detalhes:', error.message, error.stack);
      return [];
    }
  }

  // Processar títulos e consolidar notinhas
  async processarTitulos(titulos) {
    console.log('💰 Processando títulos:', titulos);

    if (!titulos || titulos.length === 0) {
      console.log('💰 ⚠️ Nenhum título para processar');
      return [];
    }

    console.log('💰 Iniciando processamento de', titulos.length, 'título(s)');

    // Agrupar por chave de vinculação
    const gruposNotinha = new Map();
    const titulosSemNotinha = [];

    for (const titulo of titulos) {
      // Verificar se tem arquivo vinculado
      const temArquivo = await this.verificarArquivoVinculado(titulo);

      if (temArquivo && titulo.CHAVE_VINCULACAO) {
        // Extrair chave base (sem STATUS_SORT)
        const chaveBase = this.extrairChaveBase(titulo.CHAVE_VINCULACAO);

        if (!gruposNotinha.has(chaveBase)) {
          gruposNotinha.set(chaveBase, []);
        }
        gruposNotinha.get(chaveBase).push({ ...titulo, temArquivo: true });
      } else {
        titulosSemNotinha.push({ ...titulo, temArquivo: false });
      }
    }

    // Consolidar notinhas
    const titulosConsolidados = [];

    // Processar grupos de notinha
    for (const [chaveBase, grupo] of gruposNotinha) {
      if (grupo.length === 1) {
        // Apenas um lançamento nesta notinha
        titulosConsolidados.push(this.criarTituloTask(grupo[0]));
      } else {
        // Múltiplos lançamentos - criar entrada consolidada
        titulosConsolidados.push(this.consolidarNotinha(grupo));
      }
    }

    // Adicionar títulos sem notinha
    for (const titulo of titulosSemNotinha) {
      titulosConsolidados.push(this.criarTituloTask(titulo));
    }

    return titulosConsolidados;
  }

  // Verificar se título tem arquivo vinculado
  async verificarArquivoVinculado(titulo) {
    if (!titulo.CHAVE_VINCULACAO) return false;

    try {
      const response = await fetch(
        `${this.baseUrl}/api/arquivos-financeiros/verificar-arquivo-lancamento?chave=${encodeURIComponent(titulo.CHAVE_VINCULACAO)}`
      );

      if (!response.ok) return false;

      const data = await response.json();
      return data.temArquivo || false;
    } catch (error) {
      console.error('Erro ao verificar arquivo:', error);
      return false;
    }
  }

  // Extrair chave base (sem STATUS_SORT)
  extrairChaveBase(chaveCompleta) {
    // Formato: TIPO|TIPO_DOCUMENTO|NUMERO|SERIE|SEQUENCIA|STATUS_SORT
    // Queremos: TIPO|TIPO_DOCUMENTO|NUMERO|SERIE|SEQUENCIA
    const partes = chaveCompleta.split('|');
    return partes.slice(0, 5).join('|');
  }

  // Criar task a partir de título
  criarTituloTask(titulo) {
    return {
      id: `titulo_${titulo.ID_LANCAMENTO}`,
      title: this.getTituloDescricao(titulo),
      type: 'titulo_pagar',
      dueDate: titulo.DATA_VENCIMENTO,
      completed: false,
      financeiro: {
        idLancamento: titulo.ID_LANCAMENTO,
        fornecedor: titulo.FORNECEDOR,
        valor: titulo.VALOR,
        status: titulo.STATUS, // A ou B
        documento: titulo.DOCUMENTO,
        temArquivo: titulo.temArquivo || false,
        chave: titulo.CHAVE_VINCULACAO
      }
    };
  }

  // Consolidar múltiplos lançamentos em uma notinha
  consolidarNotinha(grupo) {
    // Ordenar por status (A antes de B)
    grupo.sort((a, b) => a.STATUS.localeCompare(b.STATUS));

    const valorTotal = grupo.reduce((sum, t) => sum + parseFloat(t.VALOR || 0), 0);
    const temStatusA = grupo.some(t => t.STATUS === 'A');
    const statusConsolidado = temStatusA ? 'A' : 'B';

    // Usar data do primeiro item
    const primeiroTitulo = grupo[0];

    return {
      id: `notinha_${this.extrairChaveBase(primeiroTitulo.CHAVE_VINCULACAO)}`,
      title: `Notinha - ${primeiroTitulo.FORNECEDOR} (${grupo.length} lançamentos)`,
      type: 'titulo_pagar',
      dueDate: primeiroTitulo.DATA_VENCIMENTO,
      completed: false,
      financeiro: {
        consolidado: true,
        lancamentos: grupo.map(t => t.ID_LANCAMENTO),
        fornecedor: primeiroTitulo.FORNECEDOR,
        valor: valorTotal,
        status: statusConsolidado,
        temArquivo: true,
        chave: this.extrairChaveBase(primeiroTitulo.CHAVE_VINCULACAO),
        detalhes: grupo.map(t => ({
          idLancamento: t.ID_LANCAMENTO,
          valor: t.VALOR,
          status: t.STATUS,
          documento: t.DOCUMENTO
        }))
      }
    };
  }

  // Obter descrição do título
  getTituloDescricao(titulo) {
    if (titulo.DOCUMENTO && titulo.DOCUMENTO.trim()) {
      return `${titulo.FORNECEDOR} - ${titulo.DOCUMENTO}`;
    }
    return titulo.FORNECEDOR;
  }

  // Marcar título como concluído (pago)
  async marcarComoConcluido(tituloTask) {
    try {
      if (tituloTask.financeiro.consolidado) {
        // Marcar todos os lançamentos da notinha
        const promises = tituloTask.financeiro.lancamentos.map(idLancamento =>
          this.marcarLancamentoConcluido(idLancamento)
        );
        await Promise.all(promises);
      } else {
        // Marcar apenas um lançamento
        await this.marcarLancamentoConcluido(tituloTask.financeiro.idLancamento);
      }
      return true;
    } catch (error) {
      console.error('Erro ao marcar título como concluído:', error);
      return false;
    }
  }

  // Marcar lançamento individual como concluído
  async marcarLancamentoConcluido(idLancamento) {
    const response = await fetch(`${this.baseUrl}/api/lancamentos/${idLancamento}/concluir`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao marcar lançamento ${idLancamento}: ${response.status}`);
    }

    return response.json();
  }

  // Formatar data para API (YYYY-MM-DD)
  formatDate(date) {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return date.toISOString().split('T')[0];
  }

  // Formatar valor BRL
  formatarValor(valor) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  // Obter URL do arquivo vinculado
  getArquivoUrl(chave) {
    return `${this.baseUrl}/api/arquivos-financeiros/download?chave=${encodeURIComponent(chave)}`;
  }

  // Sincronizar títulos com período
  async sincronizarPeriodo(dataInicio, dataFim) {
    console.log(`Sincronizando títulos: ${this.formatDate(dataInicio)} a ${this.formatDate(dataFim)}`);
    return await this.fetchTitulosPagar(dataInicio, dataFim);
  }
}

// Exportar instância global
window.financeiroManager = new FinanceiroManager();
