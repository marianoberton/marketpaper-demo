-- =============================================
-- ACTUALIZACIONES NECESARIAS EN ARCHIVOS WEB
-- Para coincidir con los nuevos rangos de facturación
-- =============================================

-- ESTOS NO SON SCRIPTS SQL, SON ACTUALIZACIONES PARA LOS ARCHIVOS WEB
-- Ejecutar estas actualizaciones DESPUÉS de aplicar update_pyme_scoring_function.sql

/* 
============================================= 
📝 ARCHIVO 1: public/pyme-lead-form-example.html
============================================= 

🔄 REEMPLAZAR las líneas 230-237:

ANTES:
                <option value="">Selecciona un rango</option>
                <option value="menos de $100k">Menos de $100k</option>
                <option value="$100k - $500k">$100k - $500k</option>
                <option value="$500k - $1 millón">$500k - $1 millón</option>
                <option value="$1 - $2 millones">$1 - $2 millones</option>
                <option value="$2 - $5 millones">$2 - $5 millones</option>
                <option value="$5 - $10 millones">$5 - $10 millones</option>
                <option value="más de $10 millones">Más de $10 millones</option>

POR:
                <option value="">Selecciona un rango</option>
                <option value="menos de $100k">Menos de $100k</option>
                <option value="$100k - $500k">$100k - $500k</option>
                <option value="$500k - $2 millones">$500k - $2 millones</option>
                <option value="$2 - $50 millones">$2 - $50 millones</option>
                <option value="$50 - $100 millones">$50 - $100 millones</option>
                <option value="$100 - $500 millones">$100 - $500 millones</option>
                <option value="más de $500 millones">Más de $500 millones</option>

============================================= 
📝 ARCHIVO 2: public/pyme-lead-widget.js
============================================= 

🔄 REEMPLAZAR las líneas 142-149:

ANTES:
                <select name="monthly_revenue" required>
                    <option value="">Facturación mensual *</option>
                    <option value="menos de $100k">Menos de $100k</option>
                    <option value="$100k - $500k">$100k - $500k</option>
                    <option value="$500k - $1 millón">$500k - $1 millón</option>
                    <option value="$1 - $2 millones">$1 - $2 millones</option>
                    <option value="$2 - $5 millones">$2 - $5 millones</option>
                    <option value="$5 - $10 millones">$5 - $10 millones</option>
                    <option value="más de $10 millones">Más de $10 millones</option>

POR:
                <select name="monthly_revenue" required>
                    <option value="">Facturación mensual *</option>
                    <option value="menos de $100k">Menos de $100k</option>
                    <option value="$100k - $500k">$100k - $500k</option>
                    <option value="$500k - $2 millones">$500k - $2 millones</option>
                    <option value="$2 - $50 millones">$2 - $50 millones</option>
                    <option value="$50 - $100 millones">$50 - $100 millones</option>
                    <option value="$100 - $500 millones">$100 - $500 millones</option>
                    <option value="más de $500 millones">Más de $500 millones</option>

============================================= 
🎯 NUEVO SISTEMA DE SCORING (CONFIRMACIÓN)
============================================= 

✅ Con estos cambios el sistema quedará así:

Facturación Mensual          | Puntos | Prioridad Especial
---------------------------- | ------ | ------------------
Más de $500 millones        | +40    | 🚨 Urgente (CEO)
$100 - $500 millones        | +35    | 🚨 Urgente (CEO)  
$50 - $100 millones         | +30    | 🚨 Urgente (CEO)
$2 - $50 millones           | +25    | -
$500k - $2 millones         | +15    | -
$100k - $500k               | +10    | -
Menos de $100k              | +0     | -

📊 Prioridades Finales:
🚨 Urgente: Score ≥90 O (CEO + facturación >$50M) O referencia
🔥 Alta: Score ≥75
⚠️ Media: Score ≥60  
📝 Baja: Score <60

============================================= 
📋 PASOS PARA APLICAR TODOS LOS CAMBIOS
============================================= 

1. 🔧 EJECUTAR EN SUPABASE SQL EDITOR:
   → update_pyme_scoring_function.sql

2. 📊 RECALCULAR LEADS EXISTENTES (OPCIONAL):
   → recalculate_existing_leads.sql

3. 🌐 ACTUALIZAR ARCHIVOS WEB:
   → public/pyme-lead-form-example.html (líneas 230-237)
   → public/pyme-lead-widget.js (líneas 142-149)

4. ✅ VERIFICAR:
   → Probar formulario con nuevos rangos
   → Verificar que el scoring funcione correctamente
   → Confirmar que las prioridades se asignen bien

✨ ¡Listo! El sistema estará actualizado con los nuevos rangos de PYMEs grandes.
*/ 