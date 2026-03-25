Estou desenvolvendo um sistema chamado SpaceRoom, uma plataforma de gerenciamento e reserva de salas e espaços em instituições.

Já existe um dashboard funcional criado com React + TypeScript + Tailwind + componentes modernos. O design está bom, mas preciso evoluir o sistema para um nível mais profissional, corrigindo alguns pontos e criando novas telas.

IMPORTANTE:
Não recrie o projeto do zero.
Trabalhe em cima da estrutura existente, mantendo o padrão visual atual, mas melhorando a qualidade, organização e consistência.

--------------------------------------------------
1. MELHORIAS NO DASHBOARD EXISTENTE
--------------------------------------------------

1.1 Tornar o botão “Nova Reserva” funcional
- O botão já existe no header
- Ele deve navegar para a página de criação de reserva (ex: /reservas/nova)
- Implementar navegação com React Router (ou solução equivalente)
- Garantir consistência com o restante da navegação

1.2 Sidebar com agrupamentos visuais reais
Atualmente os itens possuem categorias, mas isso não está bem representado visualmente.

Organizar a sidebar em seções visuais, por exemplo:
- Principal
- Gestão
- Agenda
- Sistema

Adicionar:
- títulos de seção
- espaçamento adequado
- separação visual elegante
- manter estilo clean e moderno

1.3 Melhorar a semântica dos cards do dashboard
Atualizar os indicadores para refletirem melhor o contexto do SpaceRoom:

Substituir/ajustar para algo como:
- Reservas hoje
- Espaços ocupados agora
- Espaços disponíveis
- Reservas pendentes
- Taxa de ocupação (%)
- Usuários ativos

Os cards devem:
- ter ícones relevantes
- ter números bem destacados
- ter pequenas descrições
- manter design clean e consistente

1.4 Trazer mais contexto institucional
Adicionar no dashboard:
- nome da instituição ativa
- possível seleção de instituição (se aplicável)
- contexto de período (ex: “Semana atual”, “Hoje”, etc.)
- pequenas informações institucionais no topo ou nos filtros

Isso deve reforçar que o sistema é institucional, não genérico.

--------------------------------------------------
2. PADRONIZAÇÃO VISUAL E TEMA
--------------------------------------------------

2.1 Alinhar o tema com a identidade do SpaceRoom
Atualmente o design usa azul, mas o sistema de tema ainda está genérico.

Padronizar cores usando tokens/variáveis:
- azul primário
- azul secundário
- azul claro
- fundo
- bordas
- texto principal
- texto secundário
- cores de status (sucesso, erro, alerta)

Evitar uso direto de classes fixas como:
- text-blue-600
- bg-white
- text-gray-900

Preferir variáveis de tema (CSS variables ou config do Tailwind).

2.2 Melhorar consistência visual
- padronizar espaçamentos
- padronizar bordas
- padronizar sombras
- manter aparência SaaS moderna
- evitar variações inconsistentes entre componentes

--------------------------------------------------
3. PREPARAÇÃO PARA DARK MODE
--------------------------------------------------

O sistema deve ser preparado corretamente para suportar dark mode no futuro.

Implementar:
- estrutura de tema claro/escuro
- uso consistente de variáveis de cor
- evitar cores hardcoded
- garantir bom contraste

Não precisa implementar o toggle completo ainda, mas deixar tudo pronto para isso.

Dark mode futuro:
- fundo escuro (preto/cinza escuro)
- azul como cor principal
- aparência premium

--------------------------------------------------
4. NAVEGAÇÃO E ROTAS
--------------------------------------------------

Implementar sistema de rotas estruturado:

Exemplo:
- /dashboard
- /reservas
- /reservas/nova
- /espacos
- /usuarios
- /calendario
- /configuracoes
- /login
- /cadastro

Garantir:
- navegação funcional pela sidebar
- destaque correto do item ativo
- organização clara de páginas

--------------------------------------------------
5. CRIAR AS TELAS QUE ESTÃO FALTANDO
--------------------------------------------------

Criar novas páginas mantendo o mesmo padrão visual do dashboard.

5.1 Tela de Login
- layout moderno e limpo
- campo de email
- campo de senha
- botão de login
- opção de “esqueci minha senha”
- link para cadastro
- design centralizado
- visual consistente com o sistema

5.2 Tela de Cadastro
- nome
- email
- senha
- confirmar senha
- botão de criar conta
- link para login

5.3 Tela de Nova Reserva
Uma das mais importantes.

Deve conter:
- seleção de instituição (se necessário)
- seleção de espaço
- data
- horário de início e fim
- validação visual de conflito de horário (UI preparada)
- botão de confirmar reserva
- feedback visual (sucesso/erro)
- layout organizado e intuitivo

5.4 Tela de Reservas
- lista de reservas
- tabela ou lista moderna
- colunas: espaço, usuário, data, horário, status
- filtros:
  - por data
  - por espaço
  - por status
- ações:
  - visualizar
  - editar
  - cancelar

5.5 Tela de Espaços
- listagem de espaços cadastrados
- cards ou tabela
- nome, capacidade, status
- botão de adicionar espaço
- botão de editar espaço

5.6 Tela de Usuários
- lista de usuários
- nome, email, tipo (admin, usuário, etc.)
- ações:
  - editar
  - remover

5.7 Tela de Calendário
- visualização em formato de calendário
- exibir reservas por data
- navegação entre dias/semanas
- layout limpo e funcional

5.8 Tela de Configurações
- dados do usuário (perfil)
- dados da instituição
- possibilidade de edição
- layout organizado em seções

--------------------------------------------------
6. MELHORAR ESTRUTURA DO CÓDIGO
--------------------------------------------------

- manter separação por componentes
- criar componentes reutilizáveis
- organizar melhor pastas se necessário
- evitar duplicação de código

--------------------------------------------------
7. LIMPEZA DO PROJETO (IMPORTANTE)
--------------------------------------------------

O package.json contém dependências que não estão sendo utilizadas.

Fazer:
- identificar dependências não utilizadas
- remover dependências desnecessárias
- manter apenas o que está sendo usado
- garantir que o projeto continue funcionando normalmente

--------------------------------------------------
RESULTADO ESPERADO
--------------------------------------------------

Quero um sistema mais completo, com:
- navegação funcional
- telas principais implementadas
- design consistente
- identidade visual forte (branco + azul)
- base preparada para dark mode
- código limpo e organizado

O resultado deve parecer um sistema SaaS real, pronto para integração com backend.