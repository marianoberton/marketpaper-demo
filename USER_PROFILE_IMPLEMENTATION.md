# Implementación de Perfiles de Usuario Extendidos

## Resumen

Se ha expandido el sistema de perfiles de usuario para incluir información personalizada adicional y mejorar los mensajes de bienvenida en la plataforma.

## Cambios Implementados

### 1. Migración de Base de Datos

**Archivo:** `supabase/migrations/0052_expand_user_profiles.sql`

Se agregaron los siguientes campos a la tabla `user_profiles`:

- `gender` (VARCHAR(20)): Género del usuario ('male', 'female', 'non-binary', 'prefer-not-say', 'other')
- `phone` (VARCHAR(20)): Número de teléfono de contacto
- `position` (VARCHAR(100)): Puesto o cargo en la empresa
- `department` (VARCHAR(100)): Departamento o área
- `bio` (TEXT): Biografía o descripción personal
- `birthday` (DATE): Fecha de nacimiento (para saludos y celebraciones)

### 2. API Route de Perfil Personal

**Archivos:**
- `app/api/user/profile/route.ts`

Nueva API route que permite a los usuarios:
- **GET:** Obtener su propio perfil completo
- **PUT:** Actualizar su información personal (campos permitidos):
  - `full_name`
  - `phone`
  - `position`
  - `department`
  - `bio`
  - `birthday`
  - `gender`
  - `avatar_url`
  - `timezone`
  - `locale`
  - `preferences`

**Seguridad:**
- Cada usuario solo puede editar su propio perfil
- No puede modificar campos sensibles como `role`, `company_id`, o `status`

### 3. Página de Perfil Personal

**Archivos:**
- `app/(workspace)/workspace/settings/profile/page.tsx`
- `app/(workspace)/workspace/settings/profile/client-page.tsx`

Nueva página accesible en `/workspace/settings/profile` donde cada usuario puede:
- Ver y editar su información personal:
  - Nombre completo
  - Teléfono
  - Género
  - Fecha de nacimiento
  - Biografía
- Ver y editar información laboral:
  - Puesto/cargo
  - Departamento/área
- Ver información de cuenta (solo lectura):
  - Email
  - Rol

**Características:**
- Interfaz responsive (mobile-first)
- Validación de campos requeridos (nombre)
- Feedback visual durante el guardado
- Botón de cancelar que restaura los valores originales

### 4. Mensajes de Bienvenida Personalizados

**Archivos modificados:**
- `components/workspace-context.tsx`
- `app/(workspace)/workspace/workspace-dashboard.tsx`
- `lib/auth-types.ts`

#### Workspace Context

Se extendió el contexto para incluir:
- `userGender`: Género del usuario
- `userPosition`: Puesto del usuario
- `userDepartment`: Departamento del usuario

#### Dashboard Personalizado

El dashboard ahora muestra:

**Saludo personalizado según género:**
- Femenino: "Bienvenida, [Nombre]"
- Masculino: "Bienvenido, [Nombre]"
- No binario: "Bienvenid@, [Nombre]"
- Sin especificar: "Bienvenid@, [Nombre]"

**Descripción personalizada:**
- Muestra el puesto y departamento del usuario si están disponibles
- Formato: "[Puesto] • [Departamento] · X módulos disponibles"
- Fallback: "[Nombre de la Empresa] · X módulos disponibles"

**Ejemplos:**

Sin información personal:
```
Bienvenid@, Juan
INTED · 8 módulos disponibles
```

Con información personal completa:
```
Bienvenida, María
Gerente de Ventas • Comercial · 8 módulos disponibles
```

## Acceso a la Funcionalidad

1. **Editar perfil:** Los usuarios pueden acceder directamente a `/workspace/settings/profile`
2. **API de perfil:**
   - GET `/api/user/profile` - Obtener perfil actual
   - PUT `/api/user/profile` - Actualizar perfil

## Próximos Pasos (Opcionales)

1. **Agregar enlace en navegación:**
   - Agregar "Mi Perfil" en el menú del usuario en workspace-layout
   - O agregar como subopción de "Settings" en la navegación principal

2. **Saludos por cumpleaños:**
   - Detectar cumpleaños del día y mostrar mensaje especial en el dashboard
   - Notificación de cumpleaños de compañeros de equipo

3. **Avatar personalizado:**
   - Permitir subir foto de perfil
   - Integrar con Supabase Storage

4. **Directorio de equipo:**
   - Página que muestre todos los miembros del equipo con su información
   - Filtros por departamento, puesto, etc.

## Pruebas

Para probar la funcionalidad:

1. **Aplicar migración:**
   ```bash
   # Si usas Supabase local
   supabase migration up

   # Si es producción, la migración debe aplicarse manualmente
   ```

2. **Acceder al perfil:**
   - Ir a `/workspace/settings/profile`
   - Completar la información personal
   - Guardar cambios

3. **Verificar personalización:**
   - Regresar al dashboard (`/workspace`)
   - El mensaje de bienvenida debe reflejar el género y cargo configurados

## Notas Importantes

- **Base de datos de producción:** Recordar que según CLAUDE.md, la base de datos conectada es de PRODUCCIÓN
- **Migración aditiva:** La migración `0052` es puramente aditiva (solo agrega columnas), no modifica datos existentes
- **Retrocompatibilidad:** Los usuarios existentes verán valores null en los nuevos campos hasta que actualicen su perfil
- **Privacidad:** La fecha de nacimiento se almacena completa para futuros saludos automáticos, pero podría modificarse para almacenar solo mes y día si se prefiere
