'use server'

import { createCompanyUser } from '@/lib/super-admin'
import { revalidatePath } from 'next/cache'
import { deleteUser } from '@/lib/super-admin'
import { updateUser } from '@/lib/super-admin'

interface ActionResult {
  success: boolean
  message: string
}

export async function createUserAction(
  companyId: string,
  formData: {
    email: string
    password?: string
    full_name?: string
    role?: string
  }
): Promise<ActionResult> {
  try {
    if (!formData.email || !formData.password || !formData.full_name) {
      return { success: false, message: 'Todos los campos son obligatorios.' }
    }

    await createCompanyUser({ ...formData, company_id: companyId })

    // Invalidate the path to trigger a data re-fetch on the page
    revalidatePath(`/admin/companies/${companyId}`)

    return { success: true, message: 'Usuario creado con éxito.' }
  } catch (err) {
    console.error('Error in createUserAction:', err)
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Un error desconocido ocurrió.',
    }
  }
}

export async function deleteUserAction(
  userId: string,
  companyId: string
): Promise<ActionResult> {
  try {
    await deleteUser(userId)

    revalidatePath(`/admin/companies/${companyId}`)

    return { success: true, message: 'Usuario eliminado con éxito.' }
  } catch (err) {
    console.error('Error in deleteUserAction:', err)
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Un error desconocido ocurrió.',
    }
  }
}

export async function updateUserAction(
  userId: string,
  companyId: string,
  formData: {
    full_name?: string
    role?: string
  }
): Promise<ActionResult> {
  try {
    await updateUser(userId, formData)
    revalidatePath(`/admin/companies/${companyId}`)
    return { success: true, message: 'Usuario actualizado con éxito.' }
  } catch (err) {
    console.error('Error in updateUserAction:', err)
    return {
      success: false,
      message:
        err instanceof Error
          ? err.message
          : 'Un error desconocido ocurrió al actualizar.',
    }
  }
} 