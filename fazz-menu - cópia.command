#!/bin/bash
# ==========================================
# Fazz - Menu Interativo
# ==========================================

# Mudar para o diretório do script
cd "$(dirname "$0")"

# Detectar se o terminal suporta cores
if [[ -t 1 ]] && command -v tput &> /dev/null && [[ $(tput colors) -ge 8 ]]; then
    # Cores para output
    GREEN=$(tput setaf 2)
    BLUE=$(tput setaf 4)
    YELLOW=$(tput setaf 3)
    RED=$(tput setaf 1)
    CYAN=$(tput setaf 6)
    MAGENTA=$(tput setaf 5)
    BOLD=$(tput bold)
    NC=$(tput sgr0)
else
    # Sem cores
    GREEN=''
    BLUE=''
    YELLOW=''
    RED=''
    CYAN=''
    MAGENTA=''
    BOLD=''
    NC=''
fi

# Função para mostrar header
show_header() {
    clear
    echo "${CYAN}"
    echo "╔════════════════════════════════════════╗"
    echo "║           🚀 FAZZ MENU 🚀              ║"
    echo "╚════════════════════════════════════════╝"
    echo "${NC}"
    echo ""
}

# Função para mostrar status
show_status() {
    echo "${BLUE}📊 Status Atual:${NC}"
    git status -s
    echo ""
    BRANCH=$(git branch --show-current)
    echo "${BLUE}📌 Branch: ${GREEN}${BRANCH}${NC}"
    echo ""
}

# Função para commit e deploy
do_commit() {
    show_header
    echo "${YELLOW}📝 COMMIT E DEPLOY${NC}"
    echo ""

    # Verificar se há mudanças
    if [[ -z $(git status -s) ]]; then
        echo "${YELLOW}⚠️  Nenhuma alteração detectada${NC}"
        echo ""
        echo "Pressione Enter para voltar..."
        read
        return
    fi

    # Mostrar mudanças
    show_status

    # Pedir mensagem
    echo "${YELLOW}Digite a mensagem do commit:${NC}"
    read -r COMMIT_MSG

    if [ -z "$COMMIT_MSG" ]; then
        echo "${RED}❌ Mensagem não pode ser vazia${NC}"
        echo ""
        echo "Pressione Enter para voltar..."
        read
        return
    fi

    # Executar commit
    echo ""
    echo "${BLUE}📦 Adicionando arquivos...${NC}"
    git add .

    echo "${BLUE}💾 Fazendo commit...${NC}"
    git commit -m "$COMMIT_MSG

https://claude.ai/code/session_01QvcRjqE9rh3RMBaQZiCpxp"

    echo "${BLUE}⬆️  Fazendo push...${NC}"
    CURRENT_BRANCH=$(git branch --show-current)
    git push -u origin "$CURRENT_BRANCH"

    echo ""
    echo "${GREEN}✅ Push realizado!${NC}"
    echo ""

    # Perguntar sobre PR
    echo "${YELLOW}Deseja criar Pull Request e fazer merge? (s/n)${NC}"
    read -r DO_PR

    if [[ "$DO_PR" == "s" || "$DO_PR" == "S" ]]; then
        echo "${BLUE}📝 Criando Pull Request...${NC}"
        PR_URL=$(gh pr create \
            --base main \
            --head "$CURRENT_BRANCH" \
            --title "$COMMIT_MSG" \
            --body "## Alterações

$COMMIT_MSG

✅ Pronto para merge" \
            --fill 2>&1 | grep -o 'https://github.com[^ ]*' || echo "")

        if [ -n "$PR_URL" ]; then
            echo "${GREEN}✅ PR criado: ${PR_URL}${NC}"
            echo ""
            echo "${BLUE}🔄 Fazendo merge...${NC}"
            gh pr merge "$PR_URL" --merge --delete-branch
            echo "${GREEN}✅ Merge realizado! GitHub Pages será atualizado.${NC}"
        fi
    fi

    echo ""
    echo "Pressione Enter para voltar..."
    read
}

# Função para restaurar mudanças
do_restore() {
    show_header
    echo "${RED}⚠️  RESTAURAR MUDANÇAS${NC}"
    echo ""

    # Mostrar mudanças
    if [[ -z $(git status -s) ]]; then
        echo "${GREEN}✅ Nenhuma mudança para restaurar${NC}"
        echo ""
        echo "Pressione Enter para voltar..."
        read
        return
    fi

    show_status

    echo "${RED}ATENÇÃO: Isso vai DESCARTAR todas as mudanças não commitadas!${NC}"
    echo "${YELLOW}Tem certeza? Digite 'SIM' para confirmar:${NC}"
    read -r CONFIRM

    if [[ "$CONFIRM" == "SIM" ]]; then
        git restore .
        git clean -fd
        echo ""
        echo "${GREEN}✅ Mudanças restauradas${NC}"
    else
        echo ""
        echo "${BLUE}❌ Operação cancelada${NC}"
    fi

    echo ""
    echo "Pressione Enter para voltar..."
    read
}

# Função para abrir Claude
open_claude() {
    show_header
    echo "${MAGENTA}🤖 Abrindo Claude Code no terminal...${NC}"
    echo ""
    echo "${YELLOW}Escolha uma opção:${NC}"
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
            echo "${BLUE}Iniciando Claude Code...${NC}"
            echo "${YELLOW}(Para sair, pressione Ctrl+C)${NC}"
            echo ""
            sleep 2
            # Tentar abrir Claude de diferentes formas
            if command -v claude &> /dev/null; then
                claude
            elif command -v claude-code &> /dev/null; then
                claude-code
            else
                echo "${RED}❌ Claude Code não encontrado${NC}"
                echo ""
                echo "${YELLOW}Instale com:${NC}"
                echo "  npm install -g @anthropic-ai/claude-code"
            fi
            ;;
        2)
            echo ""
            echo "${GREEN}Cole este comando no terminal:${NC}"
            echo ""
            echo "${CYAN}cd \"$(pwd)\" && claude${NC}"
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
    echo "${BLUE}📜 Últimos 10 Commits:${NC}"
    echo ""
    git log --oneline --graph --decorate -10
    echo ""
    echo "Pressione Enter para voltar..."
    read
}

