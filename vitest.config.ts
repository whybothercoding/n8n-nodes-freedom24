 
import { defineConfig } from 'vitest/config';

export default defineConfig({
	// n8n-workflow ships .js.map files referencing source paths not included in the published
	// package; Vite's dep optimizer warns about every one of them on cold start. Harmless — just
	// noisy — so it's turned down rather than left to bury real test output.
	logLevel: 'error',
	test: {
		include: ['test/**/*.test.ts'],
		coverage: {
			provider: 'v8',
			include: ['nodes/Freedom24/**/*.ts'],
			exclude: ['nodes/Freedom24/**/*.d.ts'],
		},
	},
});
