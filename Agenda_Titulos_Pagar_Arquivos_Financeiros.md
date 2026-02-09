# Documentacao: Agenda - Titulos a Pagar e Arquivos Financeiros

## Visao Geral

A pagina Agenda integra dados de multiplas fontes:
1. **Itens da Agenda** - compromissos manuais (JSON local)
2. **Titulos a Pagar** - lancamentos financeiros do Firebird (TIPO='P')
3. **Arquivos Financeiros** - notinhas/boletos vinculados aos lancamentos
4. **Solicitacoes de Pagamento** - solicitacoes pendentes (JSON local)

Este documento foca nos itens 2 e 3: como importar/listar Titulos a Pagar e como os Arquivos Financeiros se vinculam a eles.

---

## PARTE 1: TITULOS A PAGAR

### 1.1 Tabelas do Firebird Envolvidas

| Tabela | Funcao |
|--------|--------|
| `LANCAMENTO_FINANCEIRO` (LF) | Tabela principal dos lancamentos |
| `FORNECEDOR` (F) | Dados do fornecedor (razao social, CGC) |
| `FABRICA` (FB) | Descricao da fabrica |
| `TIPO_CONTA` (TC) | Descricao da conta |
| `TIPO_SUB_CONTA` (TSC) | Descricao da subconta |
| `SITUACAO_PAGAMENTO` (SP) | Descricao da situacao (Em Aberto, etc.) |

### 1.2 Campos Utilizados da LANCAMENTO_FINANCEIRO

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `NUMERO` | INT | Numero do documento |
| `SEQUENCIA` | INT | Sequencia do lancamento |
| `TIPO` | CHAR | 'P' = Pagar, 'R' = Receber |
| `TIPO_DOCUMENTO` | VARCHAR | Tipo do doc (NF, NFS, etc.) |
| `SERIE` | VARCHAR | Serie do documento |
| `STATUS_SORT` | CHAR | 'A' = confirmado, 'B' = previsto |
| `SITUACAO` | INT | 1 = Em Aberto |
| `DATA_VENCIMENTO` | DATE | Data de vencimento |
| `DATA_EMISSAO` | DATE | Data de emissao |
| `VALOR_TOTAL_NOTA` | DECIMAL | Valor total da nota |
| `VALOR_TOTAL_PREVISTO` | DECIMAL | Valor total previsto |
| `NUMERO_DOC` | VARCHAR | Referencia do documento |
| `CGC_DESTINO` | VARCHAR | CGC do fornecedor (FK -> FORNECEDOR.CGC) |
| `OBS` | VARCHAR | Observacoes |
| `FABRICA` | INT | Codigo da fabrica (FK -> FABRICA.CODIGO) |
| `CODIGO_CONTA` | INT | Codigo da conta (FK -> TIPO_CONTA.CODIGO_INTERNO) |
| `CODIGO_SUB_CONTA` | INT | Codigo da subconta (FK -> TIPO_SUB_CONTA.CODIGO_SUB_CONTA) |

### 1.3 Query SQL Principal - Buscar Titulos a Pagar

