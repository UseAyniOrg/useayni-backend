# Guia de Uso - Guards e Decorators

## 🛡️ Guards Disponíveis

### AuthorizationGuard
Guard principal que valida:
- Autenticação (JWT válido)
- Roles específicas
- Status ativo (matrícula)
- Posições hierárquicas

**IMPORTANTE:** EQUIPE_TECNICA tem bypass automático de todas as validações.

---

## 🎯 Decorators Disponíveis

### 1. @Roles(...roles)
Valida se o usuário tem uma das roles especificadas.

```typescript
import { Roles } from '../middlewares/permissionMiddleware';
import { AuthorizationGuard } from '../middlewares/authorization.guard';

@Controller('admin')
@UseGuards(AuthorizationGuard)
export class AdminController {
  
  @Get()
  @Roles('EQUIPE_TECNICA')
  async adminOnly() {
    // Apenas EQUIPE_TECNICA pode acessar
  }

  @Post()
  @Roles('EQUIPE_TECNICA', 'EXTERNO')
  async techOrExternal() {
    // EQUIPE_TECNICA ou EXTERNO podem acessar
  }
}
```

### 2. @RequireActive()
Valida se o usuário tem matrícula ativa.

```typescript
import { RequireActive } from '../middlewares/requireActive.decorator';
import { AuthorizationGuard } from '../middlewares/authorization.guard';

@Controller('courses')
@UseGuards(AuthorizationGuard)
export class CoursesController {
  
  @Get('my-courses')
  @RequireActive()
  async getMyCourses() {
    // Apenas membros com matrícula ativa
  }
}
```

### 3. @RequirePosition(type, contextId?)
Valida se o usuário tem uma posição específica.

```typescript
import { RequirePosition } from '../middlewares/requirePosition.decorator';
import { AuthorizationGuard } from '../middlewares/authorization.guard';

@Controller('cars')
@UseGuards(AuthorizationGuard)
export class CarsController {
  
  @Get('dashboard')
  @RequirePosition('CAR')
  async carDashboard() {
    // Qualquer gestor de CAR pode acessar
  }

  @Put(':id')
  @RequirePosition('CAR')
  async updateCar(@Param('id') id: string, @Req() req: Request) {
    // Validar se é gestor DESTA CAR específica
    const user = req.user!;
    const isManagerOfThisCar = user.positions.some(
      p => p.type === 'CAR' && p.id === id
    );
    
    if (!isManagerOfThisCar && !user.roles.includes('EQUIPE_TECNICA')) {
      throw new ForbiddenException('Você não é gestor desta CAR');
    }
    
    // Atualizar CAR
  }
}
```

---

## 📋 Exemplos Práticos

### Exemplo 1: Rota Pública
```typescript
@Controller('public')
export class PublicController {
  @Get('info')
  async getInfo() {
    // Sem guards - acesso público
  }
}
```

### Exemplo 2: Rota Autenticada
```typescript
@Controller('members')
@UseGuards(AuthorizationGuard)
export class MembersController {
  @Get()
  async getAllMembers() {
    // Qualquer usuário autenticado pode acessar
  }
}
```

### Exemplo 3: Apenas EQUIPE_TECNICA
```typescript
@Controller('admin')
@UseGuards(AuthorizationGuard)
export class AdminController {
  @Post('settings')
  @Roles('EQUIPE_TECNICA')
  async updateSettings() {
    // Apenas EQUIPE_TECNICA
  }
}
```

### Exemplo 4: Matrícula Ativa
```typescript
@Controller('academic')
@UseGuards(AuthorizationGuard)
export class AcademicController {
  @Get('my-grades')
  @RequireActive()
  async getMyGrades() {
    // Apenas membros com matrícula ativa
  }
}
```

### Exemplo 5: Posição Específica
```typescript
@Controller('courses')
@UseGuards(AuthorizationGuard)
export class CoursesController {
  @Put(':id/settings')
  @RequirePosition('DIRIGENTE')
  async updateCourseSettings(@Param('id') id: string, @Req() req: Request) {
    const user = req.user!;
    
    // Validar se é dirigente DESTE curso
    const isDirigenteOfThisCourse = user.positions.some(
      p => p.type === 'DIRIGENTE' && p.id === id
    );
    
    if (!isDirigenteOfThisCourse && !user.roles.includes('EQUIPE_TECNICA')) {
      throw new ForbiddenException('Você não é dirigente deste curso');
    }
    
    // Atualizar configurações
  }
}
```

### Exemplo 6: Múltiplas Validações
```typescript
@Controller('advanced')
@UseGuards(AuthorizationGuard)
export class AdvancedController {
  @Post('action')
  @RequireActive()
  @RequirePosition('CAR')
  async specialAction() {
    // Precisa ter matrícula ativa E ser gestor de CAR
  }
}
```

