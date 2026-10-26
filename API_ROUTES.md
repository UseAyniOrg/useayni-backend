# API Routes Documentation

## Attendance QR codes and people tables

- QR payload is the opaque attendance token, not a URL or personal data.
  Participants obtain it through the existing session token endpoint or the
  participant-scoped public-event attendance endpoint. Only enrolled participants
  in an open QR session can obtain one. Repeated requests reuse a valid unused
  token rather than invalidating the QR already displayed.
- Camera, image upload and manual input all submit `{ "token": "..." }` to
  `POST /attendance-sessions/:sessionId/check-in`. Management authorization,
  session mode/window, enrollment, expiry and prior use are checked server-side.
  Token consumption and attendance persistence share a transaction with a token
  row lock, so a failed write does not consume the code.
- `DELETE /attendance-sessions/:sessionId` requires the attendance feature and
  event-management authorization, and returns `204` on success. It permanently
  deletes the session, attendance records and QR tokens through database cascades.
  The interface requires explicit confirmation with an irreversible-action warning.
  Missing sessions return `404`; unauthorized requests do not delete anything.
- `GET /miscellaneous/:id/people` verifies tenant and event visibility.
  Event owners and organization managers receive email, phone, CPF and
  `details: { membership_type, shared_profile, registration_data, custom_fields }`.
  Profile fallback is restricted to the current organization's consent snapshot,
  never another organization's reusable fields. Other viewers receive minimal
  member identity, without contacts or registration details.
- People/public-registration tables filter client-side across their loaded,
  authorized data. Text search is accent/case insensitive; field filters combine
  with AND. Counts reflect all matching rows before pagination. Click a name for
  details. People are deduplicated by member ID; public registrations remain
  individual registration rows.

## Organization onboarding (without email delivery)

Apply pending migrations with `npm run migration:run` before using initial
credentials. `TemporaryPasswordSetup` adds `user_accounts.password_change_required`.
`RestoreMemberAcademicRelations` restores nullable academic columns removed by
an older migration but still selected by member/profile relations. Its automatic
down migration is intentionally refused because those columns may predate the
repair and contain data.

### SuperAdmin workflow

1. Create the organization as a draft and save its administrator email and responsible-party details.
2. Activate it. Saving the email alone does not create an account or send a message.
3. On its platform details page, choose **Emitir acesso de administrador**.
   This creates the account and approved membership if necessary and grants
   `organization.admin`. An already-approved member is not a prerequisite.
4. Deliver the organization's `/admin/login` URL, email and temporary password
   through a secure channel. New passwords are displayed only in the operation's
   response, never stored in plaintext or included in audit records.
5. The first access is restricted to defining a personal password and confirming
   the member's name. All sessions are invalidated after completion; sign in
   again with the new password. Additional profile information remains editable
   through the existing member profile.

An existing account with a personal password keeps it, including when linked to
another organization. Reissuing administrator access only rotates a password
while initial setup is pending; it does not reset an established personal
password. The old temporary password and sessions are invalidated when rotated.
The temporary credential remains valid until replaced or reissued; expiration
and email delivery are not implemented in this iteration.

### Platform endpoints

All routes below require a platform session with `EQUIPE_TECNICA`. A tenant support
session cannot invoke these platform routes.

| Method | Route | Body / behavior |
| --- | --- | --- |
| POST | `/organizations/:id/admin-access` | `{ "email": "admin@example.org" }`; active/trial organization required |
| POST | `/organizations/:id/admins` | Compatibility alias for administrator provisioning |
| POST | `/organizations/:id/members/import` | `{ "emails": ["member@example.org"] }`; 1-500 rows, duplicates ignored |
| POST | `/organizations/:id/member-access` | `{ "email": "member@example.org" }`; creates a member or reissues pending initial access without promotion |
| GET | `/organizations/hierarchy-templates` | Full library of editable version-1 models |
| POST | `/organizations/:id/hierarchy/import` | Full version-1 JSON model; atomic import of types, units and positions |
| POST | `/organizations/:id/support-access` | `{ "reason": "Reason with at least 10 characters" }`; audited support session |

