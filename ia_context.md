### coApresentação do projeto completo:

A partir da raiz do projeto você pode ver outras duas pastas contendo o resto do projeto.
Ele foi dividido seguindo a seguinte estrutura:
useayni-backend - Toda a logica de acesso, rotas...
useayni-frontend - plataforma web, disponivel para toda a hierarquia do projeto, cadastro de membros, cadastro de misselaneas, organização completa.
useayni-mobile - App dispoviel pro membro, apenas para receber notificações, acompanhar projetos inscritos, se atrelar a atividades...

Hoje iremos implementar isso: - Não esta separado em cada frente, back, front, mobile... você deve montar um plano de ação de como implementar cada coisa, que tela, que componente, deve ser criado, como devem funcionar, quais rotas devem ser criadas, em qual local...

<html>
<body>
<!--StartFragment--><h1 class="text-text-100 mt-3 -mb-1 text-[1.375rem] font-bold">🗂️ ÉPICO — Núcleo das Miscelâneas | UseAyni</h1>
<blockquote class="ml-2 border-l-4 border-border-300/10 pl-4 text-text-300">
<p class="font-claude-response-body break-words whitespace-normal leading-[1.7]"><strong>Versão:</strong> 1.0<br>
<strong>Data:</strong> Maio/2026<br>
<strong>Status:</strong> Em refinamento<br>
<strong>Time responsável:</strong> Backend · Frontend · UX/UI</p>
</blockquote>
<hr class="border-border-200 border-t-0.5 my-3 mx-1.5">
<h2 class="text-text-100 mt-3 -mb-1 text-[1.125rem] font-bold">📌 Visão Geral do Épico</h2>
<p class="font-claude-response-body break-words whitespace-normal leading-[1.7]">UseAyni é uma plataforma de organização acadêmica baseada em <strong>Miscelâneas</strong>: entidades organizacionais que agrupam pessoas, ações, metas e eventos dentro de uma hierarquia controlada de acesso e visibilidade.</p>
<p class="font-claude-response-body break-words whitespace-normal leading-[1.7]">Uma <strong>Miscelânea</strong> pode ser de 6 tipos: <strong>Projeto</strong>, <strong>Evento</strong>, <strong>Meta</strong>, <strong>Reunião</strong>, <strong>Atividade</strong> e <strong>Formulário/Votação</strong>. Cada tipo tem comportamentos específicos, mas compartilha a mesma entidade base — com suporte a aninhamento, controle de acesso, inscrições, convites, presença e publicação pública.</p>
<hr class="border-border-200 border-t-0.5 my-3 mx-1.5">
<h2 class="text-text-100 mt-3 -mb-1 text-[1.125rem] font-bold">🏗️ Regras Estruturais Globais (válidas para todas as US)</h2>
<h3 class="text-text-100 mt-2 -mb-1 text-base font-bold">Hierarquia de Membros</h3>
<div class="overflow-x-auto w-full px-2 mb-6">

| Nível | Papel            | Escopo de Gestão                                                                                       |
| ----- | ---------------- | ------------------------------------------------------------------------------------------------------ |
| 1     | Equipe Técnica   | Total — gerencia tudo de todos                                                                         |
| 2     | CAE              | Um estado inteiro (ex: Paraná)                                                                         |
| 3     | CAR              | N cursos/universidades de uma região                                                                   |
| 4     | Dirigente        | Um curso de uma universidade                                                                           |
| 5     | Representante    | Um semestre do seu curso                                                                               |
| 6     | Membro / Egresso | Consumidor — pode criar para si e grupos selecionados                                                  |
| 7     | Externo          | Consumidor - Apenas consome conteúdos exposto a comunidade externa (Eventos, formulários, reuniões...) |

`</div>`

<h3 class="text-text-100 mt-2 -mb-1 text-base font-bold">Regra de Aprovação por Escopo</h3>
<ul class="[li_&]:mb-0 [li_&]:mt-1 [li_&]:gap-1 [&:not(:last-child)_ul]:pb-1 [&:not(:last-child)_ol]:pb-1 list-disc flex flex-col gap-1 pl-8 mb-3">
<li class="font-claude-response-body whitespace-normal break-words pl-2">Quando uma miscelânea é criada <strong>para um público maior que o nível do criador</strong>, ela entra em estado <code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">pendente</code> e precisa ser aprovada pelo gestor do nível de destino.</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2">Criações dentro do próprio nível ou para seleção individual de membros (sem escopo hierárquico) <strong>não exigem aprovação de gestão</strong>.</li>
</ul>
<h3 class="text-text-100 mt-2 -mb-1 text-base font-bold">Regra de Aninhamento</h3>
<div role="group" aria-label="Código" tabindex="0" class="relative group/copy bg-bg-000/50 border-0.5 border-border-400 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-100"><div class="sticky opacity-0 group-hover/copy:opacity-100 group-focus-within/copy:opacity-100 top-2 py-2 h-12 w-0 float-right"><div class="absolute right-0 h-8 px-2 items-center inline-flex z-10"><button class="inline-flex
  items-center
  justify-center
  relative
  isolate
  shrink-0
  can-focus
  select-none
  disabled:pointer-events-none
  disabled:opacity-50
  disabled:shadow-none
  disabled:drop-shadow-none border-transparent
          transition
          font-base
          duration-300
          ease-[cubic-bezier(0.165,0.85,0.45,1)] h-8 w-8 rounded-md backdrop-blur-md _fill_10ocf_9 _ghost_10ocf_96" type="button" aria-label="Copiar para a área de transferência" data-state="closed"><div class="relative"><div class="transition-all opacity-100 scale-100" style="width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;"><svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="transition-all opacity-100 scale-100" aria-hidden="true" style="flex-shrink: 0;"><path d="M12.5 3A1.5 1.5 0 0 1 14 4.5V6h1.5A1.5 1.5 0 0 1 17 7.5v8a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 6 15.5V14H4.5A1.5 1.5 0 0 1 3 12.5v-8A1.5 1.5 0 0 1 4.5 3zm1.5 9.5a1.5 1.5 0 0 1-1.5 1.5H7v1.5a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5H14zM4.5 4a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5z"></path></svg></div><div class="absolute inset-0 flex items-center justify-center"><div class="transition-all opacity-0 scale-50" style="width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;"><svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="transition-all opacity-0 scale-50" aria-hidden="true" style="flex-shrink: 0;"><path d="M15.188 5.11a.5.5 0 0 1 .752.626l-.056.084-7.5 9a.5.5 0 0 1-.738.033l-3.5-3.5-.064-.078a.501.501 0 0 1 .693-.693l.078.064 3.113 3.113 7.15-8.58z"></path></svg></div></div></div></button></div></div><div class="overflow-x-auto"><pre class="code-block__code !my-0 !rounded-lg !text-sm !leading-relaxed p-3.5" style="color: rgb(234, 236, 240); background: transparent; font-family: var(--font-mono);"><code style="color: rgb(234, 236, 240); background: transparent; font-family: var(--font-mono); white-space: pre-wrap;"><span><span>Projeto
</span></span><span>  └── Evento, Meta, Reunião, Atividade
</span><span>
</span><span>Evento
</span><span>  └── Atividade, Meta, Reunião
</span><span>
</span><span>Reunião
</span><span>  └── Atividade, Meta
</span><span>
</span><span>Atividade
</span><span>  └── Sub-Atividades (futuro)
</span><span>
</span><span>Formulário / Votação
</span><span>  └── Pode existir sozinho ou vinculado a qualquer miscelânea pai</span></code></pre></div></div>
<h3 class="text-text-100 mt-2 -mb-1 text-base font-bold">Regra de Visibilidade Herdada</h3>
<ul class="[li_&]:mb-0 [li_&]:mt-1 [li_&]:gap-1 [&:not(:last-child)_ul]:pb-1 [&:not(:last-child)_ol]:pb-1 list-disc flex flex-col gap-1 pl-8 mb-3">
<li class="font-claude-response-body whitespace-normal break-words pl-2">Se o <strong>pai é privado</strong>, o filho nasce dentro do mesmo perímetro de acesso do pai.</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2">O filho pode ser <strong>mais restrito</strong> que o pai, nunca mais aberto.</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2">Se o <strong>pai é público</strong>, o filho pode ser público ou privado.</li></ul><!--EndFragment-->
</body>
</html

### Regra de Aprovação por Escopo

