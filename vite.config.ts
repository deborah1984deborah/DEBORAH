import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [react()],
        server: {
            proxy: {
                '/api/nai-text': {
                    target: 'https://text.novelai.net',
                    changeOrigin: true,
                    secure: true,
                    rewrite: (path) => path.replace(/^\/api\/nai-text/, '')
                }
            }
        }
    };
});