Member imports return `{ results: [...] }`. Each row contains `email` and either
the provisioned membership fields (`member_id`, `existing_account`,
`password_change_required`, optional `temporary_password`) or an explicit `error`.
Errors are reported per row; valid rows remain imported. Reimporting an existing
membership does not reset its password or approve an existing pending application.
New imported members are approved and private, without administrative privileges.

The frontend accepts UTF-8 TXT and CSV, one address per line or in the first
column (comma, semicolon or tab separators; optional `email` header).
Only email is imported in this iteration; extra columns are not mapped to profile
fields. The CSV model is downloadable from the organization details page.
Keep the response available until credentials have been delivered securely.
If a pending member's initial password was lost, reimport the list and choose
**Reemitir senha inicial pendente** on the corresponding row.

### First-access password

`POST /auth/change-temporary-password` requires the restricted access token:

```json
{
  "new_password": "a-new-personal-password",
  "full_name": "Member Name"
}
```

The password must have at least 8 characters, at most 72 UTF-8 bytes (bcrypt's
limit), and differ from the temporary credential.
The name must have 2-255 characters. Password changes update the global account,
synchronize membership hashes, and revoke access/refresh tokens for all its
memberships in one transaction.

### Hierarchy library and file contract

Download/select a model from **Biblioteca e importação de hierarquias** in the
organization details page. The JSON editor allows customization before confirmation.
Models include:

- **Centro Acadêmico**: elected executive board, course representation and
  activity committees, without a mandatory territorial hierarchy.
- **Entidade de Classe**: general assembly, board, fiscal council, territorial
  chapters and thematic committees. Adapt electoral rules to the organization's statute.
- **Associação Comercial**: members' assembly, executive board, deliberative
  council, sector chapters and project committees.

Each library item includes `organization_profile` and an explanatory `description`
to guide the technical team. Example of a small custom model:

```json
{
  "version": 1,
  "slug": "associacao-local",
  "name": "Local association",
  "description": "Single board. Adapt positions and terms to the statute.",
  "organization_profile": "Small association without territorial chapters.",
  "types": [{ "slug": "board", "name": "Board" }],
  "units": [{ "slug": "executive-board", "name": "Executive Board", "type_slug": "board" }],
  "positions": [{
    "name": "President",
    "type_slug": "board",
    "investiture_type": "ELECTION",
    "mandate_duration_days": 365,
    "allows_deputy": true
  }]
}
```

`parent_slug` optionally references another unit in the same file. File order is
irrelevant. Investiture values: `ELECTION`, `APPOINTMENT`, `AUTOMATIC`.
Limits: 100 types, 500 units, 500 positions; slug maximum 50 characters using
lowercase letters, numbers and hyphens. The UI limits JSON uploads to 90 KiB.
Unknown fields, duplicate definitions, cycles, missing references and invalid
mandate durations are refused before writing. Existing type/unit slugs cause
the entire import to fail, preserving current structures. Use new slugs for
additions or edit existing structures through hierarchy management.

Importing does not activate the hierarchy feature, assign members to positions,
or grant access roles based on titles. Enable the **Hierarquia** module explicitly.
Use the audited **Gerenciar hierarquia, cargos e mandatos como suporte** action to
open organization management as SuperAdmin. Units can be renamed/reparented
(cycles and foreign-organization references are refused); position rules can
be edited and mandates assigned, closed or revoked. Updating a position does
not retroactively change already-assigned mandate dates.

### Validation and future email delivery

- `npm run test:onboarding`: database-free regression tests.
- `npm run test:onboarding:integration`: PostgreSQL integration test; temporary
  organization/accounts/hierarchy are created inside one transaction and rolled back.
- `npx tsc --noEmit`: type checking.

