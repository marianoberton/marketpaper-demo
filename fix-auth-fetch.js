/**
 * Script para diagnosticar y corregir el problema de autenticación en fetch calls
 */

const fs = require('fs');
const path = require('path');

// Función para buscar archivos con fetch calls
function findFetchCalls(dir, results = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findFetchCalls(filePath, results);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Buscar fetch calls que no incluyen credentials
      const fetchMatches = content.match(/fetch\s*\([^)]+\)/g);
      if (fetchMatches) {
        fetchMatches.forEach(match => {
          if (!match.includes('credentials') && match.includes('/api/')) {
            results.push({
              file: filePath,
              match: match,
              line: content.split('\n').findIndex(line => line.includes(match)) + 1
            });
          }
        });
      }
    }
  }
  
  return results;
}

console.log('🔍 Buscando llamadas fetch sin credentials...\n');

const projectDir = process.cwd();
const fetchCalls = findFetchCalls(projectDir);

if (fetchCalls.length > 0) {
  console.log(`❌ Encontradas ${fetchCalls.length} llamadas fetch sin credentials:\n`);
  
  fetchCalls.forEach((call, index) => {
    console.log(`${index + 1}. ${call.file}:${call.line}`);
    console.log(`   ${call.match}\n`);
  });
  
  console.log('💡 Solución: Agregar credentials: "include" a todas las llamadas fetch a /api/\n');
  console.log('Ejemplo:');
  console.log('fetch("/api/endpoint", {');
  console.log('  method: "DELETE",');
  console.log('  credentials: "include", // ← Agregar esta línea');
  console.log('  headers: { "Content-Type": "application/json" }');
  console.log('})');
  
} else {
  console.log('✅ No se encontraron problemas obvios con fetch calls');
}