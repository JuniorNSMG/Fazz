#!/bin/bash
# ==========================================
# Fazz - Menu Interativo
# ==========================================

# Mudar para o diretório do script
cd "$(dirname "$0")"

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Função para mostrar header
show_header() {
    clear
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════╗"
    echo "║           🚀 FAZZ MENU 🚀              ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
}

# Função para mostrar status
show_status() {
    echo -e "${BLUE}📊 Status Atual:${NC}"
    git status -s
    echo ""
    BRANCH=$(git branch --show-current)
    echo -e "${BLUE}📌 Branch: ${GREEN}${BRANCH}${NC}"
    echo ""
}

# Função para commit e deploy
do_commit() {
    show_header
    echo -e "${YELLOW}📝 COMMIT E DEPLOY${NC}"
    echo ""

    # Verificar se há mudanças
    if [[ -z $(git status -s) ]]; then
        echo -e "${YELLOW}⚠️  Nenhuma alteração detectada${NC}"
        echo ""
        echo "Pressione Enter para voltar..."
        read
        return
    fi

    # Mostrar mudanças
    show_status

    # Pedir mensagem
    echo -e "${YELLOW}Digite a mensagem do commit:${NC}"
    read -r COMMIT_MSG

    if [ -z "$COMMIT_MSG" ]; then
        echo -e "${RED}❌ Mensagem não pode ser vazia${NC}"
        echo ""
        echo "Pressione Enter para voltar..."
        read
        return
    fi

    # Executar commit
    echo ""
    echo -e "${BLUE}📦 Adicionando arquivos...${NC}"
    git add .

    echo -e "${BLUE}💾 Fazendo commit...${NC}"
    git commit -m "$COMMIT_MSG

https://claude.ai/code/session_01QvcRjqE9rh3RMBaQZiCpxp"

    echo -e "${BLUE}⬆️  Fazendo push...${NC}"
    CURRENT_BRANCH=$(git branch --show-current)
    git push -u origin "$CURRENT_BRANCH"

    echo ""
    echo -e "${GREEN}✅ Push realizado!${NC}"
    echo ""

    # Perguntar sobre PR
    echo -e "${YELLOW}Deseja criar Pull Request e fazer merge? (s/n)${NC}"
    read -r DO_PR

    if [[ "$DO_PR" == "s" || "$DO_PR" == "S" ]]; then
        echo -e "${BLUE}📝 Criando Pull Request...${NC}"
        PR_URL=$(gh pr create \
            --base main \
            --head "$CURRENT_BRANCH" \
            --title "$COMMIT_MSG" \
            --body "## Alterações

$COMMIT_MSG

✅ Pronto para merge" \
            --fill 2>&1 | grep -o 'https://github.com[^ ]*' || echo "")

        if [ -n "$PR_URL" ]; then
            echo -e "${GREEN}✅ PR criado: ${PR_URL}${NC}"
            echo ""
            echo -e "${BLUE}🔄 Fazendo merge...${NC}"
            gh pr merge "$PR_URL" --merge --delete-branch
            echo -e "${GREEN}✅ Merge realizado! GitHub Pages será atualizado.${NC}"
        fi
    fi

    echo ""
    echo "Pressione Enter para voltar..."
    read
}

# Função para restaurar mudanças
do_restore() {
    show_header
    echo -e "${RED}⚠️  RESTAURAR MUDANÇAS${NC}"
    echo ""

    # Mostrar mudanças
    if [[ -z $(git status -s) ]]; then
        echo -e "${GREEN}✅ Nenhuma mudança para restaurar${NC}"
        echo ""
        echo "Pressione Enter para voltar..."
        read
        return
    fi

    show_status

    echo -e "${RED}ATENÇÃO: Isso vai DESCARTAR todas as mudanças não commitadas!${NC}"
    echo -e "${YELLOW}Tem certeza? Digite 'SIM' para confirmar:${NC}"
    read -r CONFIRM

    if [[ "$CONFIRM" == "SIM" ]]; then
        git restore .
        git clean -fd
        echo ""
        echo -e "${GREEN}✅ Mudanças restauradas${NC}"
    else
        echo ""
        echo -e "${BLUE}❌ Operação cancelada${NC}"
    fi

    echo ""
    echo "Pressione Enter para voltar..."
    read
}

# Função para abrir Claude
open_claude() {
    show_header
    echo -e "${MAGENTA}🤖 Abrindo Claude Code no terminal...${NC}"
    echo ""
    echo -e "${YELLOW}Escolha uma opção:${NC}"
    echo ""
    echo "  1) Abrir Claude nesta pasta"
    echo "  2) Copiar comando para colar no terminal"
    echo "  3) Voltar"
    echo ""
    echo -n "Opção: "
    read -r CLAUDE_OPT

    case $CLAUDE_OPT in
        1)
            echo ""
            echo -e "${BLUE}Iniciando Claude Code...${NC}"
            echo -e "${YELLOW}(Para sair, pressione Ctrl+C)${NC}"
            echo ""
            sleep 2
            # Tentar abrir Claude de diferentes formas
            if command -v claude &> /dev/null; then
                claude
            elif command -v claude-code &> /dev/null; then
                claude-code
            else
                echo -e "${RED}❌ Claude Code não encontrado${NC}"
                echo ""
                echo -e "${YELLOW}Instale com:${NC}"
                echo "  npm install -g @anthropic-ai/claude-code"
            fi
            ;;
        2)
            echo ""
            echo -e "${GREEN}Cole este comando no terminal:${NC}"
            echo ""
            echo -e "${CYAN}cd \"$(pwd)\" && claude${NC}"
            echo ""
            ;;
        3)
            return
            ;;
    esac

    echo ""
    echo "Pressione Enter para voltar..."
    read
}

