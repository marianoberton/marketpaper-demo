-- =============================================
-- RECALCULAR SCORES DE LEADS EXISTENTES
-- Ejecutar SOLO después de aplicar update_pyme_scoring_function.sql
-- =============================================

-- Verificar cuántos leads existen antes del update
SELECT 
  COUNT(*) as total_leads,
  AVG(lead_score) as score_promedio_actual,
  COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgentes,
  COUNT(CASE WHEN priority = 'high' THEN 1 END) as altas,
  COUNT(CASE WHEN priority = 'medium' THEN 1 END) as medias,
  COUNT(CASE WHEN priority = 'low' THEN 1 END) as bajas
FROM pyme_leads;

-- Actualizar todos los scores y prioridades existentes
UPDATE pyme_leads 
SET 
  lead_score = calculate_pyme_lead_score(
    monthly_revenue,
    position,
    how_found_us,
    website,
    additional_info
  ),
  priority = calculate_pyme_priority(
    calculate_pyme_lead_score(monthly_revenue, position, how_found_us, website, additional_info),
    position,
    monthly_revenue,
    how_found_us
  ),
  updated_at = NOW()
WHERE id IS NOT NULL;

-- Verificar resultados después del update
SELECT 
  COUNT(*) as total_leads,
  AVG(lead_score) as score_promedio_nuevo,
  COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgentes,
  COUNT(CASE WHEN priority = 'high' THEN 1 END) as altas,
  COUNT(CASE WHEN priority = 'medium' THEN 1 END) as medias,
  COUNT(CASE WHEN priority = 'low' THEN 1 END) as bajas
FROM pyme_leads;

-- Ver distribución de scores por rango de facturación
SELECT 
  monthly_revenue,
  COUNT(*) as cantidad,
  AVG(lead_score) as score_promedio,
  MODE() WITHIN GROUP (ORDER BY priority) as prioridad_mas_comun
FROM pyme_leads 
GROUP BY monthly_revenue 
ORDER BY AVG(lead_score) DESC; 