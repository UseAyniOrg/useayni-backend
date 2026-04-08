# Refatoração: Sistema de Roles e Posições

## Visão Geral

O sistema foi refatorado para separar **roles** (permissões globais) de **posições** (cargos com vínculos hierárquicos).

## Arquitetura

### Roles (Apenas 2)
- **EXTERNO**: Membro sem matrícula ativa ou ex-membro
- **EQUIPE_TECNICA**: Acesso administrativo total ao sistema

### Status (Derivado)
- **Ativo**: Possui `member_courses` com `status = 'active'`
- **Inativo**: Sem matrícula ativa e sem roles

### Posições (Vínculos Hierárquicos)
- **REPRESENTANTE**: Representa um semestre específico → `program_semester_heads`
- **DIRIGENTE**: Dirige um curso em uma universidade → `course_managers`
- **CAR**: Gerencia CAR (múltiplas cidades) → `car_managers`
- **CAE**: Gerencia CAE (estado inteiro) → `cae_managers`

## Novas Tabelas

### `caes`
Entidade CAE (Conselho Acadêmico Estadual)
```sql
- id: UUID
- name: VARCHAR(255)
- state_id: UUID → states
- created_at, updated_at, deleted_at
```

### `cae_managers`
Gestores de CAE
```sql
- id: UUID
- cae_id: UUID → caes
- member_id: UUID → members
- start_date, end_date
- created_at, updated_at, deleted_at
```

### `course_managers`
Dirigentes de curso
```sql
- id: UUID
- course_university_id: UUID → course_universities
- member_id: UUID → members
- start_date, end_date
- created_at, updated_at, deleted_at
```

### Alterações em Tabelas Existentes
- `cars.cae_id`: UUID → caes (nullable)
- `member_courses.course_university_id`: Agora nullable (para EXTERNOS)

## Formato do JWT

### Antes
```json
{
  "id": "uuid",
  "email": "email@example.com",
  "roles": ["MEMBRO", "CAR"]
}
```

### Depois
```json
{
  "id": "uuid",
  "email": "email@example.com",
  "name": "Nome do Membro",
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
    }
  ]
}
```

## Uso dos Decorators

### Validar Status Ativo
```typescript
@RequireActive()
@Get('/active-only')
async activeOnlyRoute() {
  // Apenas membros com matrícula ativa
}
```

### Validar Role
```typescript
@Roles('EQUIPE_TECNICA')
@Delete('/admin-only')
async adminRoute() {
  // Apenas equipe técnica
}
```

### Validar Posição
```typescript
// Qualquer CAR
@RequirePosition('CAR')
@Get('/car-dashboard')
async carDashboard() {
  // Qualquer gestor de CAR
}

// CAR específica
@RequirePosition('CAR', req.params.carId)
@Put('/cars/:carId')
async updateCar() {
  // Apenas gestor desta CAR específica
}
```

## Migração

### Rodar Migration
```bash
npm run migration:run
```

### Reverter (se necessário)
```bash
npm run migration:revert
```

## Impacto

### ⚠️ Breaking Changes
1. **JWT antigos ficam inválidos** - Usuários precisam fazer login novamente
2. **Roles antigas removidas** - Apenas EXTERNO e EQUIPE_TECNICA permanecem
3. **Validações de permissão** - Controllers precisam ser atualizados

### ✅ Compatibilidade Mantida
- `member_courses` continua funcionando para matrículas
- `car_managers` e `program_semester_heads` já existiam
- Soft delete mantido em todas as tabelas

## Exemplos de Uso

### Verificar se membro é ativo
```typescript
const user = req.user; // JWTPayload
if (user.isActive) {
  // Membro tem matrícula ativa
}
```

### Verificar posição
```typescript
const isCAR = user.positions.some(p => p.type === 'CAR');
const isDirigenteEspecifico = user.positions.some(
  p => p.type === 'DIRIGENTE' && p.id === courseUniversityId
);
```

### Equipe técnica tem acesso total
```typescript
if (user.roles.includes('EQUIPE_TECNICA')) {
  // Bypass de todas as validações
}
```

## Próximos Passos

1. Atualizar todos os controllers para usar novos decorators
2. Criar seeds para popular CAEs
3. Implementar telas de gerenciamento de posições
4. Atualizar documentação da API (Swagger)
5. Testes de integração

## Suporte

Para dúvidas ou problemas, consulte a equipe técnica.
