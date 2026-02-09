# 🔧 Setup do Proxy CORS

## Problema

O Fazz roda em HTTPS (GitHub Pages) mas o backend está em HTTP. Navegadores bloqueiam "Mixed Content" por segurança.

## ✅ Solução: Cloudflare Workers (Recomendado)

### Passo 1: Criar conta Cloudflare (Gratuito)

1. Acesse: https://dash.cloudflare.com/sign-up
2. Crie conta gratuita (email + senha)

### Passo 2: Criar Worker

1. Vá em: **Workers & Pages** → **Create Worker**
2. Dê um nome: `fazz-proxy`
3. Clique em **Deploy**

### Passo 3: Adicionar código

1. Clique em **Edit Code**
2. Cole o conteúdo do arquivo `proxy-worker.js`
3. Clique em **Save and Deploy**

### Passo 4: Copiar URL do Worker

Sua URL será algo como: `https://fazz-proxy.SEU-USERNAME.workers.dev`

### Passo 5: Atualizar o Fazz

Edite `src/js/financeiro.js` linha 26:

```javascript
// ANTES:
return `https://corsproxy.io/?${encodeURIComponent(fullUrl)}`;

// DEPOIS (use sua URL do worker):
return `https://fazz-proxy.SEU-USERNAME.workers.dev/?url=${encodeURIComponent(fullUrl)}`;
```

---

## 🚀 Alternativa Rápida: Usar proxy público

Se não quiser configurar Cloudflare, use um dos proxies públicos:

### Opção 1: thingproxy.freeboard.io
```javascript
return `https://thingproxy.freeboard.io/fetch/${fullUrl}`;
```

### Opção 2: api.codetabs.com
```javascript
return `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(fullUrl)}`;
```

### Opção 3: proxy.cors.sh
```javascript
return `https://proxy.cors.sh/${fullUrl}`;
```

---

## 📊 Comparação

| Proxy | Velocidade | Confiabilidade | Limite |
|-------|-----------|----------------|--------|
| **Cloudflare Workers** | ⚡⚡⚡ Muito rápido | ✅ Alta | 100k req/dia (grátis) |
| thingproxy | ⚡ Médio | ⚠️ Instável | Desconhecido |
| codetabs | ⚡ Médio | ⚠️ Instável | Desconhecido |
| cors.sh | ⚡⚡ Rápido | ⚠️ Média | 5 req/sec |

---

## 🔒 Segurança

O proxy Cloudflare criado:
- ✅ Só permite URLs do seu backend (`juniornsmg.ddns.net:5000`)
- ✅ Adiciona headers CORS automaticamente
- ✅ Mantém autenticação e cookies
- ✅ Suporta POST/PUT/DELETE

---

## 💡 Testando

Depois de configurar, teste:

```bash
curl "https://fazz-proxy.SEU-USERNAME.workers.dev/?url=http://juniornsmg.ddns.net:5000/api/detalhes-titulos-pagar-periodo?dataInicio=2026-01-01&dataFim=2026-12-31"
```

Deve retornar os dados do backend!