No emails are sent or queued by these endpoints yet. Email integration must
deliver initial credentials through a transactional/outbox mechanism, with
expiration, resend rules and observable delivery failures; merely configuring
SMTP will not enable automatic sending in the current implementation.

## 🔐 Authentication

### POST /auth/login (signin)
Login de usuário - retorna JWT com posições

The login body selects an explicit `access_context`:

| Context | Frontend entry point | Requirements |
|---|---|---|
| `platform` | `localhost:5173/admin/login` (production platform domain) | Global `EQUIPE_TECNICA`; no tenant |
| `organization` | `<slug>.localhost:5173/admin/login` | Approved membership with `organization.admin` or `organization.manage` in that organization |
| `member` (default) | `<slug>.localhost:5173/login` | Approved membership; no platform or organization-management roles in the resulting token |

The same account/email and personal password can be used in all three contexts.
They produce independent tokens. Global technical-team roles are never merged
into organization tokens. Support is a separate, audited platform operation,
not an implicit privilege on organization login. Old tokens without a context
must log in again.

Refresh tokens retain their context and are rotated on use. Logging out accepts
the current `refreshToken` in the body to revoke it alongside the access token,
without revoking sessions in other contexts.

```json
Request:
{
  "personalEmail": "user@example.com",
  "password": "senha123",
  "rememberMe": true,
  "access_context": "member"
}

Response:
{
  "member": { ... },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..." // se rememberMe = true
}
```

### Public event registration and organization management

Events created in a support session belong only to its selected organization.
Organization administrators can list, edit, publish/archive/delete and manage
people, invitations, participation requests, waitlists and attendance for those
events, even when they are not owners. Authorization uses the current token's
roles and organization, not the account's roles in another context.

- `POST /miscellaneous/:id/public-access/enable`: enable a shareable public page.
- `POST /miscellaneous/:id/public-access/disable`: hide it again.
- `GET /public/events/:slug/registration`: public event information, media,
  location, registration fields, capacity, remaining places and
  `registration_state` (`open`, `not_open`, `closed`, `full`).
- `GET /public/events/:slug/my-registration`: optional personal bearer session;
  returns authentication, internal/external membership and registration status.
- `POST /public/events/:slug/register`: accepts name, email, `profile_type`
  (`basic`/`academic`), optional phone/academic data, `registration_data` and
  `accepted_privacy: true`. Anonymous accounts must also provide a password
  (at least eight characters, at most 72 UTF-8 bytes). Existing accounts must
  authenticate with their existing password or sign in first.

With a valid personal bearer token, registration uses the session's account
email and requires no password. Approved internal memberships are reused
without adding `EXTERNO`, changing their roles, or creating an external profile.
Pending memberships remain pending and cannot bypass approval by registering
externally. Platform/support sessions cannot register as community participants.
New external accounts receive an approved membership with the `EXTERNO` role.

All public event operations check the selected tenant. Registration locks the
event, validates custom answers and dates, enforces capacity and does not add a
participant twice. The frontend keeps the event return destination through
login/signup; internal signup still requires organizational approval.
No email is claimed or sent by this flow.

### Organization-specific registration types

Admins configure `/admin/perfis-externos`; platform SuperAdmins use the same
screen and select the organization. There is no schema migration for this
feature: definitions are stored under `organizations.settings.external_profile_types`.

- Organization: `GET` / `PUT /org/external-profile-types`.
- Platform: `GET` / `PUT /organizations/:id/external-profile-types`.
- A PUT replaces the complete list (1-20 profiles, at most 40 fields per profile).
  Each profile has a stable `key`, `name`, `description`, and `fields`.
  Fields have `key`, `label`, `type`, `required`, and optional `options`.
  Supported types: text, email, number, date, select and checkbox.
  Unknown properties, duplicate keys and invalid values are rejected.
- An organization without configuration uses the **Básico** registration type
  (legacy key `visitor`). Existing definitions are not renamed automatically.
  The existing basic/academic database fields remain backward compatible, but
  new UI flows do not show a second, fixed academic selector.