```sql
SELECT
    LF.VALOR_TOTAL_PREVISTO,
    LF.NUMERO_DOC,
    F.RAZAO_SOCIAL AS FORNECEDOR,
    LF.DATA_VENCIMENTO,
    LF.STATUS_SORT,
    LF.OBS AS DESCRICAO,
    FB.DESCRICAO AS FABRICA,
    TC.DESCRICAO AS CONTA,
    TSC.DESCRICAO_SUB_CONTA AS SUBCONTA,
    LF.TIPO,
    LF.TIPO_DOCUMENTO,
    LF.NUMERO,
    LF.SERIE,
    LF.SEQUENCIA
FROM LANCAMENTO_FINANCEIRO LF
LEFT JOIN FORNECEDOR F ON LF.CGC_DESTINO = F.CGC
LEFT JOIN FABRICA FB ON LF.FABRICA = FB.CODIGO
LEFT JOIN TIPO_CONTA TC ON LF.CODIGO_CONTA = TC.CODIGO_INTERNO
LEFT JOIN TIPO_SUB_CONTA TSC ON LF.CODIGO_SUB_CONTA = TSC.CODIGO_SUB_CONTA
WHERE CAST(LF.DATA_VENCIMENTO AS DATE) >= '01.01.2026'
  AND CAST(LF.DATA_VENCIMENTO AS DATE) <= '28.02.2026'
  AND LF.TIPO = 'P'
  AND LF.SITUACAO = 1
  AND LF.STATUS_SORT IN ('A', 'B')
  AND (TC.DESCRICAO IS NULL OR UPPER(TC.DESCRICAO) != 'COMPENSACAO')
ORDER BY LF.DATA_VENCIMENTO ASC, LF.STATUS_SORT ASC, LF.VALOR_TOTAL_PREVISTO DESC
```

**Filtros importantes:**
- `LF.TIPO = 'P'` - Somente titulos a PAGAR
- `LF.SITUACAO = 1` - Somente em aberto
- `LF.STATUS_SORT IN ('A', 'B')` - Status A (confirmado) e B (previsto)
- Exclui contas do tipo `COMPENSACAO`
- Datas no Firebird usam formato `DD.MM.YYYY`

### 1.4 Query SQL Complementar - Pesquisa de Lancamentos (para vincular arquivos)

```sql
SELECT
    LF.NUMERO, LF.SEQUENCIA, LF.TIPO, LF.TIPO_DOCUMENTO, LF.SERIE, LF.STATUS_SORT,
    LF.DATA_VENCIMENTO, LF.VALOR_TOTAL_NOTA, LF.VALOR_TOTAL_PREVISTO, F.RAZAO_SOCIAL,
    LF.CGC_DESTINO, LF.DATA_EMISSAO, LF.NUMERO_DOC, SP.DESCRICAO AS SITUACAO_DESC,
    LF.SITUACAO AS SITUACAO_CODIGO, FB.DESCRICAO AS FABRICA_DESC,
    TC.DESCRICAO AS CONTA_DESC, TSC.DESCRICAO_SUB_CONTA AS SUBCONTA_DESC,
    LF.FABRICA AS FABRICA_COD, LF.CODIGO_CONTA AS CONTA_COD, LF.CODIGO_SUB_CONTA AS SUBCONTA_COD
FROM LANCAMENTO_FINANCEIRO LF
LEFT JOIN FORNECEDOR F ON LF.CGC_DESTINO = F.CGC
LEFT JOIN SITUACAO_PAGAMENTO SP ON LF.SITUACAO = SP.CODIGO
LEFT JOIN FABRICA FB ON LF.FABRICA = FB.CODIGO
LEFT JOIN TIPO_CONTA TC ON LF.CODIGO_CONTA = TC.CODIGO_INTERNO
LEFT JOIN TIPO_SUB_CONTA TSC ON LF.CODIGO_SUB_CONTA = TSC.CODIGO_SUB_CONTA
WHERE LF.TIPO = 'P'
  AND (SP.DESCRICAO LIKE '%ABERTO%' OR LF.SITUACAO IS NULL)
  AND (TC.DESCRICAO IS NULL OR UPPER(TC.DESCRICAO) != 'COMPENSACAO')
ORDER BY LF.TIPO ASC, COALESCE(LF.VALOR_TOTAL_NOTA, LF.VALOR_TOTAL_PREVISTO, 0) DESC, LF.DATA_VENCIMENTO ASC
```

### 1.5 Endpoint da API Backend

**Rota:** `GET /api/detalhes-titulos-pagar-periodo`

**Parametros:**
| Parametro | Tipo | Padrao | Descricao |
|-----------|------|--------|-----------|
| `data_inicio` | string (YYYY-MM-DD) | Hoje | Data inicial do periodo |
| `data_fim` | string (YYYY-MM-DD) | Hoje + 30 dias | Data final do periodo |

