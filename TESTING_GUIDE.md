# Guia de Teste - Sistema Completo

## ✅ Checklist de Implementação

### Estruturas
- [x] Migration RefactorRolesAndPositions
- [x] Models: Cae, CaeManager, CourseManager
- [x] Repositories: CaeRepository, CaeManagerRepository, CourseManagerRepository
- [x] Services: CaeService, CourseManagerService, MemberService atualizado
- [x] Controllers: CaeController, CourseManagerController, MembersController atualizado
- [x] Modules: CaeModule, CourseManagerModule adicionados ao AppModule
- [x] Auth: JWT com novo formato (isActive, positions)
- [x] Guards: AuthorizationGuard, @RequireActive, @RequirePosition, @Roles
- [x] Documentação: API_ROUTES.md, ROLES_REFACTOR.md, EXECUTION_GUIDE.md

---

## 🚀 Passo a Passo de Execução

### 1. Rodar Migration
```bash
npm run migration:run
```

**Verificar:**
```bash
npm run migration:show
```

**Saída esperada:**
```
[X] InitSchema1775599556976
[X] RefactorRolesAndPositions1776000000000
```

### 2. Popular CAEs
```bash
npx ts-node src/seeds/seedCaes.ts
```

### 3. Iniciar Servidor
```bash
npm run dev
```

---

## 🧪 Testes Funcionais

### Teste 1: Signup (Criar Membro)
```bash
curl -X POST http://localhost:3333/members \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "cpf": "12345678900",
    "phone": "11987654321",
    "email_personal": "joao@email.com",
    "email_university": "joao@university.edu",
    "birth_date": "2000-01-01",
    "admission_date": "2024-01-01",
    "ra": "123456",
    "password": "senha123"
  }'
```

**Resultado esperado:**
- Status: 201
- Retorna: `{ message, data, accessToken }`
- JWT já vem no response (não precisa fazer login)

### Teste 2: Signin (Login)
```bash
curl -X POST http://localhost:3333/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "personalEmail": "joao@email.com",
    "password": "senha123",
    "rememberMe": true
  }'
```

**Resultado esperado:**
- Status: 200
- Retorna: `{ member, accessToken, refreshToken }`

### Teste 3: Verificar Token
```bash
curl -X GET http://localhost:3333/auth/verify-access-token \
  -H "Authorization: Bearer <SEU_TOKEN>"
```

**Resultado esperado:**
```json
{
  "valid": true,
  "user": {
    "id": "uuid",
    "email": "joao@email.com",
    "name": "João Silva",
    "isActive": false,
    "roles": [],
    "positions": []
  }
}
```

### Teste 4: Criar Primeiro Usuário EQUIPE_TECNICA

**4.1. Criar membro:**
```bash
curl -X POST http://localhost:3333/members \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin Sistema",
    "cpf": "99999999999",
    "phone": "11999999999",
    "email_personal": "admin@system.com",
    "email_university": "admin@university.edu",
    "birth_date": "1990-01-01",
    "admission_date": "2024-01-01",
    "ra": "999999",
    "password": "admin123"
  }'
```

**4.2. Adicionar role EQUIPE_TECNICA manualmente no banco:**
```sql
-- Buscar IDs
SELECT id FROM members WHERE email_personal = 'admin@system.com';
SELECT id FROM roles WHERE name = 'EQUIPE_TECNICA';

-- Adicionar role
INSERT INTO member_roles (member_id, role_id) 
VALUES ('<member_id>', '<role_id>');
```

**4.3. Fazer login como admin:**
```bash
curl -X POST http://localhost:3333/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "personalEmail": "admin@system.com",
    "password": "admin123"
  }'
```

**Verificar JWT:**
```json
{
  "roles": ["EQUIPE_TECNICA"],
  "positions": []
}
```

### Teste 5: Adicionar Role a Outro Membro (como EQUIPE_TECNICA)
```bash
curl -X POST http://localhost:3333/members/<member_id>/roles \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "roleName": "EXTERNO"
  }'
```

**Resultado esperado:**
- Status: 200
- Mensagem: "Role adicionada com sucesso. Usuário deve fazer login novamente."
- Tokens do usuário são invalidados

### Teste 6: Adicionar Posição de DIRIGENTE
```bash
# Primeiro, buscar um course_university_id
curl -X GET http://localhost:3333/courses

# Adicionar posição
curl -X POST http://localhost:3333/members/<member_id>/positions/dirigente \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "courseUniversityId": "<course_university_id>",
    "startDate": "2024-01-01"
  }'
```

**Resultado esperado:**
- Status: 200
- Tokens do usuário invalidados
- Usuário deve fazer login novamente para ver posição no JWT

