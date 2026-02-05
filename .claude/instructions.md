# Instruções do Projeto Fazz

## Regras de Git e Deploy (CRÍTICO)

### ⚠️ SEMPRE SEGUIR ESTAS REGRAS:

1. **Branch Principal é MAIN**
   - GitHub Pages está configurado para usar a branch `main`
   - TODOS os commits devem ir para `main` para serem deployados
   - NUNCA commitar apenas para branch `crazy-hodgkin` sem fazer merge/push para `main`

2. **Comando de Push Correto**
   ```bash
   # CORRETO - Push direto para main
   git push origin HEAD:main

   # OU
   git push origin crazy-hodgkin:main

   # INCORRETO - Só atualiza a branch atual
   git push origin crazy-hodgkin
   ```

3. **Workflow Completo de Commit**
   ```bash
   git add -A
   git commit -m "mensagem detalhada"
   git push origin HEAD:main  # SEMPRE para main!
   ```

4. **Após Cada Push**
   - Confirmar que o push foi bem sucedido
   - Informar ao usuário: "✅ Mudanças enviadas para MAIN. GitHub Pages fará deploy em 1-2 minutos."
   - Aguardar confirmação do usuário se necessário

## Regras de Desenvolvimento

### Debug First
- Ao implementar features com modal/eventos, SEMPRE adicionar logs de debug primeiro
- Exemplo:
  ```javascript
  console.log('🔄 Elemento encontrado:', element);
  console.log('🔄 Event listener adicionado');
  ```

### Testes
- Testar localmente quando possível
- Pedir ao usuário para testar após mudanças significativas
- Não assumir que algo funciona - sempre validar

### Recorrência e Features Complexas
- Adicionar logs de debug em todas as etapas
- Verificar se event listeners estão sendo anexados
- Confirmar que elementos DOM existem antes de adicionar eventos

## Comunicação

### Sempre Informar
- Branch usada para push
- Tempo estimado de deploy
- Necessidade de limpar cache
- Status de cada etapa (commit, push, deploy)

### Pedir Confirmação Para
- Mudanças estruturais grandes
- Deletar código ou arquivos
- Merge de branches
- Alterações em configurações de produção

## Estrutura do Projeto

- **Frontend**: GitHub Pages (`main` branch)
- **Backend**: Supabase
- **Worktree**: `/Users/junior/.claude-worktrees/Fazz/crazy-hodgkin`
- **Produção**: https://juniornsmg.github.io/Fazz/

## Lembretes Finais

- ✅ MAIN é a branch de produção
- ✅ Sempre push para MAIN
- ✅ Informar o usuário sobre o status
- ✅ Debug first, fix later
- ✅ Testar antes de confirmar que funciona