**Resposta JSON:**
```json
{
  "success": true,
  "detalhes": [
    {
      "valor": 5000.00,
      "numero_doc": "NF-1001",
      "razao_social": "FORNECEDOR XYZ",
      "data_vencimento": "15/02/2026",
      "status_sort": "A",
      "descricao": "Observacao do lancamento",
      "fabrica": "FABRICA 1",
      "conta": "MATERIA PRIMA",
      "subconta": "COURO",
      "tipo": "P",
      "tipo_documento": "NF",
      "numero": "1001",
      "serie": "A",
      "sequencia": "1",
      "is_notinha_consolidada": false,
      "arquivo_vinculado": null
    }
  ],
  "fornecedores_status_b": ["FORNECEDOR ABC", "FORNECEDOR DEF"]
}
```

### 1.6 Filtragem de Titulos Pagos (Cache Local)

Antes de retornar os titulos, o backend verifica um cache local de titulos ja pagos:

```python
titulos_pagos_cache = carregar_titulos_pagos_cache()

for row in resultados:
    detalhe = { ... }  # monta o dicionario
    if titulo_modal_foi_pago(detalhe, titulos_pagos_cache):
        continue  # Pula titulos ja marcados como pagos
    detalhes.append(detalhe)
```

O cache fica em `Informacoes/titulos_pagos.json`.

---

## PARTE 2: ARQUIVOS FINANCEIROS (Notinhas e Boletos)

### 2.1 Tipos de Arquivos

| Tipo | Descricao | Pasta de Armazenamento |
|------|-----------|----------------------|
| `notinha` | Notas fiscais digitalizadas | `Informacoes/notinhas/{FORNECEDOR}/` |
| `boleto` | Boletos bancarios | `Informacoes/boletos/{FORNECEDOR}/` |
| `credito` | Notas de credito | `Informacoes/creditos/{FORNECEDOR}/` |

### 2.2 Estrutura de Pastas

```
Informacoes/
  notinhas/
    FORNECEDOR_ABC/
      metadata.json          <-- Metadados de todos arquivos deste fornecedor
      arquivo1.pdf           <-- Arquivo fisico
      arquivo2.pdf
    FORNECEDOR_XYZ/
      metadata.json
      notinha1.jpg
  boletos/
    FORNECEDOR_ABC/
      metadata.json
      boleto1.pdf
  creditos/
    FORNECEDOR_ABC/
      metadata.json
      credito1.pdf
```

Quando todos os lancamentos vinculados sao pagos, o arquivo e movido para uma subpasta `PAGO/`:
```
Informacoes/
  notinhas/
    FORNECEDOR_ABC/
      PAGO/
        arquivo_antigo.pdf
      metadata.json
```

### 2.3 Estrutura do metadata.json

Cada pasta de fornecedor contem um `metadata.json` com array de objetos:

```json
[
  {
    "id": "uuid-unico-do-arquivo",
    "nome": "nome_original_do_arquivo.pdf",
    "nome_salvo": "nome_renomeado.pdf",
    "caminho": "Informacoes/notinhas/FORNECEDOR_ABC/nome_renomeado.pdf",
    "tipo": "notinha",
    "fornecedor": "FORNECEDOR ABC",
    "fornecedor_cgc": "12345678000100",
    "lancamentos_chaves": [
      "P|NF|1001|A|001|A",
      "P|NF|1001|A|002|A"
    ],
    "lancamentos_ids": [
      "P|NF|1001|A|001|A",
      "P|NF|1001|A|002|A"
    ],
    "lancamentos_detalhes": [
      {
        "numero": 1001,
        "sequencia": 1,
        "tipo": "Pagar",
        "tipo_documento": "NF",
        "serie": "A",
        "status_sort": "A",
        "data_vencimento": "15/02/2026",
        "valor": 5000.00,
        "razao_social": "FORNECEDOR ABC"
      }
    ],
    "valor_total": 10000.00,
    "data_media_ponderada": "2026-02-15",
    "data_upload": "2026-02-09 14:30:00",
    "usuario": "WALLACE",
    "pago": false
  }
]
```

