# SpaceRoom - RBAC, cargos e governanca

## Vulnerabilidades corrigidas

- Escalonamento de privilegios: usuarios institucionais podiam tentar criar ou editar usuarios com cargo de Administrador da Plataforma.
- Ausencia de barreira forte para gerenciamento de cargos de sistema.
- Cargos globais apareciam em seletores institucionais sem considerar escopo, tipo de instituicao ou natureza de sistema.

## Arquitetura de permissao

O SpaceRoom usa RBAC baseado em permissoes efetivas vindas do backend. O frontend apenas reflete e previne operacoes indevidas; a autorizacao critica deve permanecer no servidor.

Permissoes base:

- `GERENCIAR_INSTITUICOES`
- `GERENCIAR_USUARIOS`
- `GERENCIAR_ESPACOS`
- `RESERVAR_ESPACO`
- `APROVAR_RESERVAS`
- `GERENCIAR_COMUNICADOS`
- `VISUALIZAR_AUDITORIA`
- `GERENCIAR_PLANOS`

## Hierarquia de cargos

Administrador da Plataforma:

- Cargo de sistema.
- Escopo global.
- Pode gerenciar instituicoes, usuarios, espacos, planos, auditoria e configuracoes globais.
- Somente outro Administrador da Plataforma pode criar, alterar ou remover este cargo/usuarios com este poder.

Administrador da Instituicao:

- Escopo limitado a propria instituicao.
- Pode gerenciar usuarios, espacos, reservas e configuracoes institucionais.
- Nao pode visualizar outras instituicoes, alterar planos globais ou criar administradores da plataforma.

## Cargos padrao por segmento

- Ensino: Diretor, Vice-diretor, Coordenador, Professor, Aluno.
- Empresas: CEO, Diretor, Gerente, Supervisor, Colaborador.
- Laboratorios ou segmentos tecnicos: Coordenador, Pesquisador, Tecnico.
- Coworkings: Gestor, Recepcionista, Membro.

## Cargos personalizados

O modelo de `cargo` foi preparado com os campos:

- `idInstituicao`: restringe cargo a uma instituicao.
- `tipoInstituicao`: restringe cargo a um segmento.
- `sistema`: protege cargos estruturais.
- `personalizado`: identifica cargos configuraveis pela instituicao.

Esses campos permitem criar cargos como Lider de Projeto, Analista de Seguranca, Coordenador Operacional e Supervisor de Laboratorio sem alterar codigo.

## Reservas e aprovacao

- Espacos podem exigir aprovacao.
- Reservas podem ficar pendentes ate aprovacao.
- A aprovacao deve ser feita por usuarios com `APROVAR_RESERVAS` ou responsaveis configurados para o espaco.
- A arquitetura ja separa `RESERVAR_ESPACO` de `APROVAR_RESERVAS`.

## Responsaveis por espaco

Cada espaco pode evoluir para um ou mais responsaveis. A regra recomendada e:

- Responsavel do espaco pode aprovar reservas daquele espaco.
- Administrador da Instituicao pode aprovar reservas da propria instituicao.
- Administrador da Plataforma pode aprovar em qualquer instituicao quando necessario.

## Auditoria

Eventos esperados:

- Usuarios: criado, editado, removido, cargo alterado.
- Espacos: criado, editado, removido.
- Reservas: criada, aprovada, rejeitada, cancelada, editada.
- Seguranca: login, falha de login, logout, troca de senha, alteracao de permissoes.

Cada evento deve registrar:

- Usuario.
- Data/hora.
- Acao.
- Recurso afetado.

## Impactos

Seguranca:

- A promocao indevida para administrador global passa a ser bloqueada no backend.
- Usuarios institucionais ficam limitados a propria instituicao.
- Cargos de sistema passam a ter protecao explicita.

Escalabilidade:

- Cargos podem ser segmentados por tipo de organizacao.
- Cargos personalizados podem ser vinculados a instituicoes.
- A matriz de permissoes permite crescer para novos modulos sem depender de nomes fixos de cargo.

## Decisoes tecnicas

- O backend e a fonte final da autorizacao.
- O frontend filtra opcoes por usabilidade e reducao de erro, mas nao substitui validacao de servidor.
- O cargo Administrador da Plataforma e identificado por permissao global, nao apenas por nome.
- A landing publica fica em `/plataforma`; o primeiro acesso na tela de login orienta o usuario a procurar o administrador institucional.