- Quando uma miscelânea é criada **para um público maior que o nível do criador**, ela entra em estado `pendente` e precisa ser aprovada pelo gestor do nível de destino.
- Criações dentro do próprio nível ou para seleção individual de membros (sem escopo hierárquico) **não exigem aprovação de gestão**.

### Regra de Aninhamento

### Regra de Visibilidade Herdada

- Se o **pai é privado**, o filho nasce dentro do mesmo perímetro de acesso do pai.
- O filho pode ser **mais restrito** que o pai, nunca mais aberto.
- Se o **pai é público**, o filho pode ser público ou privado.

<html>
<body>
<!--StartFragment-->
<p class="font-claude-response-body break-words whitespace-normal leading-[1.7]"><strong>Contexto</strong>
Todo membro autenticado pode criar uma miscelânea. O tipo determina os campos disponíveis, as regras de aninhamento e o fluxo de aprovação. A criação pode ocorrer de forma independente ou vinculada a uma miscelânea pai.</p>
<p class="font-claude-response-body break-words whitespace-normal leading-[1.7]"><strong>Por que isso é importante</strong>
É a ação central da plataforma. Sem um fluxo de criação claro e validado, toda a organização das ações coletivas fica comprometida.</p>
<p class="font-claude-response-body break-words whitespace-normal leading-[1.7]"><strong>Como deve funcionar</strong></p>
<ol class="[li_&]:mb-0 [li_&]:mt-1 [li_&]:gap-1 [&:not(:last-child)_ul]:pb-1 [&:not(:last-child)_ol]:pb-1 list-decimal flex flex-col gap-1 pl-8 mb-3">
<li class="font-claude-response-body whitespace-normal break-words pl-2">Usuário acessa "Nova Miscelânea".</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2">Seleciona o <strong>tipo</strong> (Projeto, Evento, Meta, Reunião, Atividade, Formulário/Votação).</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2">Preenche os campos obrigatórios do tipo escolhido.</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2">Define <strong>visibilidade</strong> (Público / Privado) e <strong>escopo de público</strong> (Meu nível, CAR, CAE, Geral, ou Seleção individual de membros).</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2">Pode vincular a uma <strong>miscelânea pai</strong> (respeitando regras de aninhamento).</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2">Sistema valida e aplica fluxo de aprovação se necessário.</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2">Miscelânea é criada com status <code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">rascunho</code>, <code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">ativa</code> ou <code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">pendente_aprovação</code>.</li>
</ol>
<p class="font-claude-response-body break-words whitespace-normal leading-[1.7]"><strong>Campos comuns a todos os tipos</strong></p>
<div class="overflow-x-auto w-full px-2 mb-6">

| Campo             | Obrigatório    | Notas                                     |
| ----------------- | -------------- | ----------------------------------------- |
| Título            | ✅             | Máx 120 caracteres                        |
| Descrição         | ✅             | Texto rico                                |
| Data de início    | ✅             | —                                         |
| Data de término   | ✅ para alguns | Opcional em Meta                          |
| Visibilidade      | ✅             | Público / Privado                         |
| Escopo de público | ✅             | Hierárquico ou seleção individual         |
| Donos             | ✅             | N responsáveis                            |
| Membros iniciais  | ❌             | Opcional — pode ser definido depois       |
| Local             | ❌             | Cep, bairro, rua, numero, cidade, estado. |
| Foto de capa      | ❌             | Upload de imagem                          |
| Foto do banner    | ❌             | Upload de imagem                          |
| Miscelânea pai    | ❌             | Vínculo respeitando regras de aninhamento |

</div>
<p class="font-claude-response-body break-words whitespace-normal leading-[1.7]"><strong>Regras de Negócio</strong></p>
<ul class="[li_&]:mb-0 [li_&]:mt-1 [li_&]:gap-1 [&:not(:last-child)_ul]:pb-1 [&:not(:last-child)_ol]:pb-1 list-disc flex flex-col gap-1 pl-8 mb-3">
<li class="font-claude-response-body whitespace-normal break-words pl-2">RN-001: O criador torna-se automaticamente dono da miscelânea.</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2">RN-002: Se o escopo de público for maior que o nível do criador → status <code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">pendente_aprovação</code>, notificação enviada ao gestor do nível.</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2">RN-003: Miscelâneas de seleção individual (N membros escolhidos manualmente) não precisam de aprovação de gestão, apenas aceite dos convidados.</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2">RN-004: Uma miscelânea filho não pode ter escopo mais amplo que o pai.</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2">RN-005: O tipo do filho deve respeitar a tabela de aninhamento.</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2">RN-006: Formulário pode ser criado vinculado a qualquer tipo de miscelânea ou de forma independente.</li>
</ul>
<p class="font-claude-response-body break-words whitespace-normal leading-[1.7]"><strong>Critérios de Aceite</strong></p>
<ul class="contains-task-list">
<li class="task-list-item"><input disabled="" type="checkbox"> Formulário de criação exibe apenas os campos válidos para o tipo selecionado.</li>
<li class="task-list-item"><input disabled="" type="checkbox"> Ao selecionar miscelânea pai, o sistema valida a compatibilidade de tipo.</li>
<li class="task-list-item"><input disabled="" type="checkbox"> Criação com escopo maior que o nível do criador gera status <code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">pendente_aprovação</code>.</li>
<li class="task-list-item"><input disabled="" type="checkbox"> Criação para seleção individual envia convites e fica aguardando aceite.</li>
<li class="task-list-item"><input disabled="" type="checkbox"> Criador recebe notificação de confirmação ou informação de que está pendente.</li>
<li class="task-list-item"><input disabled="" type="checkbox"> Miscelânea só aparece publicamente após status <code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">ativa</code>.</li>
</ul>
<p class="font-claude-response-body break-words whitespace-normal leading-[1.7]"><strong>Backend deve fazer</strong></p>
<ul class="[li_&]:mb-0 [li_&]:mt-1 [li_&]:gap-1 [&:not(:last-child)_ul]:pb-1 [&:not(:last-child)_ol]:pb-1 list-disc flex flex-col gap-1 pl-8 mb-3">
<li class="font-claude-response-body whitespace-normal break-words pl-2">Endpoint <code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">POST /miscellaneous</code> com validação de tipo, campos, escopo e aninhamento.</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2">Lógica de determinação automática do status com base no escopo e nível do criador.</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2">Registro em <code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">miscellaneous_owners</code> com o criador como dono principal.</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2">Disparo de notificações: para gestores (aprovação) ou para membros (convite).</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2">Seed de enums: <code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">type</code>, <code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">visibility</code>, <code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">status</code>, <code class="bg-text-200/5 border border-0.5 border-border-300 text-danger-000 whitespace-pre-wrap rounded-[0.4rem] px-1 py-px text-[0.9rem]">scope</code>.</li>
</ul>
<p class="font-claude-response-body break-words whitespace-normal leading-[1.7]"><strong>Frontend deve fazer</strong></p>
<ul class="[li_&]:mb-0 [li_&]:mt-1 [li_&]:gap-1 [&:not(:last-child)_ul]:pb-1 [&:not(:last-child)_ol]:pb-1 list-disc flex flex-col gap-1 pl-8 mb-3">
<li class="font-claude-response-body whitespace-normal break-words pl-2">Stepper de criação com etapas: Tipo → Informações Básicas → Visibilidade & Público → Donos & Membros → Revisão.</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2">Renderização condicional de campos por tipo.</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2">Seletor de miscelânea pai filtrado por tipos permitidos.</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2">Feedback visual do status resultante antes de confirmar.</li>
<li class="font-claude-response-body whitespace-normal break-words pl-2">Validações em tempo real (datas, limite de caracteres, tipo filho).</li>
</ul>
<p class="font-claude-response-body break-words whitespace-normal leading-[1.7]"><strong>UX/UI — Telas a rascunhar</strong></p>
<ul class="contains-task-list">
<li class="task-list-item"><input disabled="" type="checkbox"> Tela de seleção de tipo (cards visuais para cada tipo com breve descrição)</li>
<li class="task-list-item"><input disabled="" type="checkbox"> Formulário multi-etapa de criação</li>
<li class="task-list-item"><input disabled="" type="checkbox"> Modal de confirmação com resumo e status esperado</li>
<li class="task-list-item"><input disabled="" type="checkbox"> Estado vazio com CTA "Criar primeira miscelânea"</li></ul><!--EndFragment-->
</body>
</html>

**Regras de Negócio**

