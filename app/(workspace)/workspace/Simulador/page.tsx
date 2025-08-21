import { Suspense } from 'react';
import ClientPage from './client-page';

export default function SimuladordePagosPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ClientPage />
    </Suspense>
  );
}
