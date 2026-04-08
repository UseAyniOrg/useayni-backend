# API Routes Documentation

## 🔐 Authentication

### POST /auth/login (signin)
Login de usuário - retorna JWT com posições
```json
Request:
{
  "personalEmail": "user@example.com",
  "password": "senha123",
  "rememberMe": true
}

Response:
{
  "member": { ... },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..." // se rememberMe = true
}
```

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