### 2.4 Formato da Chave de Vinculacao (lancamentos_chaves)

A chave que vincula um arquivo financeiro a um lancamento do Firebird tem o formato:

```
TIPO|TIPO_DOCUMENTO|NUMERO|SERIE|SEQUENCIA|STATUS_SORT
```

**Exemplo:** `P|NF|1001|A|001|A`

| Parte | Campo do Firebird | Exemplo |
|-------|------------------|---------|
| `P` | LF.TIPO | P (Pagar) |
| `NF` | LF.TIPO_DOCUMENTO | NF (Nota Fiscal) |
| `1001` | LF.NUMERO | 1001 |
| `A` | LF.SERIE | A |
| `001` | LF.SEQUENCIA | 001 |
| `A` | LF.STATUS_SORT | A |

Esta chave e essencial para:
- Vincular um arquivo a lancamentos especificos
- Verificar se um lancamento ja tem arquivo vinculado
- Verificar se todos os lancamentos de um arquivo foram pagos (para mover para PAGO)

### 2.5 Endpoint de Upload

**Rota:** `POST /api/arquivos-financeiros/upload`

**Parametros (form-data):**
| Campo | Tipo | Descricao |
|-------|------|-----------|
| `arquivo` | File | Arquivo PDF/imagem |
| `tipo` | string | "notinha", "boleto" ou "credito" |
| `lancamentos` | JSON string | Array de chaves no formato `TIPO\|TIPO_DOC\|NUMERO\|SERIE\|SEQ\|STATUS` |

**Processo do Upload:**
1. Recebe arquivo e array de `lancamentos_chaves`
2. Parseia cada chave para extrair os campos do lancamento
3. Consulta o Firebird para obter dados do fornecedor (RAZAO_SOCIAL, CGC)
4. Calcula a **data media ponderada** dos lancamentos (media das datas de vencimento ponderada pelo valor)
5. Cria a pasta `Informacoes/{tipo}/{fornecedor}/` se nao existir
6. Salva o arquivo fisico na pasta
7. Adiciona entrada no `metadata.json` com todos os dados

**Query para obter fornecedor:**
```sql
SELECT DISTINCT F.RAZAO_SOCIAL, F.CGC
FROM LANCAMENTO_FINANCEIRO LF
LEFT JOIN FORNECEDOR F ON LF.CGC_DESTINO = F.CGC
WHERE (LF.TIPO = 'P' AND LF.TIPO_DOCUMENTO = 'NF' AND LF.NUMERO = 1001 AND LF.SERIE = 'A' AND LF.SEQUENCIA = 1 AND LF.STATUS_SORT = 'A')
```

**Query para calcular data media ponderada:**
```sql
SELECT VALOR_TOTAL_NOTA, DATA_VENCIMENTO
FROM LANCAMENTO_FINANCEIRO LF
WHERE (LF.TIPO = 'P' AND LF.TIPO_DOCUMENTO = 'NF' AND LF.NUMERO = 1001 AND LF.SERIE = 'A' AND LF.SEQUENCIA = 1 AND LF.STATUS_SORT = 'A')
```

**Calculo da data media ponderada:**
```python
# Para cada lancamento vinculado:
soma_ponderada = 0
soma_valores = 0
for valor, data_vencimento in resultados:
    dias = (data_vencimento - data_referencia).days
    soma_ponderada += dias * valor
    soma_valores += valor

if soma_valores > 0:
    dias_media = soma_ponderada / soma_valores
    data_media_ponderada = data_referencia + timedelta(days=dias_media)
```

### 2.6 Endpoint de Listagem

**Notinhas:** `GET /api/arquivos-financeiros/notinhas`
**Boletos:** `GET /api/arquivos-financeiros/boletos`