- Public event information includes `external_profile_types`. Registration
  accepts `organization_profile_key` and `profile_data`, validated against
  the current organization configuration. Internal members do not have to
  fill in an external profile.

Types apply to both internal signup and external event participation.
`GET /members/registration-profile-types` is public and returns the same definitions.
`POST /members` accepts `organization_profile_key`, `profile_data`, and
`accepted_profile_sharing`; the selected values and consent snapshot are saved
atomically with the membership, without granting the EXTERNO role.
An explicit profile submission requires sharing consent. Both registration
flows accept optional `cpf`, validate its check digits and store it on the
organization membership. Existing required CPF custom-field settings still apply.
Internal signup also accepts `confirm_password`.

External accounts can log in through `/login` and open `/minhas-inscricoes` to see
their events. `/perfil-externo` is a compatibility redirect, not a profile editor.
`GET /external-profile/registrations` lists only their
event registrations in the current organization, including events whose public
pages were subsequently hidden.

The account/password and reusable personal profile are global, but memberships
and registration snapshots remain tenant-scoped. A user with an existing
external profile can log into a second organization without recreating the
account. Until registration creates that organization's `EXTERNO` membership,
the token is `community_only` and restricted to personal profile/registration
operations; it does not grant general member or administrative access.
Refresh retains this restriction and tenant.

`my-registration` prefills compatible external fields from the account profile.
Reuse requires the same field key, label, type and options. The person confirms
sharing before registration; missing or incompatible fields are requested again.
The server persists only fields selected by the current profile definition and
stores a snapshot of the chosen profile and shared values with the event.
Changes to a definition do not rewrite past registrations. Organization admins
cannot browse reusable values from other organizations.

Public signup routes (`registration-fields`, `custom-fields`, drafts) must be
registered before the generic `GET /members/:id` route to avoid route shadowing.

### Event participation after registration

Registered users can still open the public event page. It shows event details
and confirmation instead of a new registration form.

- `GET /public/events/:slug/attendance`: sessions visible to the authenticated,
  approved participant. Resolves the membership from the account, including a
  restricted community session whose membership was created after login.
- `GET /public/events/:slug/attendance/:sessionId/token`: own attendance token,
  only for a QR session belonging to this event after its start and before its end.
  Checked-in participants receive `checked_in: true`; no new registration occurs.
- `GET /event-participation/:id/answers`: current `registration_fields`, compatible
  `registration_data`, and `pending_fields` for the authenticated participant.
- `PATCH /event-participation/:id/answers`: `{ registration_data, accepted_privacy: true }`.
  Validates against the current event schema; never changes capacity or membership.
  Both internal detail and public event page use these same endpoints.

The answer endpoints check account, participant, tenant and organization status;
they work for internally joined participants and when the public page is hidden.
New optional questions prompt once; required missing or invalid answers remain
pending. The saved schema records which optional questions have been acknowledged.
Removed answers are retained in the stored history while current answers can be
updated or cleared. The original profile consent is preserved; supplemental
answer consent is stored separately under `event_answers_consent_*`.

Regression commands: `npm run test:access-events`,
`npm run test:onboarding:integration` (transactional rollback).

### POST /auth/refresh-token
Renovar token de acesso
```json
Request:
{
  "refreshToken": "eyJhbGc..."
}

Response:
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### POST /auth/logout
Logout - invalida tokens
```
Headers: Authorization: Bearer <token>
```

### GET /auth/verify-access-token
Verificar validade do token
```
Headers: Authorization: Bearer <token>

