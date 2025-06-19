# 🚀 FOMO CRM - Guía de Implementación Rápida

## ⚡ Configuración en 30 Minutos

### 📋 **Paso 1: Configurar Supabase (5 minutos)**

1. **Crear proyecto en Supabase**
   ```bash
   # Ve a https://supabase.com
   # Crea un nuevo proyecto
   # Anota la URL y las API Keys
   ```

2. **Ejecutar script de base de datos**
   ```sql
   # Copia todo el contenido de supabase-setup.sql
   # Pégalo en el SQL Editor de Supabase
   # Ejecuta el script completo
   ```

3. **Verificar tablas creadas**
   ```
   ✅ leads
   ✅ contacts  
   ✅ activities
   ✅ pipeline
   ✅ campaigns
   ```

### 🔧 **Paso 2: Variables de Entorno (5 minutos)**

1. **Crear archivo .env.local**
   ```bash
   # Copia env-example.txt como .env.local
   cp env-example.txt .env.local
   ```

2. **Configurar Supabase (MÍNIMO REQUERIDO)**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
   ```

3. **Instalar dependencias**
   ```bash
   npm install @supabase/supabase-js
   ```

### 🌐 **Paso 3: Conectar tu Web (10 minutos)**

1. **Agregar script a tu web**
   ```html
   <!-- En el <head> de tu web -->
   <script src="https://tu-dominio.com/fomo-lead-capture.js"></script>
   <script>
     FomoLeadCapture.init({
       webhookUrl: 'https://tu-dominio.com/api/webhook/leads',
       trackingEnabled: true,
       autoCapture: true,
       debug: true // Solo para testing
     });
   </script>
   ```

2. **Marcar formularios para captura**
   ```html
   <!-- Opción 1: Agregar atributo data -->
   <form data-fomo-capture>
     <input name="name" placeholder="Nombre" required>
     <input name="email" placeholder="Email" required>
     <input name="phone" placeholder="Teléfono">
     <input name="company" placeholder="Empresa">
     <textarea name="message" placeholder="Mensaje"></textarea>
     <button type="submit">Enviar</button>
   </form>

   <!-- Opción 2: Usar clases CSS reconocidas -->
   <form class="contact-form">
     <!-- campos del formulario -->
   </form>

   <!-- Opción 3: Usar IDs reconocidos -->
   <form id="contact">
     <!-- campos del formulario -->
   </form>
   ```

### 📱 **Paso 4: Configurar Redes Sociales (10 minutos)**

#### **Facebook/Instagram Lead Ads**

1. **Crear App en Facebook Developers**
   ```
   1. Ve a https://developers.facebook.com/
   2. Crea nueva app tipo "Business"
   3. Agrega producto "Webhooks"
   4. Configura webhook: https://tu-dominio.com/api/webhook/meta
   5. Suscríbete a "leadgen" events
   ```

2. **Configurar variables**
   ```env
   META_APP_ID=tu_app_id
   META_APP_SECRET=tu_app_secret
   META_ACCESS_TOKEN=tu_access_token
   META_VERIFY_TOKEN=mi_token_seguro_123
   ```

#### **WhatsApp Business (Opcional)**

1. **Configurar en Meta Business Manager**
   ```
   1. Ve a Meta Business Manager
   2. Configura WhatsApp Business API
   3. Obtén Phone Number ID y Access Token
   4. Configura webhook: https://tu-dominio.com/api/webhook/whatsapp
   ```

2. **Agregar variables**
   ```env
   WHATSAPP_ACCESS_TOKEN=tu_whatsapp_token
   WHATSAPP_PHONE_NUMBER_ID=tu_phone_id
   WHATSAPP_VERIFY_TOKEN=mi_whatsapp_token_123
   ```

## 🧪 **Testing y Verificación**

### **1. Probar Captura Web**
```javascript
// Abre la consola de tu navegador en tu web
// Llena un formulario y envía
// Deberías ver en la consola:
[FOMO Lead Capture] Lead sent successfully: {leadId: "...", score: 75}
```

### **2. Verificar en Supabase**
```sql
-- Ejecuta en Supabase SQL Editor
SELECT * FROM leads ORDER BY created_at DESC LIMIT 5;
```

### **3. Probar Webhooks**
```bash
# Para desarrollo local, usa ngrok
npm install -g ngrok
ngrok http 3000

# Usa la URL de ngrok para configurar webhooks
# Ejemplo: https://abc123.ngrok.io/api/webhook/leads
```

## 📊 **Verificar Funcionamiento**

### **✅ Checklist de Verificación**

- [ ] **Base de datos**: Tablas creadas en Supabase
- [ ] **Variables**: .env.local configurado
- [ ] **Web**: Script instalado y funcionando
- [ ] **Formularios**: Captura automática activa
- [ ] **Webhooks**: Endpoints respondiendo
- [ ] **Leads**: Aparecen en dashboard CRM
- [ ] **Scoring**: Leads tienen puntuación automática
- [ ] **Notificaciones**: Slack configurado (opcional)

### **🔍 Debugging**

1. **Leads no aparecen**
   ```javascript
   // Verificar en consola del navegador
   FomoLeadCapture.configure({ debug: true });
   ```

2. **Webhooks no funcionan**
   ```bash
   # Verificar logs en Vercel/hosting
   # Verificar que las URLs sean accesibles públicamente
   ```

3. **Errores de Supabase**
   ```javascript
   // Verificar en Network tab del navegador
   // Verificar RLS policies en Supabase
   ```

## 🚀 **Próximos Pasos**

### **Inmediato (Hoy)**
1. ✅ Configurar Supabase
2. ✅ Conectar formulario web
3. ✅ Verificar captura de leads

### **Esta Semana**
1. 📱 Configurar Facebook/Instagram Lead Ads
2. 💬 Configurar WhatsApp Business
3. 📧 Configurar notificaciones Slack
4. 📈 Configurar Google Analytics

### **Próxima Semana**
1. 🎯 Optimizar lead scoring
2. 🔄 Configurar automatizaciones
3. 📊 Configurar reportes avanzados
4. 🔗 Integrar con herramientas adicionales

## 🆘 **Soporte Rápido**

### **Problemas Comunes**

1. **"Webhook URL not configured"**
   ```
   Solución: Verificar NEXT_PUBLIC_SUPABASE_URL en .env.local
   ```

2. **"CORS error"**
   ```
   Solución: Verificar que el dominio esté en la whitelist de Supabase
   ```

3. **"Form missing required fields"**
   ```
   Solución: Asegurar que los campos tengan name="email" y name="name"
   ```

4. **"Meta webhook verification failed"**
   ```
   Solución: Verificar META_VERIFY_TOKEN coincida en ambos lados
   ```

### **URLs de Verificación**

- **Webhook Leads**: `https://tu-dominio.com/api/webhook/leads`
- **Webhook Meta**: `https://tu-dominio.com/api/webhook/meta`
- **Webhook WhatsApp**: `https://tu-dominio.com/api/webhook/whatsapp`
- **CRM Dashboard**: `https://tu-dominio.com/workspace/crm`

## 🎯 **Resultado Final**

Al completar esta guía tendrás:

✅ **CRM completamente funcional** con Supabase  
✅ **Captura automática** desde tu web  
✅ **Lead scoring** automático  
✅ **Integración** con redes sociales  
✅ **Dashboard** para gestión de leads  
✅ **Pipeline** de ventas operativo  
✅ **Notificaciones** en tiempo real  

**¡Tu CRM estará listo para capturar y gestionar leads desde el primer día!** 🚀