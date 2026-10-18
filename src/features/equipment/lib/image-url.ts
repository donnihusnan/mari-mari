function getSupabaseUrl(): string {
  const url =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL

  if (!url) {
    throw new Error('Missing SUPABASE_URL or VITE_SUPABASE_URL environment variable')
  }

  return url
}

export function getEquipmentImageUrl(imagePath?: string | null): string | null {
  if (!imagePath) return null
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  const cleanPath = imagePath.replace(/^\/+/, '')
  return `${getSupabaseUrl()}/storage/v1/object/public/equipment/${cleanPath}`
}
