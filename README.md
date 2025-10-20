# Social Scheduler AI

Uma plataforma completa para agências de marketing digital gerenciarem cronogramas de posts em redes sociais com inteligência artificial.

## 🚀 Funcionalidades

### 📅 Gerenciamento de Projetos

- **Kanban Board**: Visualize e organize posts por status (A criar, Em revisão, Aprovado, Ajustar)
- **Calendário Mensal**: Visualização em calendário com drag-and-drop para reorganizar posts
- **Criação Manual**: Adicione posts individualmente com todos os detalhes necessários

### 🤖 Inteligência Artificial

- **Geração de Cronogramas**: Crie cronogramas completos baseados em parâmetros do cliente
- **Geração de Posts Individuais**: Gere posts específicos para feriados e datas especiais
- **Controle de Uso**: Sistema de cotas com planos (Starter, Pro, Business)
- **Overage**: Opção de uso além da cota mensal
- **Monitoramento de Uso**: Banner visual mostrando status da cota de IA
- **Controle de Acesso**: Botões desabilitados quando cota esgotada

### 👥 Gestão de Equipe

- **Sistema de Convites**: Convide membros para agências com diferentes níveis de acesso
- **Roles**: agency_admin, social_media, client_viewer
- **Múltiplas Agências**: Suporte para gerenciar várias agências

### 🔗 Revisão Pública

- **Links de Revisão**: Compartilhe links seguros com clientes para revisar posts
- **Ações de Revisão**: Aprovar ou solicitar ajustes diretamente
- **Comentários**: Sistema de comentários para feedback detalhado

### 📊 Controle de Qualidade

- **Análise de Qualidade**: Verificação automática de frequência, feriados e consistência
- **Sugestões de Feriados**: IA sugere feriados relevantes para o cliente
- **Validação de Conteúdo**: Verificação de limites de caracteres e consistência

### 🛠️ Ferramentas de Desenvolvimento

- **Hub de Desenvolvimento**: Página especial para desenvolvedores com login rápido
- **Login Automático**: Teste diferentes perfis de usuário (Admin, Social Media, Cliente)
- **Gestão de Projetos**: Visualização e navegação rápida entre projetos
- **Links de Revisão**: Criação e gerenciamento de links públicos para testes

## 🛠️ Tecnologias

- **Frontend**: Next.js 15, React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes, Supabase
- **Banco de Dados**: PostgreSQL (via Supabase)
- **Autenticação**: Supabase Auth
- **IA**: OpenAI GPT (configurável)
- **Deploy**: Vercel (recomendado)

## 📋 Pré-requisitos

- Node.js 18+
- Conta no Supabase
- Chave da API OpenAI (opcional, para funcionalidades de IA)

## 🚀 Instalação

1. **Clone o repositório**

```bash
git clone <repository-url>
cd social-scheduler-ai
```

2. **Instale as dependências**

```bash
npm install
# ou
yarn install
```

3. **Configure as variáveis de ambiente**
   Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

4. **Configure o banco de dados**
   Execute as migrações SQL no Supabase (arquivos em `supabase/migrations/`):

- `001_init.sql` - Estrutura inicial
- `002_ai_plans.sql` - Planos e uso de IA
- `003_invitations.sql` - Sistema de convites
- `004_review_links.sql` - Links de revisão pública
- `005_reset_seed.sql` - Dados de exemplo

5. **Execute o projeto**

```bash
npm run dev
# ou
yarn dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

## 📁 Estrutura do Projeto

```
social-scheduler-ai/
├── components/           # Componentes React reutilizáveis
│   ├── Layout.js        # Layout principal
│   ├── KanbanCard.js    # Card do Kanban
│   ├── MonthCalendar.js # Calendário mensal
│   ├── AiUsageBanner.js # Banner de uso de IA
│   ├── UsageBanner.js   # Banner de uso de IA (legado)
│   └── ...
├── hooks/               # Custom hooks React
│   └── useAiUsage.js    # Hook para gerenciar uso de IA
├── lib/                 # Utilitários e configurações
│   ├── ai/             # Configurações de IA
│   ├── plan/           # Sistema de planos
│   ├── supabaseClient.js
│   └── ...
├── pages/              # Páginas Next.js
│   ├── api/            # API Routes
│   ├── projects/       # Páginas de projetos
│   ├── agency/         # Gestão de agências
│   ├── dev/            # Ferramentas de desenvolvimento
│   └── ...
├── supabase/           # Migrações e configurações do banco
│   └── migrations/
└── styles/             # Estilos globais
```

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run start        # Servidor de produção
npm run lint         # Linter ESLint
npm run dev:seed     # Reset de dados de desenvolvimento
```

## 🎯 Como Usar

### 1. Criar uma Agência

- Faça login e crie sua primeira agência
- Configure o plano (Starter, Pro ou Business)

### 2. Adicionar Membros

- Use o sistema de convites para adicionar membros da equipe
- Defina roles apropriados para cada membro

### 3. Criar Projetos

- Crie projetos para cada cliente
- Configure o mês e informações do cliente

### 4. Gerar Cronogramas

- Use a IA para gerar cronogramas completos
- Ajuste parâmetros como frequência, tom de voz, produtos
- Revise e edite posts antes de inserir

### 5. Gerenciar Posts

- Use o Kanban para organizar posts por status
- Visualize no calendário para ver distribuição temporal
- Compartilhe links de revisão com clientes

### 6. Desenvolvimento e Testes

- Acesse `/dev` para o hub de desenvolvimento (apenas local)
- Use login rápido para testar diferentes perfis
- Monitore uso de IA em tempo real
- Crie links de revisão para testes

## 🔒 Segurança

- **Row Level Security (RLS)** no Supabase
- **Autenticação obrigatória** para todas as operações
- **Controle de acesso baseado em roles**
- **Links de revisão com expiração**
- **Validação de permissões** em todas as operações

## 📈 Planos e Limites

| Plano    | Membros | Clientes | Posts IA/mês |
| -------- | ------- | -------- | ------------ |
| Starter  | 3       | 5        | 50           |
| Pro      | 10      | 20       | 300          |
| Business | 50      | 200      | 3000         |

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para suporte e dúvidas:

- Abra uma issue no GitHub
- Consulte a documentação em `/help/cronogramas`
- Entre em contato com a equipe de desenvolvimento

## 🔄 Roadmap

- [x] Sistema de monitoramento de uso de IA
- [x] Hub de desenvolvimento para testes
- [x] Controle de acesso baseado em cotas
- [ ] Integração com APIs de redes sociais
- [ ] Agendamento automático de posts
- [ ] Analytics e relatórios
- [ ] Templates de posts personalizáveis
- [ ] Sistema de aprovação em múltiplas etapas
- [ ] App mobile
- [ ] Integração com ferramentas de design

---

Desenvolvido com ❤️ para agências de marketing digital
