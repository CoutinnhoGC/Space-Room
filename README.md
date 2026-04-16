# SpaceRoom

Sistema de gerenciamento e reserva de salas, laboratórios e espaços compartilhados para instituições de ensino.

## 🎯 Sobre o Projeto

SpaceRoom é uma plataforma moderna e intuitiva que permite:
- Gerenciar espaços cadastrados (salas, laboratórios, auditórios)
- Visualizar disponibilidade dos ambientes em tempo real
- Criar, editar e cancelar reservas
- Controlar usuários vinculados a instituições
- Organizar o uso dos espaços de forma eficiente.

## 🚀 Tecnologias

- **React 18** - Framework JavaScript
- **TypeScript** - Tipagem estática
- **Tailwind CSS v4** - Framework CSS utility-first
- **React Router** - Roteamento
- **Recharts** - Gráficos e visualizações
- **Lucide React** - Ícones modernos
- **Vite** - Build tool

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── components/       # Componentes reutilizáveis
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── SummaryCard.tsx
│   │   └── ...
│   ├── pages/           # Páginas da aplicação
│   │   ├── DashboardPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── ReservasPage.tsx
│   │   ├── NovaReservaPage.tsx
│   │   ├── EspacosPage.tsx
│   │   ├── UsuariosPage.tsx
│   │   ├── CalendarioPage.tsx
│   │   └── ConfiguracoesPage.tsx
│   ├── routes.tsx       # Configuração de rotas
│   └── App.tsx          # Componente raiz
└── styles/
    ├── theme.css        # Variáveis de tema (light/dark)
    ├── fonts.css
    ├── tailwind.css
    └── index.css
```

## 🎨 Design System

### Cores Principais

**Modo Claro:**
- Primary Blue: `#3b82f6`
- Primary Blue Dark: `#1d4ed8`
- Primary Blue Light: `#60a5fa`
- Background: `#ffffff`
- Text: `#111827`

**Modo Escuro (preparado):**
- Primary Blue: `#60a5fa`
- Background: `#0f172a`
- Text: `#f1f5f9`

### Componentes

O sistema utiliza componentes consistentes:
- Cards com sombras suaves
- Bordas arredondadas (8px padrão)
- Espaçamento generoso
- Tipografia hierárquica clara
- Estados hover/focus bem definidos

## 📄 Páginas

### 🏠 Dashboard
- Visão geral com métricas principais
- Gráficos de ocupação e reservas
- Lista de próximas reservas
- Atividades recentes
- Status dos espaços

### 📅 Reservas
- Lista completa de reservas
- Filtros por data, status e espaço
- Ações: visualizar, editar, cancelar

### ➕ Nova Reserva
- Formulário completo de criação
- Seleção de instituição e espaço
- Data e horários
- Validação de conflitos
- Feedback visual

### 🏢 Espaços
- Cards com informações dos espaços
- Capacidade e tipo
- Status de disponibilidade
- Gerenciamento (editar/excluir)

### 👥 Usuários
- Listagem de todos os usuários
- Informações de contato e função
- Status ativo/inativo
- Gerenciamento de perfis

### 📆 Calendário
- Visualização mensal
- Indicadores de dias com reservas
- Detalhes das reservas do dia

### ⚙️ Configurações
- Dados do perfil do usuário
- Informações da instituição
- Preferências do sistema

### 🔐 Login / Cadastro
- Interface clean e moderna
- Validação de campos
- Links de recuperação de senha

## 🎯 Funcionalidades Principais

1. **Gestão de Reservas**
   - Criação com validação de conflitos
   - Edição e cancelamento
   - Histórico completo

2. **Dashboard Institucional**
   - Métricas em tempo real
   - Gráficos interativos
   - Atividades recentes

3. **Gestão de Espaços**
   - Cadastro de ambientes
   - Controle de capacidade
   - Status de disponibilidade

4. **Multi-instituição**
   - Suporte a múltiplas instituições
   - Filtros por instituição
   - Gestão separada

## 🌙 Dark Mode

O sistema está preparado para suportar modo escuro:
- Variáveis CSS já configuradas
- Esquema de cores definido
- Estrutura pronta para implementação do toggle

## 🔧 Desenvolvimento

```bash
# Instalar dependências
pnpm install

# Executar em desenvolvimento
pnpm dev

# Build para produção
pnpm build
```

## 📱 Responsividade

O sistema é totalmente responsivo:
- Desktop: Layout completo com sidebar fixa
- Tablet: Adaptação de grid e espaçamentos
- Mobile: Menu colapsável, reorganização de componentes

## 🔮 Próximos Passos

- [ ] Implementar toggle de dark mode
- [ ] Adicionar autenticação real
- [ ] Integração com backend
- [ ] Notificações em tempo real
- [ ] Exportação de relatórios
- [ ] Sistema de permissões avançado

## 📝 Licença

Sistema desenvolvido para uso institucional - SpaceRoom v1.0
