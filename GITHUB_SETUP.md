# Como Publicar o Fazz no GitHub

Guia passo a passo para enviar seu projeto local para o GitHub.

---

## 📋 Pré-requisitos

1. Git instalado no seu computador
2. Conta no GitHub
3. Repositório criado no GitHub (pode estar vazio)

---

## 🚀 Passo a Passo

### 1. Verificar se o Git está instalado

Abra o terminal e execute:

```bash
git --version
```

Se não tiver instalado:
- **Mac**: `brew install git`
- **Windows**: Baixe de [git-scm.com](https://git-scm.com/)
- **Linux**: `sudo apt-get install git`

### 2. Configurar o Git (primeira vez)

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"
```

### 3. Navegar até a pasta do projeto

```bash
cd /Users/walterjunior/Documents/Fazz
```

### 4. Verificar status do repositório

```bash
git status
```

Se aparecer "not a git repository", execute:

```bash
git init
```

### 5. Adicionar todos os arquivos

```bash
git add .
```

### 6. Fazer o primeiro commit

```bash
git commit -m "Initial commit - Fazz v1.0.0

- Estrutura HTML com tema claro (branco e azul)
- CSS seguindo UI/UX Pro Max guidelines
- JavaScript modular (config, auth, tasks, ui, app)
- PWA completo (manifest, service worker, offline)
- Integração com Supabase
- Modo convidado (uso sem login)
- Documentação completa"
```

### 7. Conectar ao repositório remoto do GitHub

**Importante**: Substitua `SEU_USUARIO` e `NOME_DO_REPO` pelos seus dados:

```bash
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPO.git
```

**Exemplo real:**
```bash
git remote add origin https://github.com/walterjunior/fazz.git
```

### 8. Verificar se foi conectado

```bash
git remote -v
```

Deve aparecer algo como:
```
origin  https://github.com/SEU_USUARIO/NOME_DO_REPO.git (fetch)
origin  https://github.com/SEU_USUARIO/NOME_DO_REPO.git (push)
```

### 9. Renomear branch para main (se necessário)

```bash
git branch -M main
```

### 10. Enviar para o GitHub

```bash
git push -u origin main
```

Se pedir autenticação:
- **Username**: Seu usuário do GitHub
- **Password**: Seu **Personal Access Token** (não é a senha da conta)

#### Como criar Personal Access Token:

1. Acesse [github.com/settings/tokens](https://github.com/settings/tokens)
2. Clique em "Generate new token" > "Generate new token (classic)"
3. Nome: `Fazz Deploy`
4. Marque: `repo` (todas as opções)
5. Clique em "Generate token"
6. **Copie o token** (só aparece uma vez!)
7. Use este token como senha no git push

### 11. Verificar no GitHub

Acesse `https://github.com/SEU_USUARIO/NOME_DO_REPO` e veja se todos os arquivos estão lá!

---

## 🌐 Ativar GitHub Pages

### 1. Acessar configurações

No seu repositório, clique em **Settings** (⚙️)

### 2. Ir para Pages

No menu lateral esquerdo, clique em **Pages**

### 3. Configurar Source

Em **Source**, selecione:
- **Branch**: `main`
- **Folder**: `/ (root)`

Clique em **Save**

### 4. Aguardar deploy

Aguarde 2-5 minutos. A URL aparecerá no topo:

```
Your site is live at https://SEU_USUARIO.github.io/NOME_DO_REPO/
```

---

## 🔧 Ajustar caminhos (se necessário)

Se seu repositório **não** se chamar exatamente "fazz", você precisa ajustar os caminhos:

### Caso 1: Repositório tem nome diferente (ex: "todo-app")

Edite `manifest.json`:

```json
{
  "start_url": "/todo-app/",
  "scope": "/todo-app/"
}
```

Edite `service-worker.js`:

```javascript
const STATIC_CACHE = [
  '/todo-app/',
  '/todo-app/index.html',
  '/todo-app/manifest.json',
  // ... adicione /todo-app/ antes de todos os caminhos
];
```

### Caso 2: Repositório é SEU_USUARIO.github.io

Nesse caso, **não precisa ajustar nada**! Os caminhos já estão corretos.

---

## 📤 Enviar atualizações futuras

Sempre que fizer alterações:

```bash
# 1. Ver o que mudou
git status

# 2. Adicionar as mudanças
git add .

# 3. Fazer commit
git commit -m "Descrição das mudanças"

# 4. Enviar para o GitHub
git push
```

Exemplo:

```bash
git add .
git commit -m "Adiciona modo escuro"
git push
```

---

## ❓ Problemas Comuns

### "Permission denied"

Você precisa autenticar. Use Personal Access Token como senha.

### "Repository not found"

Verifique se a URL do remote está correta:

```bash
git remote -v
```

Para corrigir:

```bash
git remote set-url origin https://github.com/USUARIO_CORRETO/REPO_CORRETO.git
```

### "Updates were rejected"

O repositório remoto tem mudanças que você não tem localmente:

```bash
git pull origin main --rebase
git push
```

### Arquivos muito grandes

GitHub tem limite de 100MB por arquivo. Se tiver arquivos grandes:

```bash
# Adicionar ao .gitignore
echo "nome-do-arquivo-grande.zip" >> .gitignore

# Remover do Git (mas manter no computador)
git rm --cached nome-do-arquivo-grande.zip

# Commit e push
git add .gitignore
git commit -m "Remove arquivo grande"
git push
```

---

## 🎯 Checklist Final

Antes de considerar completo:

- [ ] Código está no GitHub
- [ ] README.md está visível
- [ ] GitHub Pages está ativo
- [ ] Site está acessível pela URL do GitHub Pages
- [ ] PWA funciona (testar instalação)
- [ ] Configurou Supabase (URL e Key)
- [ ] Testou criação de tarefas
- [ ] Testou modo offline

---

## 📞 Recursos

- [GitHub Docs - Pushing](https://docs.github.com/en/get-started/using-git/pushing-commits-to-a-remote-repository)
- [GitHub Docs - Pages](https://docs.github.com/en/pages)
- [GitHub Docs - Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)

---

**Pronto!** Seu projeto Fazz agora está no GitHub e publicado! 🎉
