# Configuração de MCPs Instalados no Fazz

## MCPs Configurados ✅

Os seguintes MCPs foram adicionados ao Claude Desktop:

### 1. **GitHub MCP** 🔧
- **Funcionalidade**: Gerenciar PRs, Issues, commits diretamente
- **Status**: Configurado (requer token)
- **Package**: `@modelcontextprotocol/server-github`

### 2. **Filesystem MCP** 📁
- **Funcionalidade**: Monitorar e validar estrutura de arquivos
- **Status**: Ativo ✅
- **Pastas monitoradas**:
  - `/Users/junior/.claude-worktrees/Fazz/crazy-hodgkin`
  - `/Users/junior/Documents/Fazz`

### 3. **Playwright MCP** 🎭
- **Funcionalidade**: Testes automatizados e browser automation
- **Status**: Ativo ✅
- **Package**: `@playwright/mcp`

## ⚙️ Configuração Necessária

### GitHub Token (Obrigatório)

Para ativar o GitHub MCP, você precisa criar um Personal Access Token:

1. Acesse: https://github.com/settings/tokens
2. Clique em "Generate new token (classic)"
3. Selecione os escopos:
   - ✅ `repo` (acesso completo a repositórios)
   - ✅ `workflow` (atualizar GitHub Actions)
   - ✅ `read:org` (ler informações da organização)
4. Copie o token gerado
5. Edite o arquivo:
   ```bash
   code ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```
6. Substitua `<YOUR_GITHUB_TOKEN_HERE>` pelo seu token
7. **Reinicie o Claude Desktop completamente**

### Verificação

Após reiniciar o Claude Desktop, você verá um ícone de MCP no canto inferior direito da caixa de input. Clique nele para ver os servidores ativos.

## 📚 Recursos

- [GitHub MCP Documentation](https://github.com/github/github-mcp-server)
- [MCP Official Docs](https://modelcontextprotocol.io/docs/develop/connect-local-servers)
- [Desktop Extensions Guide](https://www.anthropic.com/engineering/desktop-extensions)

## 🎯 Benefícios para o Fazz

Com esses MCPs instalados:
- ✅ Commits e PRs mais seguros
- ✅ Validação automática de arquivos
- ✅ Testes automatizados do app
- ✅ Menos erros de merge/push
- ✅ Workflow mais eficiente

---

**Importante**: Após configurar o token, reinicie completamente o Claude Desktop (Cmd+Q no Mac).
