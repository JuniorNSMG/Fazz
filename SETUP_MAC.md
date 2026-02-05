# 🍎 Configuração no Mac

Guia rápido para clonar e trabalhar no Fazz localmente no seu Mac.

## 📦 1. Clonar o Repositório

```bash
# Abra o Terminal no Mac
cd ~/Desktop  # ou onde preferir guardar o projeto

# Clone o repositório
git clone https://github.com/JuniorNSMG/Fazz.git
cd Fazz

# Criar branch de trabalho
git checkout -b local-work
```

## 🛠️ 2. Instalar GitHub CLI (gh)

O script automático funciona melhor com o GitHub CLI instalado:

```bash
# Instalar via Homebrew
brew install gh

# Fazer login
gh auth login
# Escolha: GitHub.com > HTTPS > Yes (autenticação) > Login com browser
```

## 🚀 3. Fazer Alterações e Deploy

### Método Rápido (com o script):

```bash
# Fazer suas alterações nos arquivos...

# Depois rodar o script:
./commit-to-main.sh "Descrição das suas mudanças"

# O script vai:
# 1. ✅ Adicionar todos os arquivos alterados
# 2. ✅ Fazer commit com sua mensagem
# 3. ✅ Fazer push para o GitHub
# 4. ✅ Criar Pull Request (se gh CLI estiver instalado)
# 5. ✅ Fazer merge para main (se você confirmar)
```

### Método Manual (sem o script):

```bash
# Ver mudanças
git status

# Adicionar arquivos
git add .

# Commit
git commit -m "Sua mensagem"

# Push
git push

# Criar PR no GitHub
# Ir para: https://github.com/JuniorNSMG/Fazz/pulls
# Clicar em "New Pull Request"
# Selecionar seu branch -> main
# Criar e fazer merge
```

## 📝 Exemplos de Uso

### Exemplo 1: Corrigir um bug
```bash
# Edite os arquivos necessários...
./commit-to-main.sh "Corrigir bug no carregamento de tags"
```

### Exemplo 2: Adicionar nova funcionalidade
```bash
# Edite os arquivos necessários...
./commit-to-main.sh "Adicionar filtro de tarefas por prioridade"
```

### Exemplo 3: Múltiplas mudanças
```bash
# Edite os arquivos necessários...
./commit-to-main.sh "Melhorias no UI: ajustar cores e espaçamentos"
```

## 🔄 Workflow Recomendado

1. **Pull das últimas mudanças**
   ```bash
   git checkout main
   git pull origin main
   git checkout local-work
   git merge main
   ```

2. **Fazer suas alterações**
   - Edite os arquivos no VS Code, Cursor, ou editor preferido
   - Teste localmente abrindo `index.html` no navegador

3. **Commit e Deploy**
   ```bash
   ./commit-to-main.sh "Descrição clara das mudanças"
   ```

4. **Verificar GitHub Pages**
   - Acesse: https://juniornsmg.github.io/Fazz
   - Aguarde 1-2 minutos para atualizar

## 🔧 Comandos Úteis

```bash
# Ver status atual
git status

# Ver histórico de commits
git log --oneline -10

# Ver diferenças antes de commitar
git diff

# Desfazer mudanças não commitadas
git restore .

# Ver branches disponíveis
git branch -a

# Trocar de branch
git checkout nome-do-branch

# Atualizar do remoto
git fetch && git pull
```

## 🆘 Problemas Comuns

### Script não executa
```bash
chmod +x commit-to-main.sh
```

### GitHub CLI não funciona
```bash
# Re-autenticar
gh auth logout
gh auth login
```

### Conflitos de merge
```bash
# Atualizar do main
git checkout main
git pull
git checkout local-work
git merge main
# Resolver conflitos manualmente
git add .
git commit -m "Resolver conflitos"
```

### Erro de permissão no push
```bash
# Verificar se está no branch correto
git branch

# Criar novo branch se necessário
git checkout -b novo-branch-$(date +%s)
./commit-to-main.sh "Suas mudanças"
```

## 📱 Testar Localmente

```bash
# Opção 1: Abrir direto no navegador
open index.html

# Opção 2: Servidor local (recomendado)
# Instalar servidor HTTP simples
npm install -g http-server

# Rodar na pasta do projeto
http-server -p 8080

# Abrir no navegador: http://localhost:8080
```

## 🎯 Próximos Passos

1. Clone o repo no Mac ✅
2. Instale gh CLI ✅
3. Faça suas primeiras alterações ✅
4. Use `./commit-to-main.sh` ✅
5. Veja as mudanças no GitHub Pages 🚀

---

**Dúvidas?** Pergunte ao Claude! 😊
