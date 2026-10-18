import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // DIRECT_URL for migrations and db push (no pgbouncer)
    url: env('DIRECT_URL'),
  },
})
