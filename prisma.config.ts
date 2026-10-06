import { loadEnvConfig } from '@next/env';
import { defineConfig } from 'prisma/config';

// Les commandes Prisma utilisent le même .env.local que Next.js.
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // react-server : le seed réutilise des modules backend marqués server-only.
    seed: 'node --conditions=react-server --import tsx prisma/seed.ts',
  },
});