Ambos retornam:
```json
{
  "success": true,
  "notinhas": [
    {
      "id": "uuid",
      "nome": "arquivo.pdf",
      "caminho": "/api/arquivos-financeiros/arquivo/notinhas/FORNECEDOR/arquivo.pdf",
      "fornecedor": "FORNECEDOR ABC",
      "dataUpload": "2026-02-09 14:30:00",
      "valorTotal": 10000.00,
      "dataVencimento": "2026-02-15",
      "tipo": "pdf"
    }
  ]
}
```

**Processo de listagem:**
1. Percorre todas as subpastas em `Informacoes/{tipo}/`
2. Le o `metadata.json` de cada pasta de fornecedor
3. Filtra itens com `tipo == "notinha"` (ou "boleto")
4. Pula itens marcados como `pago: true` ou com caminho contendo `PAGO`
5. Retorna array com dados formatados

### 2.7 Endpoint de Servir Arquivo

**Rota:** `GET /api/arquivos-financeiros/arquivo/<path:filename>`

Serve o arquivo fisico usando `send_file()`. O caminho e relativo a pasta `Informacoes/`.

Exemplo: `/api/arquivos-financeiros/arquivo/notinhas/FORNECEDOR_ABC/nota.pdf`
Arquivo fisico: `Informacoes/notinhas/FORNECEDOR_ABC/nota.pdf`

---

## PARTE 3: INTEGRACAO NA AGENDA

### 3.1 Fluxo Completo de Dados

```
1. Frontend carrega a pagina Agenda
         |
2. Chama carregarTitulosPagar()
         |
3. GET /api/detalhes-titulos-pagar-periodo?data_inicio=X&data_fim=Y
         |
4. Backend consulta LANCAMENTO_FINANCEIRO (TIPO='P', SITUACAO=1)
         |
5. Backend consolida lancamentos com notinhas vinculadas
   (verifica Informacoes/notinhas/*/metadata.json)
         |
6. Retorna JSON com array de detalhes
         |
7. Frontend chama processarTitulosParaAgenda()
   - Converte datas BR para ISO
   - Filtra por periodo
   - Identifica atrasados
   - Monta objetos padronizados
         |
8. Para cada titulo SEM arquivo_vinculado do backend:
   Frontend chama verificarArquivoVinculado() (async)
   POST /api/arquivos-financeiros/verificar-arquivo-lancamento
         |
9. renderizarTabela() exibe os titulos agrupados por data
```

### 3.2 Consolidacao de Notinhas no Backend

Quando multiplos lancamentos estao vinculados a uma mesma notinha, o backend os consolida em uma unica entrada na resposta:

```python
# Percorre Informacoes/notinhas/*/metadata.json
# Para cada notinha nao paga:
#   - Extrai lancamentos_detalhes (lista de lancamentos vinculados)
#   - Mapeia cada lancamento (numero_sequencia) para a notinha
#
# Ao processar os detalhes dos titulos:
#   - Se um titulo esta vinculado a uma notinha, remove-o da lista individual
#   - Adiciona uma entrada consolidada da notinha com:
#     - valor_total da notinha
#     - data_media_ponderada como data de vencimento
#     - descricao: "NOTINHA (X lancamentos)"
#     - fabrica: "NOTINHA"
#     - is_notinha_consolidada: true
#     - arquivo_vinculado: { id, tipo, nome_arquivo, fornecedor_pasta, caminho }
```

**Entrada consolidada de notinha:**
```json
{
  "valor": 15000.00,
  "numero_doc": "nota_fiscal.pdf",
  "razao_social": "FORNECEDOR ABC",
  "data_vencimento": "15/02/2026",
  "status_sort": "A",
  "descricao": "NOTINHA (3 lancamentos)",
  "fabrica": "NOTINHA",
  "conta": "VARIOS",
  "tipo_documento": "NOTINHA",
  "is_notinha_consolidada": true,
  "lancamentos_vinculados": [
    { "numero": 1001, "sequencia": 1, "valor": 5000 },
    { "numero": 1001, "sequencia": 2, "valor": 5000 },
    { "numero": 1001, "sequencia": 3, "valor": 5000 }
  ],
  "arquivo_vinculado": {
    "id": "uuid-da-notinha",
    "tipo": "notinha",
    "nome_arquivo": "nota_fiscal.pdf",
    "fornecedor_pasta": "FORNECEDOR_ABC",
    "caminho": "Informacoes/notinhas/FORNECEDOR_ABC/nota_fiscal.pdf"
  }
}
```