Response:
{
  "valid": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Nome",
    "isActive": true,
    "roles": ["EQUIPE_TECNICA"],
    "positions": [...]
  }
}
```

---

## 👥 Members

### POST /members (signup)
Criar novo membro - retorna JWT automaticamente
```json
Request:
{
  "name": "João Silva",
  "cpf": "123.456.789-00",
  "phone": "(11) 98765-4321",
  "email_personal": "joao@email.com",
  "email_university": "joao@university.edu",
  "birth_date": "2000-01-01",
  "admission_date": "2024-01-01",
  "ra": "123456",
  "password": "senha123",
  "course_university_id": "uuid", // opcional
  "city_id": "uuid", // opcional
  "sponsor": "Nome do Padrinho" // opcional
}

Response:
{
  "message": "Membro criado com sucesso!",
  "data": { ... },
  "accessToken": "eyJhbGc..."
}
```

### GET /members
Listar todos os membros

### GET /members/:id
Buscar membro por ID

### GET /members/profile/:slug
Buscar perfil público por slug

### PUT /members/id/:id
Atualizar dados do membro
- Requer: Próprio membro OU EQUIPE_TECNICA

---

## 🎭 Gerenciamento de Roles (EQUIPE_TECNICA apenas)

### POST /members/:memberId/roles
Adicionar role a um membro
```json
Request:
{
  "roleName": "EXTERNO" // ou "EQUIPE_TECNICA"
}

Response:
{
  "message": "Role adicionada com sucesso. Usuário deve fazer login novamente."
}
```
⚠️ **Invalida tokens do usuário**

### DELETE /members/:memberId/roles/:roleName
Remover role de um membro
⚠️ **Invalida tokens do usuário**

---

## 📍 Gerenciamento de Posições (EQUIPE_TECNICA apenas)

### DIRIGENTE

#### POST /members/:memberId/positions/dirigente
Adicionar posição de DIRIGENTE
```json
Request:
{
  "courseUniversityId": "uuid",
  "startDate": "2024-01-01" // opcional
}
```
⚠️ **Invalida tokens do usuário**

#### DELETE /members/:memberId/positions/dirigente/:courseUniversityId
Remover posição de DIRIGENTE
⚠️ **Invalida tokens do usuário**

### CAR

#### POST /members/:memberId/positions/car
Adicionar posição de CAR
```json
Request:
{
  "carId": "uuid"
}
```
⚠️ **Invalida tokens do usuário**

#### DELETE /members/:memberId/positions/car/:carId
Remover posição de CAR
⚠️ **Invalida tokens do usuário**

### CAE

#### POST /members/:memberId/positions/cae
Adicionar posição de CAE
```json
Request:
{
  "caeId": "uuid",
  "startDate": "2024-01-01" // opcional
}
```
⚠️ **Invalida tokens do usuário**

#### DELETE /members/:memberId/positions/cae/:caeId
Remover posição de CAE
⚠️ **Invalida tokens do usuário**

### REPRESENTANTE

#### POST /members/:memberId/positions/representante
Adicionar posição de REPRESENTANTE
```json
Request:
{
  "programSemesterId": "uuid",
  "startDate": "2024-01-01" // opcional
}
```
⚠️ **Invalida tokens do usuário**

#### DELETE /members/:memberId/positions/representante/:programSemesterId
Remover posição de REPRESENTANTE
⚠️ **Invalida tokens do usuário**

---

## 🏛️ CAEs

### GET /caes
Listar todas as CAEs

### GET /caes/:id
Buscar CAE por ID

### GET /caes/state/:stateId
Buscar CAEs por estado

### POST /caes
Criar nova CAE (EQUIPE_TECNICA apenas)
```json
Request:
{
  "name": "CAE Paraíba",
  "state_id": "uuid"
}
```

### PUT /caes/:id
Atualizar CAE
- Requer: Gestor da CAE OU EQUIPE_TECNICA

### DELETE /caes/:id
Deletar CAE (EQUIPE_TECNICA apenas)

### POST /caes/:id/managers
Adicionar gestor à CAE
- Requer: Gestor da CAE OU EQUIPE_TECNICA
```json
Request:
{
  "member_id": "uuid",
  "start_date": "2024-01-01" // opcional
}
```

### DELETE /caes/:id/managers/:memberId
Remover gestor da CAE
- Requer: Gestor da CAE OU EQUIPE_TECNICA

### GET /caes/:id/managers
Listar gestores da CAE

---

## 🎓 Course Managers (Dirigentes)

### GET /course-managers
Listar todos os dirigentes

### GET /course-managers/:id
Buscar dirigente por ID

### GET /course-managers/member/:memberId
Buscar dirigentes por membro

### GET /course-managers/course-university/:courseUniversityId
Buscar dirigentes por curso-universidade

### POST /course-managers
Adicionar dirigente (EQUIPE_TECNICA apenas)
```json
Request:
{
  "course_university_id": "uuid",
  "member_id": "uuid",
  "start_date": "2024-01-01" // opcional
}
```

### PUT /course-managers/:id/end
Encerrar vínculo de dirigente
- Requer: Próprio dirigente OU EQUIPE_TECNICA

### DELETE /course-managers/:id
Deletar dirigente (EQUIPE_TECNICA apenas)

---

## 🔑 Roles (Sistema Legado - Uso Limitado)

⚠️ **Nota:** Apenas EXTERNO e EQUIPE_TECNICA devem existir. Posições (DIRIGENTE, CAR, CAE, REPRESENTANTE) são gerenciadas via vínculos.

### GET /roles
Listar todas as roles

### GET /roles/:id
Buscar role por ID

### GET /roles/name/:name
Buscar role por nome

### POST /roles
Criar role (EQUIPE_TECNICA apenas) - DEPRECATED

### PUT /roles/:id
Atualizar role (EQUIPE_TECNICA apenas)

### DELETE /roles/:id
Deletar role (EQUIPE_TECNICA apenas)

### POST /roles/:id/permissions
Atribuir permissões à role (EQUIPE_TECNICA apenas)

---

## 📋 Formato do JWT

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "Nome do Usuário",
  "isActive": true,
  "roles": ["EQUIPE_TECNICA"],
  "positions": [
    {
      "type": "CAR",
      "id": "uuid-car",
      "name": "CAR Paraíba"
    },
    {
      "type": "DIRIGENTE",
      "id": "uuid-course-university",
      "name": "Eng. Software - UFPB - João Pessoa"
    },
    {
      "type": "CAE",
      "id": "uuid-cae",
      "name": "CAE Nordeste - Paraíba"
    },
    {
      "type": "REPRESENTANTE",
      "id": "uuid-program-semester",
      "name": "3º Semestre - Eng. Software"
    }
  ]
}
```