- RN-001: O criador torna-se automaticamente dono da miscelânea.
- RN-002: Se o escopo de público for maior que o nível do criador → status `pendente_aprovação`, notificação enviada ao gestor do nível.
- RN-003: Miscelâneas de seleção individual (N membros escolhidos manualmente) não precisam de aprovação de gestão, apenas aceite dos convidados.
- RN-004: Uma miscelânea filho não pode ter escopo mais amplo que o pai.
- RN-005: O tipo do filho deve respeitar a tabela de aninhamento.
- RN-006: Formulário pode ser criado vinculado a qualquer tipo de miscelânea ou de forma independente.

**Critérios de Aceite**

- [ ] Formulário de criação exibe apenas os campos válidos para o tipo selecionado.
- [ ] Ao selecionar miscelânea pai, o sistema valida a compatibilidade de tipo.
- [ ] Criação com escopo maior que o nível do criador gera status `pendente_aprovação`.
- [ ] Criação para seleção individual envia convites e fica aguardando aceite.
- [ ] Criador recebe notificação de confirmação ou informação de que está pendente.
- [ ] Miscelânea só aparece publicamente após status `ativa`.

**Backend deve fazer**

- Endpoint `POST /miscellaneous` com validação de tipo, campos, escopo e aninhamento.
- Lógica de determinação automática do status com base no escopo e nível do criador.
- Registro em `miscellaneous_owners` com o criador como dono principal.
- Disparo de notificações: para gestores (aprovação) ou para membros (convite).
- Seed de enums: `type`, `visibility`, `status`, `scope`.

**Frontend deve fazer**

- Stepper de criação com etapas: Tipo → Informações Básicas → Visibilidade & Público → Donos & Membros → Revisão.
- Renderização condicional de campos por tipo.
- Seletor de miscelânea pai filtrado por tipos permitidos.
- Feedback visual do status resultante antes de confirmar.
- Validações em tempo real (datas, limite de caracteres, tipo filho).

### Regra de Aprovação por Escopo

- Quando uma miscelânea é criada **para um público maior que o nível do criador**, ela entra em estado `pendente` e precisa ser aprovada pelo gestor do nível de destino.
- Criações dentro do próprio nível ou para seleção individual de membros (sem escopo hierárquico) **não exigem aprovação de gestão**.

### Regra de Aninhamento

### Regra de Visibilidade Herdada

- Se o **pai é privado**, o filho nasce dentro do mesmo perímetro de acesso do pai.
- O filho pode ser **mais restrito** que o pai, nunca mais aberto.
- Se o **pai é público**, o filho pode ser público ou privado.

### Regra de Aprovação por Escopo

- Quando uma miscelânea é criada **para um público maior que o nível do criador**, ela entra em estado `pendente` e precisa ser aprovada pelo gestor do nível de destino.
- Criações dentro do próprio nível ou para seleção individual de membros (sem escopo hierárquico) **não exigem aprovação de gestão**.

### Regra de Aninhamento

### Regra de Visibilidade Herdada

- Se o **pai é privado**, o filho nasce dentro do mesmo perímetro de acesso do pai.
- O filho pode ser **mais restrito** que o pai, nunca mais aberto.
- Se o **pai é público**, o filho pode ser público ou privado.

### Regra de Aprovação por Escopo

- Quando uma miscelânea é criada **para um público maior que o nível do criador**, ela entra em estado `pendente` e precisa ser aprovada pelo gestor do nível de destino.
- Criações dentro do próprio nível ou para seleção individual de membros (sem escopo hierárquico) **não exigem aprovação de gestão**.

### Regra de Aninhamento

### Regra de Visibilidade Herdada

- Se o **pai é privado**, o filho nasce dentro do mesmo perímetro de acesso do pai.
- O filho pode ser **mais restrito** que o pai, nunca mais aberto.
- Se o **pai é público**, o filho pode ser público ou privado.

# Contexto

Cada tipo de miscelânea possui comportamento e campos específicos além dos campos comuns.

# Por que isso é importante

Sem distinção clara por tipo, o sistema vira um formulário genérico sem semântica.
O tipo carrega intenção e regras de negócio próprias.

# Como deve funcionar

## Projeto

- Funciona como épico/agrupador.
- Pode conter:
  - Evento
  - Meta
  - Reunião
  - Atividade
  - Formulário/Votação
- Campos adicionais:
  - Nenhum além dos comuns.
- Não possui sessão de presença direta (somente via filhos).

---

## Evento

Representa um acontecimento com data/local definidos.

### Pode conter

- Atividade
- Meta
- Reunião
- Formulário/Votação

### Campos adicionais

- Endereço completo e/ou Link de transmissão (opcional)
- Capacidade de público (presencial/online)

### Regras

- Suporta sessão de presença.
- Suporta inscrição de externos com perfil externo.
- Pode ter publicação pública com URL amigável.

---

## Meta

Representa um objetivo mensurável.

### Campos adicionais

- Valor alvo (numérico ou booleano)
- Unidade de medida
- Progresso atual
  - Pode ser atualizado manualmente
  - Pode ser atualizado por atividades filhas

### Regras

- Não possui sessão de presença.
- Não possui inscrição pública.

---

## Reunião

Representa um encontro com pauta.

### Pode conter

- Atividade
- Meta
- Formulário/Votação

### Campos adicionais

- Link de videoconferência (opcional)
- Pauta (texto rico)

### Regras

- Suporta sessão de presença.

---

## Atividade

Equivale a uma subtarefa.

### Regras

- Pode existir independente ou vinculada a qualquer miscelânea pai.
- Suporta checklist interno.
- Pode ter sessão de presença.

### Campos adicionais

- Status de conclusão:
  - Pendente
  - Em andamento
  - Concluída
  - Impedida

- Prioridade:
  - Alta
  - Média
  - Baixa

---

## Formulário / Votação

Sistema completo de coleta de dados.

### Regras

- Tratado separadamente em outra US.
- Pode existir independente ou vinculado.

---

# Regras de Negócio

- **RN-007:** Cada tipo valida seus campos obrigatórios próprios no backend.
- **RN-008:** Tipos que não suportam presença não exibem aba de presença.
- **RN-009:** Evento com publicação pública gera slug único e rota pública.
- **RN-010:** Meta exige ao menos uma unidade de medida definida.

---

# Critérios de Aceite

- Cada tipo renderiza apenas seus campos específicos.
- Backend rejeita campos inválidos para o tipo.
- Evento com visibilidade pública exibe opção de gerar URL pública.
- Meta exibe barra de progresso baseada em valor alvo × atual.
- Atividade exibe campo de status e checklist.

---

# Backend deve fazer

- Criar tabela `miscellaneous` com coluna `type` (`enum`).
- Criar tabelas de atributos estendidos por tipo
  - ou utilizar `JSONB` configurável para campos extras.
- Implementar validação por tipo nos endpoints de criação e edição.

---

# Frontend deve fazer

- Criar componente de formulário por tipo com renderização condicional de campos.
- Criar componente de progresso para `Meta`.
- Criar componente de checklist para `Atividade`.
- Exibir aba de presença condicional por tipo.

---

# Contexto

Miscelâneas podem ser organizadas hierarquicamente.
Uma Atividade pode pertencer a uma Reunião que pertence a um Projeto.

Essa relação define:

- Escopo
- Visibilidade
- Controle de acesso

# Por que isso é importante

Sem o aninhamento, o sistema se torna apenas uma lista plana.

O aninhamento permite:

- Organização de projetos complexos
- Contextualização de atividades
- Herança de permissões
- Navegação hierárquica

# Como deve funcionar

- Durante a criação ou edição, o usuário pode selecionar uma miscelânea pai.
- O sistema filtra automaticamente os pais válidos:
  - Pelo tipo compatível
  - Pelo acesso do usuário
- A miscelânea filha herda o perímetro de acesso do pai:
  - O filho nunca pode ser mais aberto que o pai.
- A tela da miscelânea pai exibe seus filhos:
  - Em árvore
  - Ou agrupados por tipo

---

# Regras de Negócio

- **RN-011:** A tabela de aninhamento é imutável (definida em RN global). Backend rejeita vínculos inválidos.
- **RN-012:** Um filho só pode ser vinculado a um único pai.
- **RN-013:** Desvincular o pai transforma o filho em miscelânea independente, mantendo histórico.
- **RN-014:** Deletar o pai não remove automaticamente os filhos — eles tornam-se órfãos.
- **RN-015:** O filho herda as regras de visibilidade do pai como teto máximo.