### Exemplo 7: Próprio Usuário ou Admin
```typescript
@Controller('members')
@UseGuards(AuthorizationGuard)
export class MembersController {
  @Put(':id')
  async updateMember(@Param('id') id: string, @Req() req: Request) {
    const user = req.user!;
    
    // Apenas o próprio membro ou EQUIPE_TECNICA
    if (user.id !== id && !user.roles.includes('EQUIPE_TECNICA')) {
      throw new ForbiddenException('Você não pode atualizar este membro');
    }
    
    // Atualizar membro
  }
}
```

---

## 🔑 Acessando Dados do Usuário

### No Controller
```typescript
import { Request } from 'express';

@Controller('example')
@UseGuards(AuthorizationGuard)
export class ExampleController {
  @Get('me')
  async getMe(@Req() req: Request) {
    const user = req.user!; // JWTPayload
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      roles: user.roles,
      positions: user.positions,
    };
  }
}
```

### Verificar Role
```typescript
const isTechTeam = user.roles.includes('EQUIPE_TECNICA');
const isExternal = user.roles.includes('EXTERNO');
```

### Verificar Status
```typescript
const hasActiveEnrollment = user.isActive;
```

### Verificar Posição
```typescript
const isCAR = user.positions.some(p => p.type === 'CAR');
const isDirigente = user.positions.some(p => p.type === 'DIRIGENTE');

// Posição específica
const isManagerOfThisCAR = user.positions.some(
  p => p.type === 'CAR' && p.id === carId
);
```

---

## ⚠️ Regras Importantes

### 1. EQUIPE_TECNICA tem Bypass Total
```typescript
// EQUIPE_TECNICA ignora TODAS as validações
if (user.roles.includes('EQUIPE_TECNICA')) {
  // Acesso garantido
}
```

### 2. Ordem de Validação
O AuthorizationGuard valida nesta ordem:
1. ✅ Autenticação (JWT válido)
2. ✅ EQUIPE_TECNICA? → Bypass total
3. ✅ Roles requeridas
4. ✅ Status ativo
5. ✅ Posições

### 3. Sempre Use @UseGuards
```typescript
// ❌ ERRADO - decorator sem guard
@Roles('EQUIPE_TECNICA')
async method() {}

// ✅ CORRETO - guard + decorator
@UseGuards(AuthorizationGuard)
@Roles('EQUIPE_TECNICA')
async method() {}
```

### 4. Validação Contextual
Para validar posição específica (ex: "é gestor DESTA CAR?"), faça validação manual no controller:

```typescript
@Put(':id')
@RequirePosition('CAR') // Valida que TEM posição CAR
async update(@Param('id') id: string, @Req() req: Request) {
  const user = req.user!;
  
  // Validar se é gestor DESTA CAR específica
  const isManagerOfThisCar = user.positions.some(
    p => p.type === 'CAR' && p.id === id
  );
  
  if (!isManagerOfThisCar && !user.roles.includes('EQUIPE_TECNICA')) {
    throw new ForbiddenException('Acesso negado');
  }
  
  // Continuar...
}
```

---

## 🎨 Boas Práticas

### 1. Use Guards no Nível do Controller
```typescript
@Controller('members')
@UseGuards(AuthorizationGuard) // Aplica a todos os endpoints
export class MembersController {
  // Todos os métodos são protegidos
}
```

### 2. Combine Decorators
```typescript
@Post('action')
@RequireActive()
@RequirePosition('DIRIGENTE')
@Roles('EQUIPE_TECNICA') // Redundante, mas explícito
async action() {}
```

### 3. Documente Requisitos
```typescript
@Post('create')
@Roles('EQUIPE_TECNICA')
@ApiOperation({ 
  summary: 'Create resource (EQUIPE_TECNICA only)',
  description: 'Only technical team can create this resource'
})
async create() {}
```

### 4. Mensagens de Erro Claras
```typescript
if (!hasPermission) {
  throw new ForbiddenException(
    'Você não tem permissão para executar esta ação. ' +
    'Requer: EQUIPE_TECNICA ou gestor desta CAR'
  );
}
```

---

## 📊 Matriz de Acesso

| Endpoint | Público | Autenticado | Ativo | Posição | EQUIPE_TECNICA |
|----------|---------|-------------|-------|---------|----------------|
| POST /auth/login | ✅ | - | - | - | - |
| POST /members | ✅ | - | - | - | - |
| GET /members | - | ✅ | - | - | - |
| PUT /members/:id | - | ✅* | - | - | ✅ |
| POST /members/:id/roles | - | - | - | - | ✅ |
| GET /courses/my | - | ✅ | ✅ | - | - |
| PUT /courses/:id | - | ✅ | - | DIRIGENTE | ✅ |
| PUT /cars/:id | - | ✅ | - | CAR | ✅ |
| POST /caes | - | - | - | - | ✅ |

*Próprio usuário ou EQUIPE_TECNICA

---

**Documentação completa e pronta para uso!** 🎯