### 3.3 Verificacao de Arquivo Vinculado (Frontend -> Backend)

Quando o titulo nao vem com `arquivo_vinculado` do backend (lancamentos sem notinha consolidada), o frontend verifica assincronamente:

**Rota:** `POST /api/arquivos-financeiros/verificar-arquivo-lancamento`

**Request:**
```json
{
  "fornecedor": "FORNECEDOR ABC",
  "valor": 5000.00,
  "data_vencimento": "15/02/2026",
  "numero_doc": "NF-1001",
  "titulo_key": "P|NF|1001|A|001|A"
}
```

**Processo no backend:**
1. Busca em `Informacoes/notinhas/*/metadata.json`
2. Filtra por fornecedor (case insensitive)
3. Pula arquivos marcados como pagos
4. Verifica se `lancamentos_chaves` contem o `titulo_key` informado
5. Se encontrou, retorna dados do arquivo
6. Se nao encontrou em notinhas, busca em `Informacoes/boletos/*/metadata.json` (mesmo processo)

**Response (com arquivo):**
```json
{
  "success": true,
  "tem_arquivo": true,
  "arquivo": {
    "id": "uuid-do-arquivo",
    "nome": "nota_fiscal.pdf",
    "caminho": "/api/arquivos-financeiros/arquivo/notinhas/FORNECEDOR_ABC/nota.pdf",
    "tipo": "notinha",
    "fornecedor": "FORNECEDOR ABC"
  }
}
```

**Response (sem arquivo):**
```json
{
  "success": true,
  "tem_arquivo": false
}
```

### 3.4 Transformacao dos Dados no Frontend

A funcao `processarTitulosParaAgenda()` transforma cada item da API em um objeto padronizado:

```javascript
{
  id: "hash-unico-gerado",        // gerarIdTitulo(item)
  tipo: "titulo_pagar",            // Tipo fixo para titulos
  data: "2026-02-15",              // ISO format (YYYY-MM-DD)
  descricao: "FORNECEDOR ABC",     // razao_social
  valor: 5000.00,                  // valor do titulo
  status_sort: "A",                // A ou B
  numero_doc: "NF-1001",           // referencia do documento
  fornecedor: "FORNECEDOR ABC",    // razao_social
  vencimento: "15/02/2026",        // formato BR original
  fabrica: "FABRICA 1",            // descricao da fabrica
  conta: "MATERIA PRIMA",          // descricao da conta
  descricao_detalhe: "obs",        // observacoes do lancamento
  status: "pendente",              // status na agenda
  atrasado: false,                 // true se data < hoje
  arquivo_vinculado: null,         // preenchido se tiver arquivo
  // Campos para construir chave unica
  tipo_lancamento: "P",
  tipo_documento: "NF",
  numero: "1001",
  serie: "A",
  sequencia: "1"
}
```

### 3.5 Renderizacao na Agenda

Os titulos sao exibidos na agenda agrupados por data de vencimento:

1. **Linha compactada** (por data): Mostra resumo com badges
   - Badge A (azul): quantidade e valor total dos titulos status A
   - Badge B (cinza): quantidade e valor total dos titulos status B
   - Total geral em destaque
   - Clicavel para expandir/colapsar

2. **Linhas detalhadas** (ao expandir): Uma linha por titulo
   - Icone de clip (📎) se houver arquivo vinculado (clicavel para visualizar)
   - Badge de status (A azul, B cinza)
   - Nome do fornecedor
   - Valor formatado em BRL
   - Botao "Concluido" para marcar como pago

