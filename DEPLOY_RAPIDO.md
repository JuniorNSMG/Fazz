# 🚀 Deploy Rápido - Copie e Cole

**Atenção**: Substitua `SEU_USUARIO` e `fazz` pelo seu usuário GitHub e nome do repositório!

---

## ⚡ Comandos para copiar e colar

### 1️⃣ Navegar até a pasta (se ainda não estiver)

```bash
cd /Users/walterjunior/Documents/Fazz
```

### 2️⃣ Inicializar Git (se ainda não fez)

```bash
git init
```

### 3️⃣ Adicionar todos os arquivos

```bash
git add .
```

### 4️⃣ Fazer primeiro commit

```bash
git commit -m "Initial commit - Fazz v1.0.0"
```

### 5️⃣ Conectar ao GitHub

**⚠️ IMPORTANTE: Edite a linha abaixo com seus dados!**

```bash
git remote add origin https://github.com/SEU_USUARIO/fazz.git
```

Exemplo real:
```bash
git remote add origin https://github.com/walterjunior/fazz.git
```

### 6️⃣ Renomear branch para main

```bash
git branch -M main
```

### 7️⃣ Enviar para GitHub

```bash
git push -u origin main
```

**Se pedir senha**: Use seu Personal Access Token (veja como criar no GITHUB_SETUP.md)

---

## ✅ Pronto!

Agora vá no GitHub e ative o GitHub Pages:

1. Acesse: `https://github.com/SEU_USUARIO/fazz`
2. Clique em **Settings**
3. Clique em **Pages** (menu lateral)
4. Em **Source**, escolha: Branch `main` e Folder `/ (root)`
5. Clique em **Save**

Aguarde 2-5 minutos e acesse: `https://SEU_USUARIO.github.io/fazz`

---

## 🔄 Para atualizar depois

```bash
git add .
git commit -m "Descrição da mudança"
git push
```
