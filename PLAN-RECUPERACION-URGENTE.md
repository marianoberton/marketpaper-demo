# 🚨 PLAN DE RECUPERACIÓN URGENTE - MÓDULO CONSTRUCCIÓN

## PROBLEMAS IDENTIFICADOS

### 1. ❌ Variables de Entorno Incorrectas
- Las claves de Supabase en `.env.local` son de ejemplo
- Sin conexión válida a la base de datos
- **IMPACTO**: No se pueden consultar ni recuperar datos

### 2. ❌ Datos Perdidos
- Clientes del módulo construcción: **0 encontrados**
- Proyectos del módulo construcción: **0 encontrados**
- **IMPACTO CRÍTICO**: Pérdida total de datos de trabajo

### 3. ❌ Archivos Grandes
- Problemas con carga de archivos grandes
- Posibles límites de bucket insuficientes
- **IMPACTO**: No se pueden subir documentos importantes

---

## 🔧 SOLUCIÓN PASO A PASO

### PASO 1: CONFIGURAR CLAVES REALES DE SUPABASE (URGENTE)

**ACCIÓN INMEDIATA REQUERIDA:**

1. **Ir al Dashboard de Supabase:**
   - Visita: https://supabase.com/dashboard
   - Inicia sesión en tu cuenta
   - Selecciona tu proyecto

2. **Obtener las Claves:**
   - Ve a `Settings` > `API`
   - Copia la **URL del proyecto**
   - Copia la **clave `anon public`**
   - Copia la **clave `service_role`** (¡CONFIDENCIAL!)

3. **Actualizar `.env.local`:**
   ```bash
   # Reemplaza estos valores con tus claves reales:
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_real
   SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role_real
   ```

4. **Reiniciar el servidor:**
   ```bash
   # Detener el servidor actual
   Ctrl+C
   # Reiniciar
   npm run dev
   ```

### PASO 2: VERIFICAR RECUPERACIÓN DE DATOS

**Después de configurar las claves reales:**

```bash
# Ejecutar verificación de datos
node check-data.js
```

**Resultados esperados:**
- ✅ Conexión exitosa a Supabase
- 📊 Conteo real de proyectos y clientes
- 🔍 Identificación de datos recuperables

### PASO 3: CONFIGURAR BUCKETS PARA ARCHIVOS GRANDES

**Si tienes acceso al SQL Editor de Supabase:**

1. **Ejecutar script de configuración:**
   ```sql
   -- Ejecutar el contenido de fix-storage-buckets.sql
   -- Esto configurará límites de 50MB para todos los buckets
   ```

2. **Verificar configuración:**
   ```sql
   -- Ejecutar el contenido de verify_file_limits.sql
   -- Para confirmar que los límites están correctos
   ```

### PASO 4: RECUPERACIÓN DE DATOS (SI ES NECESARIO)

**Si los datos no aparecen después del Paso 1:**

1. **Verificar backups de Supabase:**
   - Dashboard > Settings > Database > Backups
   - Buscar backup reciente antes de la pérdida

2. **Verificar otras compañías:**
   - Los datos podrían estar en otra compañía
   - Verificar con `company_id` diferente

3. **Restaurar desde backup:**
   - Si existe backup, restaurar desde Supabase Dashboard
   - Contactar soporte de Supabase si es necesario

---

## 🚀 ACCIONES INMEDIATAS

### PRIORIDAD 1 (HACER AHORA):
- [ ] **Configurar claves reales de Supabase en `.env.local`**
- [ ] **Reiniciar servidor de desarrollo**
- [ ] **Ejecutar `node check-data.js` para verificar datos**

### PRIORIDAD 2 (DESPUÉS DE RECUPERAR ACCESO):
- [ ] **Ejecutar scripts de configuración de buckets**
- [ ] **Probar carga de archivos grandes**
- [ ] **Verificar que todos los módulos funcionan**

### PRIORIDAD 3 (PREVENCIÓN):
- [ ] **Configurar backups automáticos**
- [ ] **Documentar configuración**
- [ ] **Crear script de verificación diaria**

---

## 📞 CONTACTOS DE EMERGENCIA

- **Supabase Support**: https://supabase.com/support
- **Documentación**: https://supabase.com/docs
- **Status Page**: https://status.supabase.com

---

## ⚠️ NOTAS IMPORTANTES

1. **NUNCA** compartas la clave `service_role` públicamente
2. **SIEMPRE** haz backup antes de ejecutar scripts SQL
3. **VERIFICA** que estás en el proyecto correcto de Supabase
4. **DOCUMENTA** cualquier cambio que hagas

---

## 🔄 ESTADO ACTUAL

- ✅ Archivo `.env.local` creado con estructura correcta
- ✅ Scripts de verificación preparados
- ✅ Scripts de configuración de buckets listos
- ❌ **PENDIENTE: Configurar claves reales de Supabase**
- ❌ **PENDIENTE: Verificar recuperación de datos**
- ❌ **PENDIENTE: Configurar límites de archivos grandes**

**PRÓXIMO PASO**: Configurar las claves reales de Supabase en `.env.local`