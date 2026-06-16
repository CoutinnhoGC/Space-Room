# SpaceRoom

Plataforma de gestão de espaços e reservas para instituições de ensino, empresas e operações multiunidade.

## Visão geral

O projeto está dividido em duas aplicações:

- `Space-Room`: frontend React + Vite
- `Space-Room-APP`: backend Spring Boot + PostgreSQL

## Funcionalidades atuais

- autenticação com JWT
- senhas com BCrypt
- gestão de instituições, usuários, espaços e reservas
- subespaços e bloqueio hierárquico entre pai/filhos
- RBAC com permissões persistidas em `cargo_permissao` e sobrescritas em `usuario_permissao`
- reservas com fluxo opcional de aprovação por espaço
- base inicial para SaaS com planos, módulos e multiunidade

## Evoluções estratégicas já preparadas

- catálogo ampliado de permissões:
  - `GERENCIAR_INSTITUICOES`
  - `GERENCIAR_USUARIOS`
  - `GERENCIAR_ESPACOS`
  - `RESERVAR_ESPACO`
  - `APROVAR_RESERVAS`
  - `GERENCIAR_COMUNICADOS`
  - `VISUALIZAR_AUDITORIA`
  - `GERENCIAR_PLANOS`
- espaços com:
  - `codigoUnidade`
  - `exigeAprovacao`
  - `idResponsavelEspaco`
- reservas com metadados de aprovação:
  - `observacaoAprovacao`
  - `aprovadaPorUsuarioId`
  - `aprovadaEm`
- planos com flags para:
  - multiunidade
  - workflow de aprovação
  - auditoria avançada
  - módulos habilitados

## Banco de dados

O backend está com `spring.jpa.hibernate.ddl-auto=update`, então em ambiente local o Hibernate tende a criar as novas colunas automaticamente.

Para produção, há um script dedicado em `SQLs/spaceroom_v2_2_rbac_aprovacao_saas.sql`.

## Desenvolvimento

### Frontend

```bash
cd Space-Room
pnpm install
pnpm dev
```

### Backend

```bash
cd Space-Room-APP
./mvnw spring-boot:run
```

## Próximos passos recomendados

- criar UI dedicada para administração de permissões por cargo
- expor endpoints de auditoria
- separar aprovação, cancelamento e reprovação em estados próprios
- aplicar feature flags de plano na experiência do frontend
