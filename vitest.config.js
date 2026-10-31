import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Component tests never need application environment files.
  envDir: false,
  test: {
    environment: 'jsdom',
    include: ['tests/components/**/*.test.tsx'],
    clearMocks: true,
  },
});