# Função para ver histórico
show_history() {
    show_header
    echo -e "${BLUE}📜 Últimos 10 Commits:${NC}"
    echo ""
    git log --oneline --graph --decorate -10
    echo ""
    echo "Pressione Enter para voltar..."
    read
}

# Função para atualizar do remoto
do_pull() {
    show_header
    echo -e "${BLUE}🔄 Atualizando do GitHub...${NC}"
    echo ""

    CURRENT_BRANCH=$(git branch --show-current)

    # Verificar se há mudanças locais
    if [[ -n $(git status -s) ]]; then
        echo -e "${YELLOW}⚠️  Você tem mudanças não commitadas.${NC}"
        echo -e "${YELLOW}Deseja salvá-las temporariamente (stash)? (s/n)${NC}"
        read -r DO_STASH

        if [[ "$DO_STASH" == "s" || "$DO_STASH" == "S" ]]; then
            git stash
            echo -e "${GREEN}✅ Mudanças salvas temporariamente${NC}"
            STASHED=true
        fi
    fi

    # Pull
    echo -e "${BLUE}Baixando atualizações...${NC}"
    git pull origin "$CURRENT_BRANCH"

    # Restaurar stash se necessário
    if [ "$STASHED" = true ]; then
        echo ""
        echo -e "${BLUE}Restaurando suas mudanças...${NC}"
        git stash pop
    fi

    echo ""
    echo -e "${GREEN}✅ Atualização concluída!${NC}"
    echo ""
    echo "Pressione Enter para voltar..."
    read
}

# Função para abrir no navegador
open_browser() {
    show_header
    echo -e "${BLUE}🌐 Abrindo GitHub Pages...${NC}"
    open "https://juniornsmg.github.io/Fazz"
    echo ""
    echo -e "${GREEN}✅ Abrindo no navegador...${NC}"
    sleep 1
}

# Função para abrir VS Code
open_vscode() {
    show_header
    echo -e "${BLUE}💻 Abrindo no VS Code...${NC}"
    code .
    echo ""
    echo -e "${GREEN}✅ VS Code aberto${NC}"
    sleep 1
}

# Menu principal
show_menu() {
    show_header
    show_status

    echo -e "${YELLOW}O que deseja fazer?${NC}"
    echo ""
    echo "  ${GREEN}1)${NC} 📝 Commit e Deploy"
    echo "  ${GREEN}2)${NC} 🔄 Atualizar do GitHub (Pull)"
    echo "  ${GREEN}3)${NC} 📜 Ver Histórico de Commits"
    echo "  ${GREEN}4)${NC} 🌐 Abrir GitHub Pages no Navegador"
    echo "  ${GREEN}5)${NC} 💻 Abrir no VS Code"
    echo "  ${GREEN}6)${NC} 🤖 Abrir Claude Code"
    echo "  ${GREEN}7)${NC} ${RED}⚠️  Restaurar Mudanças (Desfazer)${NC}"
    echo "  ${GREEN}8)${NC} 🚪 Sair"
    echo ""
    echo -n "Opção: "
    read -r option

    case $option in
        1) do_commit ;;
        2) do_pull ;;
        3) show_history ;;
        4) open_browser ;;
        5) open_vscode ;;
        6) open_claude ;;
        7) do_restore ;;
        8)
            show_header
            echo -e "${GREEN}👋 Até logo!${NC}"
            echo ""
            sleep 1
            exit 0
            ;;
        *)
            echo ""
            echo -e "${RED}❌ Opção inválida${NC}"
            sleep 1
            ;;
    esac
}

# Loop principal
while true; do
    show_menu
done