---

# Critérios de Aceite

- Seletor de pai filtra por:
  - Tipos compatíveis
  - Acesso do usuário
- Backend rejeita aninhamento inválido com mensagem clara.
- Tela do pai exibe filhos agrupados por tipo.
- Filho órfão aparece na listagem geral sem pai.
- Desvinculação é registrada em log de auditoria.

---

# Backend deve fazer

- Adicionar campo `parentMiscellaneousId` na tabela `miscellaneous`.
- Validar relação pai × filho durante criação e edição.
- Criar endpoint:

```http
GET /miscellaneous/:id/children
```

- Endpoint deve retornar filhos agrupados por tipo.
- Implementar lógica de herança de visibilidade ao salvar filho.
- Soft-delete do pai não deve propagar para os filhos.

# Frontend deve fazer

- Criar seletor de pai:
  - Com busca
  - Com filtro por tipo
- Criar visão:
  - Em árvore ou tabs agrupadas por tipo
  - Exibir indicador visual de relação pai/filho na listagem geral.
- Implementar breadcrumb hierárquico:
  - Projeto > Reunião > Atividade
  - UX/UI — Telas a rascunhar
  - Visão em árvore da miscelânea pai com filhos
  - Breadcrumb de navegação hierárquica
  - Modal de seleção de miscelânea pai
  - Listagem agrupada por tipo

  # Contexto

Toda miscelânea possui:

- N donos
- N membros

Donos possuem permissões de gerenciamento.
Membros participam da miscelânea com permissões limitadas.

Cada papel possui regras e capacidades distintas.

---

# Por que isso é importante

Projetos e eventos colaborativos exigem co-gestão.

Um único dono representa:

- Ponto único de falha
- Risco operacional
- Dependência excessiva

O sistema deve suportar:

- Times de organização
- Delegação de responsabilidades
- Gestão compartilhada

---

# Como deve funcionar

- Durante a criação, o criador define os donos iniciais além de si mesmo.
- Membros podem ser adicionados:
  - Diretamente
  - Via convite
  - Via aprovação de solicitação
- Donos podem:
  - Promover membros para donos
  - Rebaixar donos para membros
  - Remover membros
- Um dono pode sair da miscelânea:
  - Apenas se existir outro dono ativo

---

# Permissões por Papel

| Ação                       | Dono | Membro                      |
| -------------------------- | ---- | --------------------------- |
| Editar miscelânea          | ✅   | ❌                          |
| Adicionar/remover membros  | ✅   | ❌                          |
| Aprovar/negar solicitações | ✅   | ❌                          |
| Fechar inscrições          | ✅   | ❌                          |
| Gerenciar presença         | ✅   | ❌                          |
| Visualizar miscelânea      | ✅   | ✅                          |
| Responder formulários      | ✅   | ✅                          |
| Criar filhos               | ✅   | ✅ (se permitido pelo dono) |

---

# Regras de Negócio

- **RN-016:** Deve existir ao menos um dono ativo a qualquer momento.
- **RN-017:** O criador original não pode ser removido como dono por outros donos.
  - Apenas ele próprio pode sair
  - E somente se houver outro dono ativo
- **RN-018:** Donos são registrados em `miscellaneous_owners` com campo `role` (`owner | co-owner`).
- **RN-019:** Membros são registrados em `miscellaneous_participants`.
- **RN-020:** Remoção de membro gera notificação ao removido.

---

# Critérios de Aceite

- Lista de donos e membros exibida na tela da miscelânea.
- Dono pode adicionar novo dono buscando por usuário.
- Dono pode remover membro com confirmação.
- Sistema impede remoção do último dono.
- Membro removido recebe notificação.
- Permissões respeitadas em todas as ações da interface.

---

# Backend deve fazer

## Estrutura

Criar tabelas:

- `miscellaneous_owners`
- `miscellaneous_participants`

---

## Endpoints

### Adicionar dono

```http
POST /miscellaneous/:id/owners
```

### Remover dono

```http
DELETE /miscellaneous/:id/owners/:userId
```

- Validar existência mínima de 1 dono ativo.

---

### Adicionar membro

```http
POST /miscellaneous/:id/members
```

---

### Remover membro

```http
DELETE /miscellaneous/:id/members/:userId
```

---

## Segurança

Implementar middleware de autorização verificando:

- Papel do usuário
- Permissão da ação
- Regras de ownership

---

# Frontend deve fazer

## Aba "Pessoas"

Criar aba dedicada contendo:

- Lista de donos
- Lista de membros
- Indicadores visuais de papel

---

## Busca de usuários

Implementar buscador para:

- Adicionar donos
- Adicionar membros

---

## Ações por usuário

Criar menu contextual contendo:

- Promover para dono
- Rebaixar para membro
- Remover da miscelânea

---

## Indicadores visuais

Exibir badges:

- `Dono`
- `Co-owner`
- `Membro`

---

# UX/UI — Telas a rascunhar

- Aba "Pessoas" com:
  - Donos
  - Membros

- Modal de busca e adição de usuários
- Menu de ações por usuário:
  - Promover
  - Rebaixar
  - Remover

- Confirmação de remoção de membro
- Indicador visual de permissões

# Contexto

Miscelâneas podem possuir:

- Período de inscrição
- Limite de membros
- Lista de espera

Esses controles são essenciais para:

- Eventos presenciais
- Projetos com vagas limitadas
- Reuniões controladas
- Grupos com capacidade máxima

---

# Por que isso é importante

Sem controle de inscrição, o sistema não suporta cenários reais como:

- Eventos com capacidade física
- Times limitados
- Projetos com cotas
- Reuniões privadas com número máximo de participantes

O gerenciamento de vagas permite:

- Controle operacional
- Melhor experiência para participantes
- Organização previsível
- Gestão de demanda

---

# Como deve funcionar

Ao criar ou editar uma miscelânea, o dono pode definir:

- Data de início das inscrições
- Data de término das inscrições
- Limite de membros
  - Ou "sem limite"
- Se a lista de espera está habilitada
- Mensagem automática para não selecionados

---

## Fluxo de inscrição

- Enquanto houver vagas:
  - Usuários entram diretamente como participantes.
- Ao atingir o limite:
  - Usuários entram na lista de espera
  - Caso a lista esteja habilitada
- Se a lista de espera estiver desabilitada:
  - O sistema informa que as vagas estão esgotadas

---

## Gerenciamento manual

O dono pode:

- Fechar inscrições manualmente
- Reabrir inscrições
- Promover usuários da lista de espera para participantes

---

# Regras de Negócio

- **RN-021:** Inscrições fecham automaticamente ao atingir o limite, caso não exista lista de espera.
- **RN-022:** Inscrições fecham automaticamente ao atingir a data de término.
- **RN-023:** Dono pode reabrir inscrições manualmente se a data ainda permitir.
- **RN-024:** Ao aceitar alguém da lista de espera, o sistema notifica o usuário.
- **RN-025:** Mensagem automática de rejeição é enviada ao fechar inscrições com usuários em espera.
- **RN-026:** Lista de espera possui posição ordenada por data de entrada.

---

# Critérios de Aceite

- Campos de inscrição aparecem na criação/edição da miscelânea.
- Contador de vagas em tempo real visível para donos.
- Usuário na lista de espera visualiza sua posição.
- Dono recebe alerta quando vagas estiverem próximas do limite:
  - Exemplo: 90% da capacidade
- Botão "Fechar inscrições" disponível a qualquer momento.
- Mensagens automáticas são disparadas corretamente.

---

# Backend deve fazer

## Estrutura

Adicionar campos na tabela `miscellaneous`:

```sql
registrationStartDate TIMESTAMP NULL,
registrationEndDate TIMESTAMP NULL,
maxMembers INTEGER NULL,
waitlistEnabled BOOLEAN DEFAULT FALSE,
waitlistMessage TEXT NULL
```

---

## Lista de espera

Criar tabela:

```sql id="waitlisttable"
miscellaneous_waitlist
```

### Campos mínimos

- `id`
- `miscellaneousId`
- `userId`
- `position`
- `status`
- `createdAt`

---

## Automação

Implementar job agendado para:

- Fechar inscrições por data
- Fechar inscrições por limite atingido

---

## Endpoints

### Promover usuário da fila

```http
POST /miscellaneous/:id/waitlist/promote/:userId
```