3. **Cores por estado:**
   - **Normal**: fundo claro
   - **Atrasado**: fundo vermelho claro, badge vermelho
   - **Futuro**: fundo cinza, badges cinza
   - **Concluido**: fundo verde claro

### 3.6 Status Sort A vs B

- **Status A**: Titulos confirmados/definitivos. Sempre exibidos.
- **Status B**: Titulos previstos/estimados.
  - Se o fornecedor esta na lista `fornecedores_status_b` (configurada no sistema): exibido normalmente
  - Se o fornecedor NAO esta na lista: exibido apenas para datas futuras ou hoje (oculto se vencido)

### 3.7 Marcacao de Concluido (localStorage)

Titulos marcados como "Concluido" na agenda sao salvos no `localStorage` do navegador:

```javascript
// Marcar como concluido
function marcarTituloConcluido(tituloId) {
    titulosConcluidos.add(tituloId);
    localStorage.setItem('titulosConcluidos', JSON.stringify([...titulosConcluidos]));
    renderizarTabela();
}
```

**Importante:** Esta marcacao e local ao navegador, nao persiste no servidor. Serve como controle visual do operador.

---

## PARTE 4: IMPLEMENTACAO EM OUTRO PROJETO

### 4.1 Requisitos Minimos

Para implementar este sistema em outro projeto, voce precisa:

1. **Banco Firebird** com a tabela `LANCAMENTO_FINANCEIRO` e tabelas relacionadas
2. **Sistema de arquivos** para armazenar notinhas/boletos
3. **Backend** (Flask ou similar) com 3 endpoints principais:
   - Listar titulos a pagar por periodo
   - Upload de arquivos financeiros com vinculacao
   - Verificar arquivo vinculado a um lancamento

### 4.2 Passo a Passo

#### Passo 1: Criar endpoint de listagem de titulos

```python
@app.route('/api/titulos-pagar')
def listar_titulos():
    data_inicio = request.args.get('data_inicio')  # YYYY-MM-DD
    data_fim = request.args.get('data_fim')          # YYYY-MM-DD

    con = get_firebird_connection()
    cursor = con.cursor()

    # Converter datas para formato Firebird (DD.MM.YYYY)
    dt_ini = datetime.strptime(data_inicio, '%Y-%m-%d').strftime('%d.%m.%Y')
    dt_fim = datetime.strptime(data_fim, '%Y-%m-%d').strftime('%d.%m.%Y')

    cursor.execute('''
        SELECT LF.VALOR_TOTAL_PREVISTO, LF.NUMERO_DOC, F.RAZAO_SOCIAL,
               LF.DATA_VENCIMENTO, LF.STATUS_SORT, LF.OBS,
               FB.DESCRICAO, TC.DESCRICAO, TSC.DESCRICAO_SUB_CONTA,
               LF.TIPO, LF.TIPO_DOCUMENTO, LF.NUMERO, LF.SERIE, LF.SEQUENCIA
        FROM LANCAMENTO_FINANCEIRO LF
        LEFT JOIN FORNECEDOR F ON LF.CGC_DESTINO = F.CGC
        LEFT JOIN FABRICA FB ON LF.FABRICA = FB.CODIGO
        LEFT JOIN TIPO_CONTA TC ON LF.CODIGO_CONTA = TC.CODIGO_INTERNO
        LEFT JOIN TIPO_SUB_CONTA TSC ON LF.CODIGO_SUB_CONTA = TSC.CODIGO_SUB_CONTA
        WHERE CAST(LF.DATA_VENCIMENTO AS DATE) >= ?
          AND CAST(LF.DATA_VENCIMENTO AS DATE) <= ?
          AND LF.TIPO = 'P'
          AND LF.SITUACAO = 1
          AND LF.STATUS_SORT IN ('A', 'B')
          AND (TC.DESCRICAO IS NULL OR UPPER(TC.DESCRICAO) != 'COMPENSACAO')
        ORDER BY LF.DATA_VENCIMENTO ASC
    ''', (dt_ini, dt_fim))

    # Processar resultados...
    return jsonify({'success': True, 'detalhes': detalhes})
```

