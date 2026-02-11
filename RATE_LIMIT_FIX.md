# Fix: Rate Limit de HubSpot en Reporte Diario

## Problema identificado

Durante la presentación, el **Reporte Diario** falló con error:
```
Error 429: "You have reached your ten_secondly_rolling limit"
```

**Causa:** HubSpot limita a **10 llamadas cada 10 segundos**. El reporte diario hacía múltiples llamadas rápidas al:
- Paginar deals (20 por página)
- Obtener companies asociadas a cada deal
- Analizar precios de todos los deals

## Soluciones implementadas

### 1. ✅ Delay entre páginas
**Archivo:** `actions/hubspot-price-analysis.ts`
- Agregado delay de 1.5 segundos entre páginas de paginación
- Esto previene alcanzar el límite de 10 llamadas/10s

```typescript
if (pageCount > 1) {
  console.log('[getDailyReportData] Waiting 1.5s to avoid rate limit...')
  await new Promise(resolve => setTimeout(resolve, 1500))
}
```

### 2. ✅ Caché en memoria
**Archivo:** `actions/hubspot-price-analysis.ts`
- Caché de 5 minutos para el reporte diario
- Evita hacer la misma llamada múltiples veces
- Se resetea al reiniciar el servidor

```typescript
const reportCache = new Map<string, { data: DailyReportData; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos
```

### 3. ✅ Mensaje de error mejorado
**Archivo:** `actions/hubspot-price-analysis.ts`
- Detecta error 429 y muestra mensaje claro al usuario
- "HubSpot está limitando las llamadas a la API. Por favor espera 10 segundos e intenta nuevamente."

### 4. ✅ Countdown para reintentar
**Archivo:** `app/(workspace)/workspace/hubspot/components/daily-report.tsx`
- Botón "Reintentar" deshabilitado por 12 segundos después de rate limit
- Countdown visible para el usuario
- Icono animado durante el countdown

### 5. ✅ Logging detallado
**Archivos:** Ambos archivos
- Logs en cada paso del proceso
- Permite identificar exactamente dónde falla
- Formato: `[DailyReport]` y `[getDailyReportData]`

## Cómo probar

1. Navega por varias pestañas de HubSpot para consumir llamadas de API
2. Entra al Reporte Diario
3. Si hay rate limit:
   - Verás mensaje claro
   - Botón deshabilitado con countdown
   - Al terminar el countdown, podrás reintentar

## Rate limits de HubSpot

| Límite | Valor actual | Observaciones |
|--------|--------------|---------------|
| ten_secondly_rolling | 10 llamadas / 10s | **El que estábamos alcanzando** |
| secondly | 10 llamadas / 1s | También estricto |
| interval_milliseconds | 10,000 ms | Ventana de evaluación |
| max | 100 llamadas | Por ventana |
| daily | 250,000 | No es problema |

## Recomendaciones futuras

### Corto plazo
- ✅ Implementadas todas las mejoras básicas

### Mediano plazo
- [ ] Implementar sistema de cola para llamadas a HubSpot
- [ ] Agregar caché en Supabase para datos que cambian poco
- [ ] Usar batch endpoints de HubSpot cuando sea posible

### Largo plazo
- [ ] Considerar webhooks de HubSpot para sincronización en tiempo real
- [ ] Implementar caché distribuido (Redis/Upstash)
- [ ] Background jobs para refrescar caché automáticamente

## Testing

### Escenario 1: Primera carga
- ✅ Debe cargar sin problemas (con delays)
- ✅ Debe cachear el resultado

### Escenario 2: Reload inmediato
- ✅ Debe usar caché
- ✅ No debe hacer llamadas a HubSpot

### Escenario 3: Rate limit alcanzado
- ✅ Mensaje claro al usuario
- ✅ Countdown de 12 segundos
- ✅ Botón habilitado después del countdown

### Escenario 4: Cambio de fecha
- ✅ Nuevo fetch (diferente cache key)
- ✅ Delays aplicados

## Estado actual

✅ **RESUELTO** - El reporte diario ahora maneja correctamente el rate limiting de HubSpot.

---

**Última actualización:** 2026-02-10
**Autor:** Claude Code
