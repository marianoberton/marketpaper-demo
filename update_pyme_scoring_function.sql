-- =============================================
-- ACTUALIZAR FUNCIÓN DE SCORING PYME LEADS
-- Nuevos rangos de facturación mensual
-- =============================================

-- 1. ACTUALIZAR FUNCIÓN DE LEAD SCORING
CREATE OR REPLACE FUNCTION calculate_pyme_lead_score(
  monthly_revenue_val VARCHAR(100),
  position_val VARCHAR(255),
  how_found_us_val TEXT,
  website_val VARCHAR(255),
  additional_info_val TEXT
) RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  keyword_matches INTEGER := 0;
BEGIN
  -- 📊 Puntuación por facturación mensual (0-40 puntos) - NUEVOS RANGOS
  CASE 
    WHEN monthly_revenue_val ILIKE '%más de $500 millones%' OR monthly_revenue_val ILIKE '%+$500M%' THEN score := score + 40;
    WHEN monthly_revenue_val ILIKE '%$100 - $500 millones%' OR monthly_revenue_val ILIKE '%100-500M%' THEN score := score + 35;
    WHEN monthly_revenue_val ILIKE '%$50 - $100 millones%' OR monthly_revenue_val ILIKE '%50-100M%' THEN score := score + 30;
    WHEN monthly_revenue_val ILIKE '%$2 - $50 millones%' OR monthly_revenue_val ILIKE '%2-50M%' THEN score := score + 25;
    WHEN monthly_revenue_val ILIKE '%$500k - $2 millones%' OR monthly_revenue_val ILIKE '%500k-2M%' THEN score := score + 15;
    WHEN monthly_revenue_val ILIKE '%$100k - $500k%' OR monthly_revenue_val ILIKE '%100k-500k%' THEN score := score + 10;
    WHEN monthly_revenue_val ILIKE '%menos de $100k%' OR monthly_revenue_val ILIKE '%<100k%' THEN score := score + 0;
    ELSE score := score + 5;
  END CASE;

  -- 👤 Puntuación por puesto/cargo (0-25 puntos)
  CASE 
    WHEN position_val ILIKE '%CEO%' OR position_val ILIKE '%Fundador%' OR position_val ILIKE '%Founder%' OR position_val ILIKE '%Director General%' THEN score := score + 25;
    WHEN position_val ILIKE '%Director%' OR position_val ILIKE '%VP%' OR position_val ILIKE '%Vicepresidente%' THEN score := score + 20;
    WHEN position_val ILIKE '%Gerente%' OR position_val ILIKE '%Manager%' OR position_val ILIKE '%Jefe%' THEN score := score + 15;
    WHEN position_val ILIKE '%Coordinador%' OR position_val ILIKE '%Responsable%' OR position_val ILIKE '%Supervisor%' THEN score := score + 10;
    ELSE score := score + 5;
  END CASE;

  -- 🔍 Puntuación por cómo nos encontró (0-20 puntos)
  CASE 
    WHEN how_found_us_val ILIKE '%referencia%' OR how_found_us_val ILIKE '%recomendación%' THEN score := score + 20;
    WHEN how_found_us_val ILIKE '%linkedin%' THEN score := score + 18;
    WHEN how_found_us_val ILIKE '%google%' OR how_found_us_val ILIKE '%búsqueda%' THEN score := score + 15;
    WHEN how_found_us_val ILIKE '%redes sociales%' OR how_found_us_val ILIKE '%facebook%' OR how_found_us_val ILIKE '%instagram%' THEN score := score + 12;
    WHEN how_found_us_val ILIKE '%evento%' OR how_found_us_val ILIKE '%conferencia%' THEN score := score + 15;
    WHEN how_found_us_val ILIKE '%publicidad%' OR how_found_us_val ILIKE '%anuncio%' THEN score := score + 10;
    ELSE score := score + 5;
  END CASE;

  -- 🌐 Puntuación por tener website (0-10 puntos)
  IF website_val IS NOT NULL AND LENGTH(website_val) > 5 THEN
    score := score + 10;
  END IF;

  -- 📝 Puntuación por información adicional detallada (0-5 puntos)
  IF additional_info_val IS NOT NULL AND LENGTH(additional_info_val) > 50 THEN
    score := score + 5;
    
    -- Palabras clave de alta intención
    SELECT COUNT(*) INTO keyword_matches
    FROM unnest(ARRAY['urgente', 'inmediato', 'proyecto', 'presupuesto', 'cotización', 'contratar', 'necesitamos', 'queremos implementar']) AS keyword
    WHERE additional_info_val ILIKE '%' || keyword || '%';
    
    score := score + LEAST(keyword_matches * 2, 10);
  END IF;

  -- Asegurar que el score esté entre 0 y 100
  RETURN GREATEST(0, LEAST(score, 100));
