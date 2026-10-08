import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores(['.next/**', 'next-env.d.ts']),
  {
    // Bonnes pratiques : aucune API dépréciée (React, Next.js, Prisma, zod…).
    // Cette règle a besoin des types : ESLint lit le tsconfig du projet.
    files: ['**/*.{ts,tsx}'],
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    rules: { '@typescript-eslint/no-deprecated': 'error' },
  },
  {
    files: ['src/frontend/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@/backend', '@/backend/**', '**/backend/**', '@prisma/client', 'stripe'],
          message: 'Le frontend accède au backend via les routes /api, jamais via les modules serveur.',
        }],
      }],
    },
  },
]);