#### Passo 2: Criar sistema de upload de arquivos

```python
@app.route('/api/upload-arquivo-financeiro', methods=['POST'])
def upload_arquivo():
    arquivo = request.files['arquivo']
    tipo = request.form.get('tipo', 'notinha')  # notinha, boleto
    lancamentos = json.loads(request.form.get('lancamentos', '[]'))

    # 1. Parsear chaves dos lancamentos
    # Formato: TIPO|TIPO_DOC|NUMERO|SERIE|SEQUENCIA|STATUS_SORT

    # 2. Consultar Firebird para dados do fornecedor

    # 3. Calcular data media ponderada

    # 4. Salvar arquivo em Informacoes/{tipo}/{fornecedor}/

    # 5. Atualizar metadata.json com lancamentos_chaves

    return jsonify({'success': True})
```

#### Passo 3: Criar endpoint de verificacao de vinculo

```python
@app.route('/api/verificar-arquivo-lancamento', methods=['POST'])
def verificar_arquivo():
    dados = request.get_json()
    fornecedor = dados['fornecedor']
    titulo_key = dados['titulo_key']  # P|NF|1001|A|001|A

    # 1. Percorrer Informacoes/notinhas/*/metadata.json
    # 2. Filtrar por fornecedor
    # 3. Verificar se titulo_key esta em lancamentos_chaves
    # 4. Se nao encontrou, buscar em boletos

    return jsonify({'success': True, 'tem_arquivo': bool, 'arquivo': {...}})
```

#### Passo 4: Frontend - Carregar e exibir

```javascript
// 1. Carregar titulos (periodo: 1 mes atras ate 1 mes a frente)
fetch('/api/titulos-pagar?data_inicio=2026-01-09&data_fim=2026-03-09')
  .then(r => r.json())
  .then(data => {
    // 2. Processar cada titulo
    data.detalhes.forEach(titulo => {
      // 3. Verificar arquivo vinculado (async)
      const tituloKey = `${titulo.tipo}|${titulo.tipo_documento}|${titulo.numero}|${titulo.serie}|${titulo.sequencia}|${titulo.status_sort}`;

      fetch('/api/verificar-arquivo-lancamento', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          fornecedor: titulo.razao_social,
          titulo_key: tituloKey
        })
      })
      .then(r => r.json())
      .then(result => {
        if (result.tem_arquivo) {
          // Exibir icone de clip ao lado do titulo
        }
      });
    });

    // 4. Renderizar na tela agrupado por data
  });
```

---

## PARTE 5: DIAGRAMA DE RELACIONAMENTO

```
LANCAMENTO_FINANCEIRO (Firebird)
    |
    |-- CGC_DESTINO --> FORNECEDOR.CGC (nome do fornecedor)
    |-- FABRICA --> FABRICA.CODIGO (descricao da fabrica)
    |-- CODIGO_CONTA --> TIPO_CONTA.CODIGO_INTERNO (descricao da conta)
    |-- CODIGO_SUB_CONTA --> TIPO_SUB_CONTA.CODIGO_SUB_CONTA (descricao subconta)
    |-- SITUACAO --> SITUACAO_PAGAMENTO.CODIGO (descricao da situacao)
    |
    v
Chave unica: TIPO|TIPO_DOC|NUMERO|SERIE|SEQUENCIA|STATUS_SORT
    |
    v
metadata.json (Sistema de Arquivos)
    |-- lancamentos_chaves: ["P|NF|1001|A|1|A", ...]
    |-- arquivo fisico: Informacoes/{tipo}/{fornecedor}/arquivo.pdf
    |
    v
Agenda (Frontend)
    |-- Titulos agrupados por data de vencimento
    |-- Icone de clip se tem arquivo vinculado
    |-- Badge A/B indicando status
```
