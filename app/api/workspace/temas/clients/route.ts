import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { createClient } from '@/utils/supabase/server'

// GET - Fetch clients for the current user's company
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const currentUser = await getCurrentUser()
        
        if (!currentUser) {
            return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
        }

        // Handle super_admin case
        let targetCompanyId: string
        
        if (currentUser.role === 'super_admin') {
            const { searchParams } = new URL(request.url)
            const companyId = searchParams.get('company_id')
            
            if (companyId) {
                targetCompanyId = companyId
            } else if (currentUser.company_id) {
                targetCompanyId = currentUser.company_id
            } else {
                const { data: companies } = await supabase
                    .from('companies')
                    .select('id')
                    .limit(1)
                
                if (companies && companies.length > 0) {
                    targetCompanyId = companies[0].id
                } else {
                    return NextResponse.json({ success: false, error: 'No se encontró compañía' }, { status: 400 })
                }
            }
        } else {
            if (!currentUser.company_id) {
                return NextResponse.json({ success: false, error: 'Usuario sin compañía asignada' }, { status: 400 })
            }
            targetCompanyId = currentUser.company_id
        }

        // Fetch clients for the company
        const { data: clients, error } = await supabase
            .from('clients')
            .select('id, name, email, phone, cuit, referentes')
            .eq('company_id', targetCompanyId)
            .order('name')

        if (error) {
            console.error('Error fetching clients:', error)
            return NextResponse.json({ success: false, error: 'Error al obtener clientes' }, { status: 500 })
        }

        return NextResponse.json({ success: true, clients: clients || [] })
    } catch (error) {
        console.error('Error in clients API:', error)
        return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
    }
}