---

### Fechar inscrições manualmente

```http id="closeendpoint"
POST /miscellaneous/:id/registrations/close
```

---

## Regras adicionais

- Recalcular posições da fila automaticamente.
- Disparar notificações ao:
  - Entrar na fila
  - Ser promovido
  - Ser rejeitado

---

# Frontend deve fazer

## Formulário

Criar seção "Inscrições" contendo:

- Datas de inscrição
- Limite de vagas
- Controle de lista de espera
- Mensagem automática

---

## Tela da miscelânea

Exibir:

- Contador de vagas
- Status das inscrições
- Banner de encerramento
- Estado da fila de espera

---

## Lista de espera

Criar aba exclusiva para donos contendo:

- Lista ordenada
- Posição
- Data de entrada
- Ações de promoção

---

## Visão do usuário

Usuário em espera deve visualizar:

- Sua posição atual
- Status da inscrição
- Mensagens automáticas

---

# UX/UI — Telas a rascunhar

- Seção de configuração de inscrições no formulário
- Painel de lista de espera (visão do dono)
- Banner de status:
  - Aberto
  - Encerrado
  - Lista de espera ativa

- Indicador de posição na fila (visão do membro)
- Contador visual de vagas restantes

# Contexto

Miscelâneas privadas exigem que interessados submetam uma solicitação para participar.

O fluxo funciona como aprovação controlada de entrada:

1. Usuário solicita acesso
2. Dono analisa
3. Dono aprova ou rejeita
4. Usuário recebe retorno

---

# Por que isso é importante

Projetos internos, grupos fechados e comissões exigem controle explícito sobre quem pode participar.

Esse mecanismo permite:

- Curadoria de participantes
- Controle organizacional
- Segurança de acesso
- Processo formal de entrada

---

# Como deve funcionar

## Fluxo do usuário

- Usuário acessa uma miscelânea privada.
- Pode visualizar:
  - Título
  - Descrição pública
- Usuário clica em:

```text
Solicitar participação
```

---

## Formulário de solicitação

Usuário preenche:

- Título da solicitação
- Texto de justificativa

---

## Fluxo do dono

- Solicitação entra na fila de análise.
- Dono visualiza lista de solicitações pendentes.
- Dono pode:
  - Aprovar
  - Negar

- Pode adicionar mensagem opcional de retorno.

---

## Resultado

Usuário recebe notificação:

- Aprovação
- Negação
- Expiração

---

# Regras de Negócio

- **RN-027:** Usuário não pode possuir mais de uma solicitação ativa por miscelânea.
- **RN-028:** Solicitação negada pode ser reenviada após 7 dias (configurável).
- **RN-029:** Aprovação transforma automaticamente a solicitação em participação.
- **RN-030:** Solicitações expiram automaticamente após 30 dias sem análise (configurável).
- **RN-031:** Donos recebem notificação a cada nova solicitação.
- **RN-032:** Solicitações não são aceitas se as inscrições estiverem fechadas.

---

# Critérios de Aceite

- Botão "Solicitar participação" visível para não membros.
- Formulário contendo:
  - Título
  - Texto

- Lista de solicitações pendentes visível para donos.
- Dono pode aprovar ou negar com mensagem opcional.
- Usuário recebe notificação do resultado.
- Solicitação duplicada bloqueada com mensagem clara.

---

# Backend deve fazer

## Estrutura

Criar tabela:

```sql
miscellaneous_requests
```

### Campos mínimos

```sql id="requestfields"
status ENUM(
  'pending',
  'approved',
  'rejected',
  'expired'
)
```

Campos sugeridos:

- `id`
- `miscellaneousId`
- `userId`
- `title`
- `message`
- `responseMessage`
- `status`
- `createdAt`
- `reviewedAt`
- `expiresAt`

---

## Endpoints

### Criar solicitação

```http id="reqcreate"
POST /miscellaneous/:id/requests
```

---

### Listar solicitações

```http id="reqget"
GET /miscellaneous/:id/requests
```

- Endpoint paginado
- Restrito aos donos

---

### Aprovar/Rejeitar

```http id="reqpatch"
PATCH /miscellaneous/:id/requests/:requestId
```

---

## Automações

Implementar job para:

- Expiração automática de solicitações antigas
- Disparo de notificações

---

## Validações

- Bloquear duplicidade de solicitação ativa.
- Validar status de inscrições antes de aceitar envio.
- Validar permissões do dono antes da análise.

---

# Frontend deve fazer

## Tela da miscelânea

Exibir botão:

```text id="joinbutton"
Solicitar participação
```

Apenas para:

- Não membros
- Miscelâneas privadas
- Inscrições abertas

---

## Modal de solicitação

Criar modal contendo:

- Campo de título
- Campo de justificativa
- Botão de envio

---

## Painel do dono

Criar tela de gerenciamento contendo:

- Lista de solicitações
- Status
- Usuário solicitante
- Data
- Ações rápidas

---

## Status do solicitante

Usuário deve visualizar:

- Solicitação pendente
- Aprovada
- Negada
- Expirada

Diretamente na tela da miscelânea.

---

## Notificações

Implementar:

- Notificação in-app
- Notificação por e-mail

Para:

- Nova solicitação
- Aprovação
- Negação
- Expiração

---

# UX/UI — Telas a rascunhar

- Modal de submissão de solicitação
- Painel de gestão de solicitações
  - Filtros:
    - Pendentes
    - Aprovadas
    - Negadas
    - Expiradas

- Estado visual da solicitação na tela da miscelânea
- Badge/status de participação
- Tela de resposta do dono

# Contexto

Donos podem convidar usuários específicos para participar de uma miscelânea, independentemente dela ser:

- Pública
- Privada

Convites individuais não exigem aprovação hierárquica.

---

# Por que isso é importante

Esse mecanismo permite criação rápida de grupos ad hoc, como:

- Reuniões rápidas
- Eventos pequenos
- Times temporários
- Colaboração entre usuários de diferentes estruturas

Exemplo:

```text
Reunião com 5 amigos de 5 CARs diferentes
```

Sem necessidade de burocracia ou aprovação organizacional.

---

# Como deve funcionar

## Fluxo do dono

- Dono busca usuário:
  - Pelo nome
  - Ou pelo e-mail

- Dono envia convite:
  - Com mensagem opcional

---

## Fluxo do convidado

- Usuário recebe:
  - Notificação in-app
  - E-mail

- Usuário pode:
  - Aceitar
  - Recusar

---

## Resultado

- Ao aceitar:
  - Usuário torna-se membro automaticamente

- Ao recusar:
  - Convite é encerrado

---

## Expiração

- Convites possuem prazo de validade.
- Convites expirados não podem ser aceitos.

---

# Regras de Negócio

- **RN-033:** Convite individual não exige aprovação de gestão hierárquica.
- **RN-034:** Convite pendente bloqueia novo convite para o mesmo usuário na mesma miscelânea.
- **RN-035:** Convite expira após 7 dias sem resposta (configurável).
- **RN-036:** Usuário pode recusar convite com ou sem justificativa.
- **RN-037:** Dono pode cancelar convite pendente.
- **RN-038:** Ao aceitar, usuário entra diretamente como membro:
  - Exceto se o limite de vagas tiver sido atingido

---

# Critérios de Aceite

- Dono pode buscar e convidar usuário da plataforma.
- Usuário recebe convite:
  - In-app
  - Por e-mail

- Aceite transforma usuário em membro imediatamente.
- Recusa encerra convite sem ação adicional.
- Dono visualiza convites pendentes e pode cancelá-los.
- Convites expirados aparecem como:

```text
Expirado
```

---

# Backend deve fazer

## Estrutura

Criar tabela:

```sql id="invite_table"
miscellaneous_invites
```

---

## Status do convite

```sql id="invite_status"
status ENUM(
  'pending',
  'accepted',
  'rejected',
  'cancelled',
  'expired'
)
```

---

## Campos sugeridos

- `id`
- `miscellaneousId`
- `invitedByUserId`
- `invitedUserId`
- `message`
- `status`
- `rejectionReason`
- `expiresAt`
- `respondedAt`
- `createdAt`

---

## Endpoints

### Enviar convite

```http id="invite_create"
POST /miscellaneous/:id/invites
```

---

### Aceitar convite

```http id="invite_accept"
PATCH /miscellaneous/:id/invites/:inviteId/accept
```

---

### Recusar convite

