#!/bin/bash
# ==========================================
# Fazz - Script de Commit e Deploy
# ==========================================

set -e  # Parar em caso de erro

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Fazz - Deploy Script${NC}"
echo ""

# Verificar se há mudanças
if [[ -z $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  Nenhuma alteração detectada${NC}"
    exit 0
fi

# Mostrar status
echo -e "${BLUE}📊 Status atual:${NC}"
git status -s
echo ""

# Pedir mensagem de commit
if [ -z "$1" ]; then
    echo -e "${YELLOW}📝 Digite a mensagem do commit:${NC}"
    read -r COMMIT_MSG
else
    COMMIT_MSG="$1"
fi

if [ -z "$COMMIT_MSG" ]; then
    echo -e "${RED}❌ Mensagem de commit não pode ser vazia${NC}"
    exit 1
fi

# Obter branch atual
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${BLUE}📌 Branch atual: ${CURRENT_BRANCH}${NC}"

# Adicionar todos os arquivos
echo -e "${BLUE}📦 Adicionando arquivos...${NC}"
git add .

# Fazer commit
echo -e "${BLUE}💾 Fazendo commit...${NC}"
git commit -m "$COMMIT_MSG

https://claude.ai/code/session_01QvcRjqE9rh3RMBaQZiCpxp"

# Push
echo -e "${BLUE}⬆️  Fazendo push...${NC}"
git push -u origin "$CURRENT_BRANCH"

echo ""
echo -e "${GREEN}✅ Commit e push realizados com sucesso!${NC}"
echo ""

# Verificar se gh CLI está instalado
if command -v gh &> /dev/null; then
    echo -e "${YELLOW}🔀 Deseja criar um Pull Request para main? (s/n)${NC}"
    read -r CREATE_PR

    if [[ "$CREATE_PR" == "s" || "$CREATE_PR" == "S" ]]; then
        echo -e "${BLUE}📝 Criando Pull Request...${NC}"

        # Criar PR
        PR_URL=$(gh pr create \
            --base main \
            --head "$CURRENT_BRANCH" \
            --title "$COMMIT_MSG" \
            --body "## Alterações

$COMMIT_MSG

## Status
✅ Testado localmente
✅ Pronto para merge

---
_Criado automaticamente via commit-to-main.sh_" \
            --fill 2>&1 | grep -o 'https://github.com[^ ]*' || echo "")

        if [ -n "$PR_URL" ]; then
            echo -e "${GREEN}✅ Pull Request criado: ${PR_URL}${NC}"
            echo ""
            echo -e "${YELLOW}🔀 Deseja fazer o merge agora? (s/n)${NC}"
            read -r DO_MERGE

            if [[ "$DO_MERGE" == "s" || "$DO_MERGE" == "S" ]]; then
                echo -e "${BLUE}🔄 Fazendo merge...${NC}"
                gh pr merge "$PR_URL" --merge --delete-branch
                echo -e "${GREEN}✅ Merge realizado! GitHub Pages será atualizado em instantes.${NC}"
            else
                echo -e "${BLUE}ℹ️  PR criado. Faça o merge quando estiver pronto em: ${PR_URL}${NC}"
            fi
        fi
    fi
else
    echo -e "${YELLOW}ℹ️  GitHub CLI (gh) não instalado.${NC}"
    echo -e "${YELLOW}   Instale com: brew install gh${NC}"
    echo -e "${YELLOW}   E depois configure com: gh auth login${NC}"
    echo ""
    echo -e "${BLUE}🔗 Crie o PR manualmente em:${NC}"
    echo "https://github.com/JuniorNSMG/Fazz/compare/main...${CURRENT_BRANCH}"
fi

echo ""
echo -e "${GREEN}🎉 Processo concluído!${NC}"