### Teste 7: Verificar Posições no JWT
```bash
# Usuário faz login novamente
curl -X POST http://localhost:3333/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "personalEmail": "joao@email.com",
    "password": "senha123"
  }'
```

**JWT deve conter:**
```json
{
  "positions": [
    {
      "type": "DIRIGENTE",
      "id": "uuid-course-university",
      "name": "Eng. Software - UFPB - João Pessoa"
    }
  ]
}
```

### Teste 8: Listar CAEs
```bash
curl -X GET http://localhost:3333/caes \
  -H "Authorization: Bearer <TOKEN>"
```

**Resultado esperado:**
- Lista de 27 CAEs (uma por estado)

### Teste 9: Adicionar Gestor a uma CAE
```bash
curl -X POST http://localhost:3333/caes/<cae_id>/managers \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "member_id": "<member_id>",
    "start_date": "2024-01-01"
  }'
```

### Teste 10: Remover Posição
```bash
curl -X DELETE http://localhost:3333/members/<member_id>/positions/dirigente/<course_university_id> \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Resultado esperado:**
- Status: 200
- Tokens invalidados
- Posição removida do próximo JWT

---

## 🔍 Validações SQL

### Verificar Roles no Sistema
```sql
SELECT * FROM roles;
-- Deve retornar apenas: EXTERNO, EQUIPE_TECNICA
```

### Verificar Posições de um Membro
```sql
-- DIRIGENTE
SELECT cm.*, cu.id, c.name as course, u.name as university
FROM course_managers cm
JOIN course_universities cu ON cm.course_university_id = cu.id
JOIN courses c ON cu.course_id = c.id
JOIN universities u ON cu.university_id = u.id
WHERE cm.member_id = '<member_id>' AND cm.end_date IS NULL;

-- CAR
SELECT cm.*, ca.name as car_name
FROM car_managers cm
JOIN cars ca ON cm.car_id = ca.id
WHERE cm.member_id = '<member_id>';

-- CAE
SELECT cm.*, cae.name as cae_name, s.name as state
FROM cae_managers cm
JOIN caes cae ON cm.cae_id = cae.id
JOIN states s ON cae.state_id = s.id
WHERE cm.member_id = '<member_id>' AND cm.end_date IS NULL;

-- REPRESENTANTE
SELECT psh.*, ps.semester_number, c.name as course
FROM program_semester_heads psh
JOIN program_semesters ps ON psh.program_semester_id = ps.id
JOIN courses c ON ps.course_id = c.id
WHERE psh.member_id = '<member_id>' AND psh.end_date IS NULL;
```

### Verificar Tokens Ativos
```sql
SELECT t.*, m.name, m.email_personal
FROM token t
JOIN members m ON t."memberId" = m.id
WHERE t."expiresAt" > NOW()
ORDER BY t."createdAt" DESC;
```

---

## ✅ Checklist de Validação Final

- [ ] Signup funciona e retorna JWT
- [ ] Signin funciona e retorna JWT com novo formato
- [ ] JWT contém: id, email, name, isActive, roles, positions
- [ ] EQUIPE_TECNICA pode adicionar roles
- [ ] EQUIPE_TECNICA pode adicionar posições
- [ ] Adicionar role/posição invalida tokens do usuário
- [ ] Usuário precisa fazer login após mudanças
- [ ] CAEs foram criadas para todos os estados
- [ ] Endpoints de CAE funcionam
- [ ] Endpoints de CourseManager funcionam
- [ ] Guards @RequireActive e @RequirePosition funcionam
- [ ] EQUIPE_TECNICA tem acesso total

---

## 🐛 Problemas Comuns

### "Token inválido ou expirado"
**Solução:** Fazer login novamente após qualquer mudança em roles/posições.

### "Acesso negado"
**Solução:** Verificar se o usuário tem a role/posição necessária no JWT.

### "Role não encontrada"
**Solução:** Verificar se apenas EXTERNO e EQUIPE_TECNICA existem no banco.

### Posições não aparecem no JWT
**Solução:** 
1. Verificar se `end_date` está NULL
2. Verificar se `deleted_at` está NULL
3. Fazer logout e login novamente

---

## 📊 Métricas de Sucesso

✅ **Sistema funcionando corretamente se:**
1. Signup retorna JWT automaticamente
2. Signin retorna JWT com posições
3. Apenas EQUIPE_TECNICA pode gerenciar roles/posições
4. Mudanças invalidam tokens
5. JWT reflete estado atual do usuário após login
6. Guards bloqueiam acesso não autorizado

---

**Status:** ✅ Pronto para testes
**Última atualização:** 2025