```http id="invite_reject"
PATCH /miscellaneous/:id/invites/:inviteId/reject
```

---

### Cancelar convite

```http id="invite_cancel"
DELETE /miscellaneous/:id/invites/:inviteId
```

- Apenas donos podem cancelar.

---

## Jobs automáticos

Implementar job para:

- Expiração automática de convites
- Disparo de notificações

---

## Validações

- Bloquear convites duplicados ativos.
- Validar permissões do dono.
- Validar disponibilidade de vagas.
- Validar expiração antes do aceite.

---

# Frontend deve fazer

## Aba Pessoas

Adicionar botão:

```text id="invite_button"
Convidar membros
```

---

## Modal de convite

Criar modal contendo:

- Busca de usuário
- Campo de mensagem opcional
- Botão de envio

---

## Lista de convites

Criar lista de convites pendentes contendo:

- Usuário convidado
- Status
- Data de expiração
- Ação de cancelar

---

## Central do usuário

Criar central de convites recebidos contendo:

- Convites pendentes
- Histórico
- Status
- Ações rápidas

---

## Ações rápidas

Permitir:

- Aceitar com 1 clique
- Recusar com 1 clique

Diretamente pela notificação.

---

# UX/UI — Telas a rascunhar

- Modal de envio de convite
- Lista de convites pendentes (visão do dono)
- Central de convites recebidos (visão do convidado)
- Card de convite:
  - Aceitar
  - Recusar

- Badge/status de convite:
  - Pendente
  - Aceito
  - Recusado
  - Expirado

  ## Contexto

O sistema de formulários permite criar desde pesquisas simples até votações complexas com:

- Controle de anonimato
- Limite de respostas
- Configuração de acesso
- Publicação pública
- Vínculo com miscelâneas

Os formulários podem ser:

- Independentes
- Vinculados a uma miscelânea

---

## Por que isso é importante

Formulários são essenciais para:

- Assembleias
- Pesquisas de satisfação
- Inscrições em eventos
- Processos seletivos
- Votações coletivas
- Coleta estruturada de dados

---

## Como deve funcionar

### Fluxo de criação

O criador:

1. Cria o formulário
2. Adiciona perguntas
3. Configura regras de acesso
4. Define regras de resposta
5. Publica o formulário

---

### Fluxo de resposta

Usuários autorizados:

- Membros
- Usuários autenticados
- Externos

Respondem conforme permissões definidas.

---

### Fluxo de resultados

O dono acessa:

- Painel de respostas
- Estatísticas
- Gráficos
- Exportação de dados

---

## Tipos de Perguntas

| Tipo              | Descrição          |
| ----------------- | ------------------ |
| Texto aberto      | Resposta livre     |
| Texto longo       | Caixa expandida    |
| Seleção única     | Radio button       |
| Seleção múltipla  | Checkbox           |
| Select / Dropdown | Lista suspensa     |
| Escala (1 a N)    | Avaliação numérica |
| Data              | Seleção de data    |
| Sim / Não         | Booleano           |

---

## Configurações do Formulário

| Configuração                | Opções                         |
| --------------------------- | ------------------------------ |
| Resposta anônima            | Sim / Não                      |
| Identificação               | Membro / Autenticado / Externo |
| Limite por membro           | 1 / N / Ilimitado              |
| Período de resposta         | Data início e fim              |
| Visibilidade dos resultados | Dono / Membros / Público       |
| Miscelânea vinculada        | Opcional                       |

---

## Regras de Negócio

- RN-039: Perguntas têm posição ordinal e podem ser reordenadas
- RN-040: Perguntas fechadas exigem ao menos 2 opções
- RN-041: Formulário anônimo não registra userId
- RN-042: Formulário encerrado não aceita respostas
- RN-043: Resultados públicos podem ter URL pública
- RN-044: Formulário vinculado herda regras da miscelânea

---

## Critérios de Aceite

- Builder com drag-and-drop
- Renderização correta dos tipos
- Limite de respostas respeitado
- Anonimato funcionando corretamente
- Painel de resultados com gráficos
- Mensagem de encerramento funcionando

---

## Backend deve fazer

### Tabelas

- forms
- form_questions
- form_options
- form_responses
- form_answers

---

### forms

- id
- title
- description
- anonymous
- responseLimitType
- maxResponsesPerUser
- resultsVisibility
- startDate
- endDate
- publicResultsEnabled
- miscellaneousId
- createdBy
- createdAt

---

### form_questions

- id
- formId
- type
- title
- description
- required
- position

---

### form_options

- id
- questionId
- label
- position

---

### form_responses

- id
- formId
- userId (nullable)
- submittedAt

---

### form_answers

- id
- responseId
- questionId
- value

---

## Endpoints

- POST /forms
- POST /forms/:id/questions
- PATCH /forms/:id/questions/reorder
- POST /forms/:id/responses
- GET /forms/:id/results

---

## Lógica de Anonimato

Se `anonymous = true`:

- Não salvar userId
- Não exibir identidade
- Não permitir rastreabilidade

---

## Frontend deve fazer

### Builder

- Adicionar perguntas
- Remover perguntas
- Reordenar (drag-and-drop)
- Configurar perguntas

---

### Configuração de pergunta

- Tipo
- Obrigatoriedade
- Opções
- Descrição
- Placeholder
- Escala min/max

---

### Tela de resposta

- Renderização dinâmica
- Validação inline
- Progresso

---

### Painel de resultados

- Total de respostas
- Gráficos
- Estatísticas
- Respostas textuais

---

## Visualizações

- Seleção única → Pizza
- Seleção múltipla → Barra
- Escala → Barra horizontal
- Sim/Não → Doughnut
- Texto → Lista

---

## Tempo real

- Contador de respostas atualizado
- Gráficos em tempo real
- Estado de encerramento

---

## UX/UI — Telas

- Builder de formulários
- Editor de perguntas
- Tela de preenchimento
- Painel de resultados
- Configurações avançadas
- Estado de encerramento
- Compartilhamento público

# Contexto

Miscelâneas que suportam presença (Evento, Reunião, Atividade) podem ter sessões de check-in por:

- QR Code
- Validação manual

---

# Por que isso é importante

Registro de presença é essencial para:

- Comprovação de participação
- Relatórios institucionais
- Controle de frequência
- Auditoria de eventos e atividades

---

# Como deve funcionar

## Modo QR Code

1. Dono cria uma sessão de presença
2. Sistema gera QR Code por participante
3. Participante acessa seu QR (app/perfil)
4. Organizador escaneia o QR
5. Sistema valida token e registra presença

---

## Modo Manual

1. Dono abre lista de participantes
2. Marca presença via toggle:
   - Presente
   - Ausente
3. Pode adicionar participantes manualmente

---

# Regras de Negócio

- **RN-045:** Sessão de presença é criada pelo dono com título, modo e período.
- **RN-046:** Token QR é um hash seguro único por usuário por sessão (não expõe dados sensíveis).
- **RN-047:** Token expira ao fim da sessão ou em tempo configurável.
- **RN-048:** Um usuário só pode realizar um check-in por sessão.
- **RN-049:** Lista de presença pode ser exportada em PDF.
- **RN-050:** Check-in fora do período da sessão é bloqueado.

---

# Critérios de Aceite

- Dono pode criar sessão de presença com modo QR ou manual.
- QR Code exibido para participante é único e seguro.
- Scanner valida QR e retorna feedback imediato:
  - ✅ válido
  - ❌ inválido
- Modo manual exibe lista com toggle de presença.
- Exportação em PDF gera lista completa de presença.
- Duplicidade de check-in é bloqueada.

---

# Backend deve fazer

## Estrutura

Criar tabelas:

- `attendance_sessions`
- `attendance_records`
- `attendance_tokens`

---

## Endpoints

### Criar sessão de presença

```http
POST /miscellaneous/:id/attendance-sessions
```

---

### Obter token do usuário

```http id="tokenendpoint"
GET /attendance-sessions/:sessionId/token
```

---

### Check-in via QR Code

```http id="qrcodect"
POST /attendance-sessions/:sessionId/check-in
```

---

### Check-in manual

```http id="manualcheckin"
PATCH /attendance-sessions/:sessionId/records/:userId
```

---

### Exportação PDF

```http id="pdfexport"
GET /attendance-sessions/:sessionId/export/pdf
```

---

## Regras técnicas

- Gerar token criptograficamente seguro por usuário/sessão.
- Validar expiração antes de aceitar check-in.
- Bloquear duplicidade de registros.
- Garantir atomicidade no check-in.

