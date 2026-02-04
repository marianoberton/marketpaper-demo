# Plan de Testing - FOMO Platform

## Estado Actual: 210 tests ✅

### Tests completados

| Archivo | Tests | Qué cubre |
|---------|-------|-----------|
| `lib/__tests__/auth-types.test.ts` | 44 | Permisos por rol, jerarquía, helpers de acceso |
| `lib/__tests__/encryption.test.ts` | 25 | Cifrado AES-256-GCM, credenciales |
| `lib/__tests__/formatters.test.ts` | 33 | Moneda ARS, porcentajes, m², tiempo |
| `lib/__tests__/construction.test.ts` | 44 | Informes de dominio, seguros, impuestos |
| `lib/__tests__/construction-deadlines.test.ts` | 21 | Plazos, urgencia, vencimientos |
| `app/api/workspace/tickets/__tests__/tickets.test.ts` | 43 | Permisos, validación, paginación, mensajes |

### Funciones helper creadas (100% testeadas)

```typescript
// lib/auth-types.ts - Funciones puras reutilizables
hasPermission(role, permission)           // Verificar un permiso
hasAllPermissions(role, permissions[])    // Verificar múltiples
hasAnyPermission(role, permissions[])     // Verificar al menos uno
canManageRole(actorRole, targetRole)      // Jerarquía de roles
hasCompanyAccess(role, userCo, resourceCo) // Multi-tenant
hasTicketAccess(...)                       // Acceso a tickets
getAssignableRoles(role)                   // Roles asignables
isSuperAdminRole(role)                     // Es super admin?
isAdminRole(role)                          // Tiene admin_access?
```

---

## Qué sigue

### Siguiente paso recomendado: Tests de APIs

| API | Prioridad | Estado |
|-----|-----------|--------|
| `tickets/` | Alta | ✅ Completo |
| `tickets/[id]/messages/` | Alta | ✅ Completo |
| `finanzas/expenses/` | Media | Pendiente |
| `finanzas/categories/` | Media | Pendiente |

### Pendiente a futuro

1. **Integraciones externas**
   - HubSpot: sincronización, rate limits
   - Slack: notificaciones

2. **Hooks**
   - `useDirectFileUpload` - upload de archivos

3. **Componentes React** (opcional)
   - Solo si hay lógica compleja que testear

---

## Notas

### CRM
El CRM actual (`crm-multitenant.ts`) será renombrado a **CRM FOMO** (uso interno).
Se creará un CRM simplificado para clientes en el futuro.

### Estrategia
- **Funciones puras**: Testear directamente
- **Con Supabase**: Extraer lógica a funciones puras o mockear
- **API Routes**: Testear validación y permisos (sin DB)

---

## Comandos

```bash
npm test          # Watch mode
npm run test:run  # Una sola ejecución (CI)
```