# Função para atualizar do remoto
do_pull() {
    show_header
    echo "${BLUE}🔄 Atualizando do GitHub...${NC}"
    echo ""

    CURRENT_BRANCH=$(git branch --show-current)

    # Verificar se há mudanças locais
    if [[ -n $(git status -s) ]]; then
        echo "${YELLOW}⚠️  Você tem mudanças não commitadas.${NC}"
        echo "${YELLOW}Deseja salvá-las temporariamente (stash)? (s/n)${NC}"
        read -r DO_STASH

        if [[ "$DO_STASH" == "s" || "$DO_STASH" == "S" ]]; then
            git stash
            echo "${GREEN}✅ Mudanças salvas temporariamente${NC}"
            STASHED=true
        fi
    fi

    # Pull
    echo "${BLUE}Baixando atualizações...${NC}"
    git pull origin "$CURRENT_BRANCH"

    # Restaurar stash se necessário
    if [ "$STASHED" = true ]; then
        echo ""
        echo "${BLUE}Restaurando suas mudanças...${NC}"
        git stash pop
    fi

    echo ""
    echo "${GREEN}✅ Atualização concluída!${NC}"
    echo ""
    echo "Pressione Enter para voltar..."
    read
}

# Função para abrir no navegador
open_browser() {
    show_header
    echo "${BLUE}🌐 Abrindo GitHub Pages...${NC}"
    open "https://juniornsmg.github.io/Fazz"
    echo ""
    echo "${GREEN}✅ Abrindo no navegador...${NC}"
    sleep 1
}

# Função para abrir VS Code
open_vscode() {
    show_header
    echo "${BLUE}💻 Abrindo no VS Code...${NC}"
    code .
    echo ""
    echo "${GREEN}✅ VS Code aberto${NC}"
    sleep 1
}

# Menu principal
show_menu() {
    show_header
    show_status

    echo "${YELLOW}O que deseja fazer?${NC}"
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
    printf "Opção: "
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
            echo "${GREEN}👋 Até logo!${NC}"
            echo ""
            sleep 1
            exit 0
            ;;
        *)
            echo ""
            echo "${RED}❌ Opção inválida${NC}"
            sleep 1
            ;;
    esac
}

# Loop principal
while true; do
    show_menu
done
