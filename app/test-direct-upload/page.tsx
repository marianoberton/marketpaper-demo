import { DirectFileUploadTest } from '@/components/DirectFileUploadTest';

export default function TestDirectUploadPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Prueba de Subida Directa</h1>
        <p className="text-gray-600">
          Esta página prueba la nueva implementación de subida directa a Supabase
          usando URLs firmadas, evitando el límite de 4.5MB de Vercel.
        </p>
      </div>
      
      <DirectFileUploadTest />
      
      <div className="mt-8 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Cómo funciona:</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>El frontend solicita una URL firmada al endpoint <code>/api/storage/create-upload-url</code></li>
          <li>El archivo se sube directamente desde el navegador a Supabase Storage</li>
          <li>No pasa por el servidor de Vercel, evitando el límite de 4.5MB</li>
          <li>Se obtiene la URL pública si el bucket es público</li>
        </ol>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Ventajas de esta implementación:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
            <li>Sin límites de tamaño de Vercel (hasta 50MB configurado en Supabase)</li>
            <li>Subida directa más rápida</li>
            <li>Menos carga en el servidor</li>
            <li>Funciona tanto en desarrollo como en producción</li>
          </ul>
        </div>
      </div>
    </div>
  );
}