---

# Frontend deve fazer

## Aba Presença

Disponível apenas para tipos que suportam presença:

- Evento
- Reunião
- Atividade

---

## Criação de sessão

Interface contendo:

- Título da sessão
- Modo:
  - QR Code
  - Manual

- Período de validade

---

## QR Code do participante

Exibir:

- QR individual por sessão
- Atualização dinâmica do token
- Acesso via perfil/app

---

## Scanner

Interface com câmera contendo:

- Leitura de QR
- Feedback visual:
  - ✅ sucesso
  - ❌ erro

- Confirmação instantânea

---

## Lista manual

Exibir:

- Lista de participantes
- Toggle de presença
- Opção de adicionar não inscritos

---

## Exportação

Botão:

```text id="exportpdf"
Exportar PDF
```

---

# UX/UI — Telas a rascunhar

- Criação de sessão de presença
- QR Code do participante
- Scanner de QR com feedback visual
- Lista de presença manual com toggles
- Preview de PDF de presença

# Contexto

Eventos e formulários podem ser publicados em URL pública, acessível sem autenticação.

Usuários externos podem:

- Visualizar conteúdo
- Responder formulários (quando permitido)
- Criar perfil externo simplificado

---

# Por que isso é importante

Eventos acadêmicos e institucionais frequentemente incluem:

- Público geral
- Alunos de outras instituições
- Comunidade externa
- Imprensa

A plataforma precisa suportar esse alcance sem exigir cadastro completo.

---

# Como deve funcionar

## Modo A — Acesso livre (sem cadastro)

- Usuário acessa URL pública
- Visualiza evento ou formulário
- Pode responder se permitido:
  - Formulário com resposta anônima
  - Ou resposta sem cadastro

---

## Modo B — Captura de cadastro externo

- Usuário acessa URL pública
- Para participar ou responder, deve criar perfil externo

### Dados coletados:

- Nome
- E-mail
- Instituição
- Curso
- Cidade
- Estado

Após cadastro:

- Usuário recebe `external_profile`
- Pode interagir com o conteúdo

---

# Regras de Negócio

- **RN-051:** Slug da URL pública é único e amigável, com sufixo aleatório para evitar colisões.
- **RN-052:** Publicação pública pode ser ativada ou desativada a qualquer momento pelo dono.
- **RN-053:** Perfil externo é vinculado à miscelânea e não vira membro interno automaticamente.
- **RN-054:** Dados de perfis externos são exportáveis pelo dono.
- **RN-055:** URL pública pode ser desativada a qualquer momento.

---

# Critérios de Aceite

- Dono pode ativar publicação pública e copiar URL gerada.
- URL pública funciona sem login.
- Formulários anônimos aceitam resposta sem cadastro.
- Formulários com captura exigem cadastro externo antes da resposta.
- Perfis externos aparecem separados no painel do dono.
- Exportação de externos em CSV e PDF funciona corretamente.

---

# Backend deve fazer

## Estrutura

Criar tabela:

- `miscellaneous_public_access`
- `external_profiles`

---

## Slug público

- Gerar slug baseado no título
- Adicionar sufixo aleatório
- Garantir unicidade global

Exemplo:

```text id="slugexample"
evento-semana-ciencia-x8k2p
```

---

## Endpoints públicos

### Evento público

```http id="public_event"
GET /public/eventos/:slug
```

---

### Formulário público

```http id="public_form"
GET /public/formularios/:slug
```

---

## Endpoints internos

### Criar perfil externo

```http id="external_create"
POST /external-profiles
```

---

### Listar participantes externos

```http id="external_list"
GET /miscellaneous/:id/external-participants
```

---

## Exportação

- CSV
- PDF

---

## Regras técnicas

- Validar slug antes de ativar publicação
- Permitir revogação imediata da URL pública
- Isolar dados de usuários externos de usuários internos
- Associar externos sempre à miscelânea

---

# Frontend deve fazer

## Configuração de publicação

Adicionar toggle:

```text id="toggle_public"
Publicar externamente
```

---

## URL pública

Exibir:

- Link gerado
- Botão de copiar
- Status ativo/inativo

---

## Página pública

Criar layout específico:

- Sem navegação interna
- Identidade visual simplificada
- Conteúdo focado em evento/formulário

---

## Cadastro externo

Formulário contendo:

- Nome
- E-mail
- Instituição
- Curso
- Cidade
- Estado

---

## Painel do dono

Exibir:

- Lista de usuários externos
- Dados básicos
- Opção de exportação

---

# UX/UI — Telas a rascunhar

- Página pública de evento/formulário
- Formulário de cadastro externo
- Configuração de publicação pública (toggle + URL)
- Lista de externos no painel do dono
- Modal de compartilhamento de URL pública

# Contexto

Quando um usuário cria uma miscelânea com escopo acima do seu nível hierárquico, ela não entra diretamente no sistema.

Ela passa por um fluxo de aprovação hierárquica antes de ser publicada.

Escopos possíveis:

- Semestre(s)
- Curso(s)
- Cidade(s)
- Universidade(s)
- CAR(s)
- CAE(s)
- Geral

---

# Por que isso é importante

Esse fluxo garante que conteúdos com alcance institucional amplo tenham:

- Curadoria adequada
- Controle de qualidade
- Validação hierárquica
- Governança organizacional

---

# Como deve funcionar

## Criação

- Usuário cria uma miscelânea com escopo elevado.
- Sistema identifica o gestor responsável pelo nível de destino.
- A miscelânea entra no status:

```text
pending_approval
```

---

## Fluxo de aprovação

### Gestor responsável

Recebe notificação contendo:

- Dados da miscelânea
- Link para revisão

---

### Ações possíveis

O gestor pode:

- Aprovar → miscelânea fica ativa
- Negar → retorna com justificativa
- Solicitar revisão → status muda para `under_review`

---

## Escalonamento

- Se não houver gestor no nível atual:
  - O sistema sobe automaticamente para o nível acima

---

## Notificações

- Criador recebe atualização a cada mudança de status
- Gestores recebem novas pendências automaticamente

---

# Regras de Negócio

- **RN-056:** Miscelânea em `pending_approval` só é visível para:
  - Criador
  - Donos definidos
  - Gestores do nível correspondente

- **RN-057:** Gestor pode solicitar ajustes (status `under_review`) antes de aprovar ou negar.
- **RN-058:** Se não houver gestor no nível, o processo escala para o nível superior.
- **RN-059:** Aprovação de um gestor não pode ser revertida por gestor de nível inferior.
- **RN-060:** Todo fluxo de aprovação é registrado em logs de auditoria.

---

# Critérios de Aceite

- Criador vê status `pending_approval` na miscelânea.
- Gestores visualizam lista de pendências filtráveis.
- Gestores podem:
  - Aprovar
  - Negar
  - Solicitar revisão

- Criador recebe notificações em todas as mudanças.
- Miscelânea aprovada fica visível no escopo definido.
- Histórico de aprovação é acessível para gestores e donos.

---

# Backend deve fazer

## Estrutura

Adicionar campo em `miscellaneous`:

```sql id="statusfield"
status ENUM(
  'draft',
  'pending_approval',
  'under_review',
  'active',
  'rejected',
  'archived'
)
```

---

## Logs de aprovação

Criar tabela:

```sql id="approval_logs"
miscellaneous_approval_logs
```

Campos sugeridos:

- id
- miscellaneousId
- actorUserId
- action (approve | reject | request_review)
- comment
- createdAt

---

## Endpoints

### Aprovar

```http id="approve_endpoint"
PATCH /miscellaneous/:id/approve
```

---

### Rejeitar

```http id="reject_endpoint"
PATCH /miscellaneous/:id/reject
```

---

### Solicitar revisão

```http id="review_endpoint"
PATCH /miscellaneous/:id/request-review
```

---

### Listar pendências (gestores)

```http id="pending_endpoint"
GET /approvals/pending
```

---

## Regras técnicas

- Resolver gestor responsável por nível hierárquico.
- Aplicar fallback para nível superior.
- Garantir imutabilidade de logs.
- Garantir consistência de status.

---

# Frontend deve fazer

## Status visual

Exibir badge de status:

- draft
- pending approval
- under review
- active
- rejected

---

## Painel de gestor

Criar interface com:

- Lista de pendências
- Filtros:
  - tipo
  - data
  - escopo

---

