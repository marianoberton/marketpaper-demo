const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Cargar variables de entorno desde .env
const envContent = fs.readFileSync('.env', 'utf8');
const envLines = envContent.split('\n');
envLines.forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...parts] = trimmed.split('=');
    if (key && parts.length > 0) {
      process.env[key] = parts.join('=').replace(/^[\"']|[\"']$/g, '');
    }
  }
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestProject() {
  try {
    console.log('🔄 Creando proyecto de prueba...');
    
    // Insertar el proyecto
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .upsert({
        id: '33333333-3333-3333-3333-333333333333',
        company_id: '57bffb9f-78ba-4252-a9ea-10adf83c3155',
        name: 'Proyecto de Prueba - Prefactibilidad',
        address: 'Dirección de Prueba 123',
        barrio: 'Barrio Test',
        ciudad: 'Ciudad Test',
        surface: 150.0,
        director_obra: 'Arq. Juan Pérez (Prueba)',
        builder: 'Constructora Test SA',
        current_stage: 'Prefactibilidad del proyecto',
        project_type: 'Obra Mayor',
        project_usage: 'Vivienda',
        notes: 'Proyecto creado automáticamente para pruebas de subida directa de archivos',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select();

    if (projectError) {
      console.error('❌ Error creando proyecto:', projectError);
      return;
    }

    console.log('✅ Proyecto creado exitosamente:', project);

    // Crear las secciones del proyecto
    const sections = [
      { name: 'Planos de Proyecto e Instalaciones', order: 1, icon: '📐', is_system: true },
      { name: 'Documentación Municipal y Gestoría', order: 2, icon: '🏛️', is_system: true },
      { name: 'Servicios Públicos', order: 3, icon: '⚡', is_system: true },
      { name: 'Profesionales Intervinientes', order: 4, icon: '👷', is_system: true },
      { name: 'Seguros y Documentación Administrativa', order: 5, icon: '📋', is_system: true },
      { name: 'Pagos y Comprobantes', order: 6, icon: '💰', is_system: true },
      { name: 'Verificaciones - Prefactibilidad del proyecto', order: 7, icon: '🔍', is_system: false }
    ];

    for (const section of sections) {
      const { error: sectionError } = await supabase
        .from('project_sections')
        .upsert({
          project_id: '33333333-3333-3333-3333-333333333333',
          name: section.name,
          order: section.order,
          icon: section.icon,
          is_system: section.is_system
        }, {
          onConflict: 'project_id,name'
        });

      if (sectionError) {
        console.error(`❌ Error creando sección "${section.name}":`, sectionError);
      } else {
        console.log(`✅ Sección "${section.name}" creada`);
      }
    }

    console.log('🎉 Proyecto de prueba configurado completamente');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

createTestProject();
