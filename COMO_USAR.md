# 🎯 Como Usar o Fazz (Super Simples!)

## 🖱️ Método 1: Duplo Clique (RECOMENDADO)

### No seu Mac:

1. **Baixar as últimas atualizações**
   ```bash
   cd ~/Desktop/Fazz  # ou onde você clonou
   git pull
   ```

2. **Dar duplo clique no arquivo:**
   ```
   📄 fazz-menu.command
   ```

3. **Usar o menu interativo! 🎉**

   ```
   ╔════════════════════════════════════════╗
   ║           🚀 FAZZ MENU 🚀              ║
   ╚════════════════════════════════════════╝

   📊 Status Atual:
   [suas mudanças aparecerão aqui]

   O que deseja fazer?

   1) 📝 Commit e Deploy
   2) 🔄 Atualizar do GitHub (Pull)
   3) 📜 Ver Histórico de Commits
   4) 🌐 Abrir GitHub Pages no Navegador
   5) 💻 Abrir no VS Code
   6) 🤖 Abrir Claude Code
   7) ⚠️  Restaurar Mudanças (Desfazer)
   8) 🚪 Sair

   Opção:
   ```

---

## 📝 Opção 1: Commit e Deploy

**O que faz:**
- Adiciona todos os arquivos modificados
- Faz commit com sua mensagem
- Push para o GitHub
- Cria Pull Request automaticamente
- Faz merge para o main
- ✨ **GitHub Pages atualiza automaticamente!**

**Como usar:**
1. Escolha opção `1`
2. Digite a mensagem do commit
3. Confirme se quer criar PR e fazer merge (`s` ou `n`)
4. Pronto! 🎉

---

## 🔄 Opção 2: Atualizar do GitHub

**O que faz:**
- Baixa as últimas mudanças do GitHub
- Atualiza seu repositório local

**Quando usar:**
- Antes de começar a trabalhar
- Para pegar mudanças que você fez em outro computador
- Para sincronizar com o GitHub Pages

---

## 📜 Opção 3: Ver Histórico

**O que faz:**
- Mostra os últimos 10 commits
- Com gráfico de branches

**Útil para:**
- Ver o que foi mudado recentemente
- Verificar mensagens de commit

---

## 🌐 Opção 4: Abrir GitHub Pages

**O que faz:**
- Abre o site publicado no navegador
- URL: https://juniornsmg.github.io/Fazz

**Quando usar:**
- Após fazer deploy
- Para testar a versão publicada

---

## 💻 Opção 5: Abrir no VS Code

**O que faz:**
- Abre o projeto inteiro no Visual Studio Code

**Quando usar:**
- Para editar vários arquivos
- Para trabalhar confortavelmente no código

---

## 🤖 Opção 6: Abrir Claude Code

**O que faz:**
- Inicia uma sessão do Claude Code no terminal
- Claude pode ajudar com código, bugs, etc.

**Como usar:**
- Escolha `1` para abrir Claude diretamente
- Escolha `2` para copiar o comando

**Instalação (se não tiver):**
```bash
npm install -g @anthropic-ai/claude-code
```

---

## ⚠️ Opção 7: Restaurar Mudanças

**⚠️ CUIDADO! Esta opção DESCARTA mudanças não commitadas!**

**O que faz:**
- Remove TODAS as modificações não commitadas
- Volta ao estado do último commit

**Quando usar:**
- Quando fez algo errado e quer recomeçar
- Para limpar experimentos que não deram certo

**Segurança:**
- Pede confirmação digitando "SIM"

---

## 🎯 Fluxo de Trabalho Recomendado

### 1️⃣ Começar a trabalhar:
```bash
# Duplo clique em: fazz-menu.command
# Escolha opção: 2 (Atualizar do GitHub)
```

### 2️⃣ Editar arquivos:
```bash
# Duplo clique em: fazz-menu.command
# Escolha opção: 5 (Abrir no VS Code)
# Faça suas alterações...
```

### 3️⃣ Publicar mudanças:
```bash
# Duplo clique em: fazz-menu.command
# Escolha opção: 1 (Commit e Deploy)
# Digite mensagem: "Melhorias no design"
# Confirme PR e merge: s
```

### 4️⃣ Ver resultado:
```bash
# Duplo clique em: fazz-menu.command
# Escolha opção: 4 (Abrir GitHub Pages)
# Aguarde 1-2 minutos para o GitHub Pages atualizar
```

---

## 🚨 Problemas Comuns

### "Arquivo não abre com duplo clique"
```bash
# No Terminal:
cd ~/Desktop/Fazz
chmod +x fazz-menu.command
```

### "GitHub CLI não funciona"
```bash
# Reinstalar e autenticar:
gh auth logout
gh auth login
```

### "Conflitos de merge"
```bash
# No menu, escolha opção 7 (Restaurar)
# Depois opção 2 (Atualizar)
```

### "Não tenho VS Code"
- Baixe em: https://code.visualstudio.com/
- Ou use qualquer editor: Sublime, Atom, etc.

---

## 📱 Atalhos do Menu

No Mac, você pode criar um atalho na área de trabalho:

1. **Finder** → Vá para a pasta `Fazz`
2. **Botão direito** em `fazz-menu.command`
3. **Fazer Alias**
4. **Arraste** o alias para a área de trabalho
5. **Renomeie** para "🚀 Fazz"

Agora é só dar duplo clique no atalho! 🎉

---

## 💡 Dicas

### Edição Rápida
Se você só precisa editar 1 arquivo:
```bash
# Terminal:
cd ~/Desktop/Fazz
code src/js/ui.js  # ou vim, nano, etc
```

### Commit Rápido (sem menu)
Se preferir linha de comando:
```bash
./commit-to-main.sh "Mensagem do commit"
```

### Ver Status Rápido
```bash
git status
```

---

## 🎓 Próximos Passos

1. ✅ Duplo clique em `fazz-menu.command`
2. ✅ Escolha opção 2 (Atualizar)
3. ✅ Escolha opção 5 (Abrir VS Code)
4. ✅ Faça uma mudança simples (ex: mudar uma cor)
5. ✅ Escolha opção 1 (Commit e Deploy)
6. ✅ Escolha opção 4 (Ver no navegador)

**Pronto! Você dominou o Fazz!** 🎉

---

**Dúvidas?** Escolha opção 6 e pergunte ao Claude! 🤖
