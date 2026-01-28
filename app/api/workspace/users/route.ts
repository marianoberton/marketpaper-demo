import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getCompanyUsers } from '@/lib/auth-server'
import { createClient } from '@/utils/supabase/server'

// GET - Fetch company users for the current user's company
export async function GET(request: NextRequest) {
    try {
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
                const supabase = await createClient()
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

        // Get company users using the existing function
        const users = await getCompanyUsers(targetCompanyId)

        return NextResponse.json({ 
            success: true, 
            users: users.map(u => ({
                id: u.id,
                full_name: u.full_name,
                email: u.email,
                avatar_url: u.avatar_url,
                role: u.role
            }))
        })
    } catch (error) {
        console.error('Error in users API:', error)
        return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
    }
}