## Tela de revisão

Permitir:

- Visualizar miscelânea completa
- Aprovar
- Negar
- Solicitar revisão
- Adicionar comentário

---

## Timeline

Exibir fluxo de status:

```text id="timeline"
Rascunho → Pendente → Em revisão → Ativo
```

---

## Notificações

- In-app
- E-mail

Para:

- Criador
- Gestor
- Donos (quando aplicável)

---

# UX/UI — Telas a rascunhar

- Badge de status com tooltip explicativo
- Painel de aprovações pendentes (gestor)
- Tela de revisão de miscelânea
- Timeline de status (criador)
- Histórico de aprovação (audit trail)

# Contexto

Usuários precisam encontrar miscelâneas relevantes com facilidade.

A listagem deve respeitar:

- Escopo de acesso do usuário
- Tipo de participação
- Status da miscelânea
- Permissões hierárquicas

---

# Por que isso é importante

Com o crescimento da plataforma, a descoberta eficiente de miscelâneas é essencial para:

- Engajamento
- Reutilização de conteúdo
- Organização de atividades
- Participação ativa dos usuários

---

# Como deve funcionar

## Listagem principal

O usuário acessa a listagem e vê apenas miscelâneas que:

- Está autorizado a visualizar
- Estão dentro do seu escopo hierárquico
- Faz parte como dono ou membro (quando aplicável)

---

## Filtros disponíveis

O usuário pode filtrar por:

- Tipo (Projeto, Evento, Meta, Reunião, Atividade)
- Status
- Visibilidade (público / privado)
- Relação com o usuário:
  - Minhas
  - Participo
- Data (criação, início)

---

## Busca

- Busca por:
  - Título
  - Descrição

- Pode ser executada:
  - Em tempo real
  - Ou via Enter

---

## Ordenação

Usuário pode ordenar por:

- Data de criação
- Data de início
- Título (A-Z)

---

# Regras de Negócio

- **RN-061:** Listagem respeita o escopo do usuário — nunca exibe miscelâneas fora do nível de acesso.
- **RN-062:** Miscelâneas privadas aparecem apenas para donos e membros confirmados.
- **RN-063:** Miscelâneas pendentes de aprovação aparecem apenas para:
  - Criador
  - Donos
  - Gestores
- **RN-064:** Miscelâneas arquivadas ficam em aba separada.

---

# Critérios de Aceite

- Listagem exibe apenas miscelâneas acessíveis ao usuário.
- Filtros funcionam de forma combinada.
- Busca retorna resultados corretamente:
  - Em tempo real ou ao pressionar Enter
- Paginação ou scroll infinito com boa performance.
- Aba "Minhas miscelâneas" funciona corretamente.

---

# Backend deve fazer

## Endpoint principal

```http id="misc_list"
GET /miscellaneous
```

---

## Filtros suportados

- type
- status
- visibility
- scope
- myRole
- search
- sortBy
- page
- limit

---

## Regras de query

- Aplicar filtro de escopo baseado no usuário autenticado
- Respeitar permissões:
  - owners
  - participants
  - creators
  - public access

- JOIN necessário com:
  - `miscellaneous_owners`
  - `miscellaneous_participants`

---

## Performance

- Paginação obrigatória
- Índices em:
  - status
  - type
  - createdAt
  - title (full-text search recomendado)

---

# Frontend deve fazer

## Listagem

Exibir miscelâneas em:

- Cards
- Ou tabela (dependendo do layout)

---

## Filtros

Implementar barra de filtros com:

- Dropdowns combinados
- Filtros colapsáveis
- Aplicação combinada (AND logic)

---

## Navegação

Criar abas:

- Todas
- Minhas
- Participo
- Arquivadas

---

## Busca

- Campo de busca global
- Debounce para tempo real
- Trigger por Enter

---

## Estados

- Loading com skeleton
- Empty state por filtro
- Error state amigável

---

# UX/UI — Telas a rascunhar

- Tela de listagem com filtros e busca
- Card de miscelânea com:
  - Badge de tipo
  - Badge de status
  - Badge de visibilidade

- Estado vazio por filtro aplicado
- Skeleton loading da listagem

## Contexto

Donos podem editar, arquivar ou excluir miscelâneas que gerenciam. Cada ação possui regras específicas e impactos diretos para membros vinculados e miscelâneas filhas.

---

# Como Deve Funcionar

## Edição

Qualquer campo editável pode ser alterado pelos donos da miscelânea, com exceção do campo `tipo`, que permanece imutável após a criação.

Alterações relacionadas ao escopo da miscelânea podem exigir um novo fluxo de aprovação, dependendo do novo nível hierárquico atribuído.

---

## Arquivamento

O arquivamento representa o encerramento formal da miscelânea.

A miscelânea:

- deixa de aparecer nas listagens ativas;
- mantém todo o histórico de interações e vínculos;
- passa a ser exibida na aba de arquivadas;
- mantém suas miscelâneas filhas ativas e independentes.

Todos os membros vinculados devem ser notificados sobre o arquivamento.

---

## Exclusão

A exclusão deve ocorrer via soft-delete.

Apenas:

- o criador da miscelânea;
- ou gestores com permissão no nível correspondente;

podem executar essa ação.

Ao excluir:

- a miscelânea recebe `deletedAt`;
- seus filhos perdem o vínculo hierárquico;
- os filhos passam a ser considerados independentes;
- membros devem ser notificados.

Caso existam filhos ativos, o sistema deve exigir confirmação explícita antes da exclusão.

---

# Regras de Negócio

## RN-065

O tipo da miscelânea não pode ser alterado após sua criação.

## RN-066

Mudanças de escopo para níveis superiores devem re-acionar o fluxo de aprovação.

## RN-067

O arquivamento deve notificar todos os membros vinculados à miscelânea.

## RN-068

A exclusão exige confirmação explícita e deve notificar os membros afetados.

## RN-069

Miscelâneas com filhos ativos não podem ser excluídas sem confirmação explícita informando que os filhos ficarão órfãos.

---

# Critérios de Aceite

- Campo `tipo` permanece protegido durante edição.
- Alterações de escopo acionam reaprovação quando necessário.
- Arquivamento move a miscelânea para a aba `Arquivadas`.
- Arquivamento dispara notificações para membros.
- Exclusão exige confirmação em dois passos.
- Exclusão informa claramente impactos sobre filhos.
- Filhos de miscelâneas excluídas passam a aparecer como independentes na listagem.
- Exclusão utiliza soft-delete e preserva histórico interno.

---

# Backend Deve Fazer

## Endpoints

### Atualização

`PATCH /miscellaneous/:id`

Responsável por:

- atualizar campos editáveis;
- validar imutabilidade do tipo;
- verificar necessidade de reaprovação.

---

### Arquivamento

`PATCH /miscellaneous/:id/archive`

Responsável por:

- alterar status para arquivado;
- registrar data de arquivamento;
- disparar notificações.

---

### Exclusão

`DELETE /miscellaneous/:id`

Responsável por:

- executar soft-delete utilizando `deletedAt`;
- desvincular filhos da hierarquia;
- preservar registros históricos;
- disparar notificações.

---

## Regras Técnicas

- Validar permissões por nível hierárquico.
- Bloquear alteração do campo `type`.
- Implementar fluxo de reaprovação por mudança de escopo.
- Desvincular filhos automaticamente ao excluir pai.
- Registrar logs de auditoria para arquivamento e exclusão.
- Garantir consistência relacional após desvinculação.

---

# Frontend Deve Fazer

## Funcionalidades

- Reutilizar formulário de criação para edição.
- Exibir campo `tipo` desabilitado.
- Exibir feedback visual quando mudança de escopo exigir reaprovação.
- Exibir ações:
  - Editar
  - Arquivar
  - Excluir

no menu contextual da miscelânea.

---

## Exclusão

Implementar modal com:

- confirmação em dois passos;
- alerta sobre impacto em filhos;
- aviso de transformação dos filhos em independentes.

---

## Arquivamento

Implementar modal de confirmação contendo:

- resumo da ação;
- aviso de encerramento formal;
- confirmação explícita.

---

# UX/UI — Telas a Rascunhar

- Formulário de edição reutilizando fluxo de criação
- Campo `tipo` visualmente bloqueado
- Modal de confirmação de arquivamento
- Modal de exclusão com alerta de filhos órfãos
- Estado visual de miscelânea arquivada
- Feedback visual de reaprovação pendente