END;
$$ LANGUAGE plpgsql;

-- 2. ACTUALIZAR FUNCIÓN DE PRIORIDAD CON CRITERIOS ESPECIALES
CREATE OR REPLACE FUNCTION calculate_pyme_priority(
  score INTEGER,
  position_val VARCHAR(255) DEFAULT NULL,
  monthly_revenue_val VARCHAR(100) DEFAULT NULL,
  how_found_us_val TEXT DEFAULT NULL
) RETURNS VARCHAR(20) AS $$
BEGIN
  -- 🚨 URGENTE: Score ≥90 O (CEO + facturación >$100M) O referencia
  IF score >= 90 THEN 
    RETURN 'urgent';
  END IF;
  
  -- Criterio especial: CEO + facturación >$100M
  IF (position_val ILIKE '%CEO%' OR position_val ILIKE '%Fundador%' OR position_val ILIKE '%Founder%') 
     AND (monthly_revenue_val ILIKE '%más de $500 millones%' 
          OR monthly_revenue_val ILIKE '%$100 - $500 millones%' 
          OR monthly_revenue_val ILIKE '%$50 - $100 millones%') THEN
    RETURN 'urgent';
  END IF;
  
  -- Criterio especial: Referencia directa
  IF how_found_us_val ILIKE '%referencia%' OR how_found_us_val ILIKE '%recomendación%' THEN
    RETURN 'urgent';
  END IF;
  
  -- 🔥 ALTA: Score ≥75
  IF score >= 75 THEN 
    RETURN 'high';
  END IF;
  
  -- ⚠️ MEDIA: Score ≥60
  IF score >= 60 THEN 
    RETURN 'medium';
  END IF;
  
  -- 📝 BAJA: Score <60
  RETURN 'low';
END;
$$ LANGUAGE plpgsql;

-- 3. ACTUALIZAR TRIGGER PARA USAR NUEVA FUNCIÓN DE PRIORIDAD
CREATE OR REPLACE FUNCTION trigger_calculate_pyme_lead_score() RETURNS TRIGGER AS $$
BEGIN
  -- Calcular score automáticamente
  NEW.lead_score := calculate_pyme_lead_score(
    NEW.monthly_revenue,
    NEW.position,
    NEW.how_found_us,
    NEW.website,
    NEW.additional_info
  );
  
  -- Calcular prioridad automáticamente con criterios especiales
  NEW.priority := calculate_pyme_priority(
    NEW.lead_score,
    NEW.position,
    NEW.monthly_revenue,
    NEW.how_found_us
  );
  
  -- Actualizar timestamp
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. RECALCULAR SCORES DE LEADS EXISTENTES (OPCIONAL)
-- Ejecutar solo si quieres actualizar leads ya existentes
/*
UPDATE pyme_leads 
SET lead_score = calculate_pyme_lead_score(
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
*/

-- ✅ SCRIPT COMPLETADO
-- Nuevos rangos de facturación:
-- • Más de $500 millones → 40 puntos
-- • $100 - $500 millones → 35 puntos  
-- • $50 - $100 millones → 30 puntos
-- • $2 - $50 millones → 25 puntos
-- • $500k - $2 millones → 15 puntos
-- • $100k - $500k → 10 puntos
-- • Menos de $100k → 0 puntos 