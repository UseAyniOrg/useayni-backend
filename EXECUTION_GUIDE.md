# Guia de Execução - Refatoração de Roles e Posições

## ✅ O que foi implementado

### 1. Estruturas de Banco de Dados
- ✅ Migration `RefactorRolesAndPositions` criada
- ✅ Tabelas: `caes`, `cae_managers`, `course_managers`
- ✅ Alterações: `cars.cae_id`, `member_courses.course_university_id` nullable
- ✅ Limpeza de roles antigas

### 2. Models
- ✅ `Cae` - Entidade CAE
- ✅ `CaeManager` - Gestores de CAE
- ✅ `CourseManager` - Dirigentes de curso
- ✅ `Car` atualizado com relação CAE

### 3. Repositories
- ✅ `CaeRepository` - Operações de CAE
- ✅ `CaeManagerRepository` - Gestão de gestores CAE
- ✅ `CourseManagerRepository` - Gestão de dirigentes
- ✅ `MemberRepository.findByIdWithPositions()` - Busca posições

### 4. Auth & JWT
- ✅ `JWTPayload` interface atualizada
- ✅ `tokenHelper` com novo formato
- ✅ `authService` gerando JWT com posições
- ✅ `authMiddleware` usando novo payload

### 5. Middlewares & Guards
- ✅ `@RequireActive()` - Validar matrícula ativa
- ✅ `@RequirePosition()` - Validar posições
- ✅ `AuthorizationGuard` - Guard completo
- ✅ Interface Express atualizada

### 6. Services & Controllers
- ✅ `CaeService` - Lógica de negócio CAE
- ✅ `CaeController` - Endpoints CAE
- ✅ `CaeModule` - Módulo NestJS

### 7. Documentação
- ✅ `ROLES_REFACTOR.md` - Documentação completa
- ✅ Seed para popular CAEs

## 🚀 Como Executar

### Passo 1: Backup do Banco
```bash
# Fazer backup antes de qualquer alteração
pg_dump -h localhost -p 5433 -U postgres -d useayni > backup_antes_refactor.sql
```

### Passo 2: Rodar Migration
```bash
npm run migration:run
```

**Saída esperada:**
```
[X] InitSchema1775599556976
[X] RefactorRolesAndPositions1776000000000
```

### Passo 3: Popular CAEs
```bash
npx ts-node src/seeds/seedCaes.ts
```

**Saída esperada:**
```
✓ CAE criada: CAE Acre
✓ CAE criada: CAE Alagoas
...
✅ Seed de CAEs concluído com sucesso!
```

### Passo 4: Testar Login
```bash
# Fazer login para gerar novo JWT
curl -X POST http://localhost:3333/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "seu@email.com", "password": "senha"}'
```

**Resposta esperada:**
```json
{
  "member": {...},
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### Passo 5: Verificar JWT
Decodifique o token em https://jwt.io

**Deve conter:**
```json
{
  "id": "uuid",
  "email": "email@example.com",
  "name": "Nome",
  "isActive": true,
  "roles": [],
  "positions": [...]
}
```

## 🔧 Próximos Passos

### 1. Atualizar Controllers Existentes
Substituir validações antigas por novos decorators:

```typescript
// ANTES
@Roles('DIRIGENTE')

// DEPOIS
@RequirePosition('DIRIGENTE')
```

### 2. Atualizar App Module
Adicionar `CaeModule`:

```typescript
import { CaeModule } from './modules/cae.module';

@Module({
  imports: [
    // ... outros módulos
    CaeModule,
  ],
})
```

### 3. Criar Endpoints para Course Managers
Similar ao `CaeController`, criar:
- `CourseManagerService`
- `CourseManagerController`
- `CourseManagerModule`

### 4. Atualizar Frontend
- Atualizar interface de login para novo formato JWT
- Implementar telas de gerenciamento de posições
- Atualizar validações de permissão

## 🐛 Troubleshooting

### Migration falha
```bash
# Reverter migration
npm run migration:revert

# Verificar logs
npm run migration:show
```

### JWT inválido após migration
**Solução:** Todos os usuários precisam fazer login novamente.

### Posições não aparecem no JWT
**Verificar:**
1. Membro tem vínculos nas tabelas corretas?
2. `end_date` está NULL?
3. `deleted_at` está NULL?

```sql
-- Verificar posições de um membro
SELECT * FROM course_managers WHERE member_id = 'uuid';
SELECT * FROM car_managers WHERE member_id = 'uuid';
SELECT * FROM cae_managers WHERE member_id = 'uuid';
SELECT * FROM program_semester_heads WHERE member_id = 'uuid';
```

## 📊 Validação

### Checklist de Validação
- [ ] Migration executada com sucesso
- [ ] CAEs criadas para todos os estados
- [ ] Login gera JWT com novo formato
- [ ] JWT contém `isActive`, `roles`, `positions`
- [ ] Decorators `@RequireActive()` e `@RequirePosition()` funcionam
- [ ] EQUIPE_TECNICA tem acesso total
- [ ] Endpoints de CAE funcionam

## 🔄 Rollback

Se necessário reverter:

```bash
# 1. Reverter migration
npm run migration:revert

# 2. Restaurar backup
psql -h localhost -p 5433 -U postgres -d useayni < backup_antes_refactor.sql

# 3. Reverter código (git)
git revert HEAD
```

## 📞 Suporte

Em caso de problemas:
1. Verificar logs do servidor
2. Verificar estado do banco com `migration:show`
3. Consultar `ROLES_REFACTOR.md` para detalhes
4. Contatar equipe técnica

---

**Status:** ✅ Pronto para execução
**Última atualização:** 2025
