import { createEquipmentUploadUrlFn } from '../server/equipment-upload.fn'

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024 // 2MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function uploadEquipmentImage(file: File): Promise<string> {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Format gambar harus JPEG, PNG, atau WebP')
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Ukuran gambar maksimal 2 MB')
  }

  const { signedUrl, filePath } = await createEquipmentUploadUrlFn({
    data: { fileName: file.name },
  })

  const response = await fetch(signedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Gagal mengunggah gambar: ${errorBody}`)
  }

  return filePath
}

export { getEquipmentImageUrl } from './image-url'

