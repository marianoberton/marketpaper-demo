export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

// This function can be named anything, but this is the convention
export async function generateMetadata({ searchParams }: { searchParams?: { company_id?: string } }) {
  const companyId = searchParams?.company_id;
  if (!companyId) {
    return { title: 'Workspace' };
  }
  try {
    const company = await getCurrentCompany(companyId);
    return { title: `${company.name} | Workspace` };
  } catch (error) {
    return { title: 'Workspace' };
  }
} 