---

## 🔒 Níveis de Acesso

### Público
- POST /auth/login
- POST /members (signup)
- GET /members/profile/:slug

### Autenticado (qualquer usuário logado)
- GET /auth/verify-access-token
- POST /auth/logout
- GET /members (lista)
- GET /members/:id
- PUT /members/id/:id (próprio perfil)

### Ativo (matrícula ativa)
- Acesso a recursos específicos do curso

### Posições
- **REPRESENTANTE**: Gerencia semestre específico
- **DIRIGENTE**: Gerencia curso-universidade específico
- **CAR**: Gerencia CAR e suas cidades
- **CAE**: Gerencia CAE e suas CARs

### EQUIPE_TECNICA
- Acesso total ao sistema
- Pode gerenciar roles e posições
- Bypass de todas as validações

---

## ⚠️ Importante

1. **Invalidação de Tokens**: Qualquer alteração em roles ou posições invalida os tokens do usuário. O usuário deve fazer login novamente.

2. **Signup Automático**: O endpoint POST /members (signup) já retorna um accessToken, não é necessário fazer login após o cadastro.

3. **Signin**: Use POST /auth/login para autenticação.

4. **Verificação de Token**: Use GET /auth/verify-access-token para validar e obter dados do usuário logado.

5. **Apenas EQUIPE_TECNICA** pode gerenciar roles e posições de outros usuários.
