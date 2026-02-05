# Fazz

**Gerenciador de Tarefas e Agenda Inteligente**

Sistema moderno de gerenciamento de tarefas e agenda pessoal, inspirado em aplicativos líderes do mercado, com visual claro, predominância de branco e tons claros de azul, focando em legibilidade, simplicidade e fluidez.

![Fazz](https://img.shields.io/badge/version-1.0.0-blue)
![PWA](https://img.shields.io/badge/PWA-ready-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🎯 Sobre o Projeto

O **Fazz** é um Todo + Agenda inteligente, rápido e acessível em qualquer dispositivo, com experiência próxima a apps nativos. Desenvolvido como Progressive Web App (PWA), funciona offline e pode ser instalado em qualquer plataforma.

### Características Principais

✅ **Interface Limpa** - Design minimalista focado em produtividade
✅ **Tema Claro** - Predominância de branco com tons claros de azul
✅ **Offline-First** - Funciona sem internet, sincroniza quando online
✅ **PWA** - Instalável como app nativo
✅ **Responsivo** - Perfeito em qualquer tamanho de tela
✅ **Rápido** - Carregamento instantâneo e navegação fluída

---

## 🚀 Stack Tecnológica

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **PWA**: Service Worker, Web App Manifest
- **Backend**: Supabase (Auth + PostgreSQL)
- **Deploy**: GitHub Pages
- **Versionamento**: Git + GitHub

---

## 📦 Estrutura do Projeto

```
Fazz/
├── index.html              # Página principal
├── offline.html            # Página offline (PWA)
├── manifest.json           # Configuração PWA
├── service-worker.js       # Service Worker para offline
├── src/
│   ├── css/
│   │   └── main.css        # Estilos (tema claro, azul/branco)
│   ├── js/
│   │   ├── config.js       # Configurações globais
│   │   ├── supabase.js     # Cliente Supabase
│   │   ├── auth.js         # Gerenciamento de autenticação
│   │   ├── tasks.js        # Gerenciamento de tarefas
│   │   ├── ui.js           # Interface e renderização
│   │   └── app.js          # Inicialização da aplicação
│   └── assets/
│       └── icons/          # Ícones PWA (72px a 512px)
└── README.md               # Documentação
```

---

## 🎨 Design System

O Fazz segue rigorosamente as diretrizes da **[UI/UX Pro Max Skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)**:

### Paleta de Cores

```css
--color-primary: #4A90E2          /* Azul principal */
--color-primary-light: #6CA8F5    /* Azul claro (hover) */
--color-primary-lighter: #E8F2FC  /* Azul muito claro (backgrounds) */
--color-primary-dark: #2E6BB8     /* Azul escuro (active) */

--color-background: #FFFFFF       /* Fundo branco */
--color-surface: #F8FAFB          /* Superfícies elevadas */
--color-border: #E1E8ED           /* Bordas */

--color-text-primary: #1A2332     /* Texto principal */
--color-text-secondary: #5F6C7B   /* Texto secundário */
--color-text-tertiary: #8A94A6    /* Texto terciário */
```

### Breakpoints Responsivos

- **Mobile Small**: 375px
- **Tablet**: 768px
- **Desktop Small**: 1024px
- **Desktop Large**: 1440px

### Acessibilidade

- ✅ Contraste mínimo de **4.5:1** (WCAG AA)
- ✅ `prefers-reduced-motion` respeitado
- ✅ Ícones SVG (Heroicons/Lucide)
- ✅ `cursor: pointer` em todos os elementos clicáveis

---

## 🛠️ Configuração e Instalação

### 1. Clone o Repositório

```bash
git clone https://github.com/SEU_USUARIO/fazz.git
cd fazz
```

### 2. Configure o Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Copie a URL e a chave anônima (anon key)
4. Edite `src/js/config.js`:

```javascript
const CONFIG = {
  supabase: {
    url: 'SUA_URL_AQUI',
    anonKey: 'SUA_CHAVE_AQUI'
  },
  // ...
};
```

5. Execute as migrações SQL (veja seção abaixo)

### 3. Abra o Projeto

Como é um projeto estático, basta abrir `index.html` em um servidor local:

**Opção 1: Python**
```bash
python3 -m http.server 8000
```

**Opção 2: Node.js (npx)**
```bash
npx serve .
```

**Opção 3: VS Code Live Server**
- Instale a extensão "Live Server"
- Clique direito em `index.html` > "Open with Live Server"

Acesse `http://localhost:8000` (ou porta indicada)

---

## 🗄️ Configuração do Banco de Dados

Execute este SQL no Supabase SQL Editor:

```sql
-- Criar tabela de tarefas
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME,
  project TEXT DEFAULT 'inbox',
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só podem ver suas próprias tarefas
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuários só podem criar suas próprias tarefas
CREATE POLICY "Users can create own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários só podem atualizar suas próprias tarefas
CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

-- Política: Usuários só podem deletar suas próprias tarefas
CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_tasks_user_date ON tasks(user_id, date);
CREATE INDEX idx_tasks_user_completed ON tasks(user_id, completed);
```

---

## 🚀 Deploy no GitHub Pages

### 1. Criar Repositório no GitHub

```bash
git init
git add .
git commit -m "Initial commit - Fazz v1.0.0"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/fazz.git
git push -u origin main
```

### 2. Configurar GitHub Pages

1. Acesse seu repositório no GitHub
2. Vá em **Settings** > **Pages**
3. Em **Source**, selecione:
   - Branch: `main`
   - Folder: `/ (root)`
4. Clique em **Save**

Aguarde alguns minutos e acesse: `https://SEU_USUARIO.github.io/fazz`

### 3. Atualizar Configurações PWA

Edite `manifest.json` e `service-worker.js` para incluir o caminho correto se estiver usando subpasta:

```json
{
  "start_url": "/fazz/"
}
```

---

## 📱 Funcionalidades

### ✅ Gerenciamento de Tarefas

- ➕ Criar tarefas com título, data e horário
- ✏️ Editar tarefas existentes
- ✅ Marcar como concluída
- 🗑️ Deletar tarefas
- 📅 Organização automática por data (atrasadas, hoje, futuras)
- 🔄 Reagendar tarefas atrasadas em massa

### 🔐 Autenticação

- 📧 Login com e-mail/senha (Supabase Auth)
- 👤 Criar conta
- 👻 Modo convidado (uso sem login)
- 🔒 Dados protegidos por RLS (Row Level Security)

### 💾 Armazenamento

- ☁️ Sincronização com Supabase (quando online)
- 📦 Cache local no navegador (LocalStorage)
- 🔄 Sincronização automática ao voltar online
- 📴 Funcionamento completo offline

### 🎯 PWA

- 📲 Instalável em qualquer dispositivo
- 🚀 Carregamento instantâneo
- 📴 Funciona offline
- 🔔 Notificações (preparado para implementação futura)

---

## 🎨 UI/UX Guidelines

Baseado em **[UI/UX Pro Max Skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)**:

### Espaçamento

- `--spacing-xs`: 4px
- `--spacing-sm`: 8px
- `--spacing-md`: 16px
- `--spacing-lg`: 24px
- `--spacing-xl`: 32px
- `--spacing-2xl`: 48px

### Transições

- `--transition-fast`: 150ms
- `--transition-base`: 200ms
- `--transition-slow`: 300ms

### Hierarquia Visual

1. **Página Title** (32px, bold)
2. **Section Title** (18px, semibold)
3. **Task Title** (16px, medium)
4. **Meta Info** (14px, normal)

---

## 🔧 Customização

### Alterar Cores

Edite as variáveis CSS em `src/css/main.css`:

```css
:root {
  --color-primary: #SUA_COR;
  /* ... */
}
```

### Adicionar Novos Projetos

Edite `src/js/ui.js` na função `openTaskModal()`:

```javascript
<option value="trabalho">Trabalho</option>
<option value="pessoal">Pessoal</option>
```

---

## 🐛 Troubleshooting

### Service Worker não está funcionando

1. Certifique-se de estar usando HTTPS ou localhost
2. Limpe o cache do navegador
3. Desregistre o SW antigo:
   ```javascript
   navigator.serviceWorker.getRegistrations().then(r => r[0]?.unregister())
   ```

### Tarefas não sincronizam

1. Verifique se configurou corretamente as credenciais do Supabase
2. Verifique o console para erros
3. Certifique-se de que executou as migrações SQL

### PWA não instala

1. Verifique se o `manifest.json` está sendo servido corretamente
2. Certifique-se de ter ícones nos tamanhos corretos
3. Use HTTPS (GitHub Pages já fornece)

---

## 📝 TODO / Roadmap

- [ ] Criar ícones PWA personalizados
- [ ] Adicionar notificações de lembrete
- [ ] Implementar categorias/projetos customizados
- [ ] Adicionar tags nas tarefas
- [ ] Modo escuro (toggle)
- [ ] Repetição de tarefas (diária, semanal, mensal)
- [ ] Estatísticas e produtividade
- [ ] Exportar tarefas (JSON, CSV)

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fork o projeto
2. Criar uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abrir um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## 👨‍💻 Autor

Desenvolvido com ❤️ para ajudar pessoas a serem mais produtivas.

**Fazz** - _"Faça acontecer"_

---

## 📚 Referências

- [UI/UX Pro Max Skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
- [Supabase Documentation](https://supabase.com/docs)
- [PWA Guidelines](https://web.dev/progressive-web-apps/)
- [GitHub Pages](https://pages.github.com/)
