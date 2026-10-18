import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '@/features/auth/server/auth.middleware'
import { supabaseServer } from '@/lib/supabase.server'
import { z } from 'zod'

const uploadUrlSchema = z.object({
  fileName: z.string().min(1),
})

export const createEquipmentUploadUrlFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => uploadUrlSchema.parse(data))
  .handler(async ({ data }) => {
    const extension = data.fileName.split('.').pop()?.toLowerCase() || 'jpg'
    const sanitizedName = data.fileName
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase()
    const filePath = `items/${Date.now()}-${sanitizedName}.${extension}`

    const { data: uploadData, error } = await supabaseServer.storage
      .from('equipment')
      .createSignedUploadUrl(filePath)

    if (error || !uploadData) {
      throw new Error(`Gagal membuat URL unggah: ${error?.message || 'Unknown error'}`)
    }

    return {
      signedUrl: uploadData.signedUrl,
      filePath,
      token: uploadData.token,
    }
  })
