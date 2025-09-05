import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Підтримка Node.js модулів в браузері
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
        // Налаштування для PDF.js
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                path: false,
                canvas: false,
            };
        }

        // Обробка worker файлів
        config.module.rules.push({
            test: /pdf\.worker\.(min\.)?js/,
            type: 'asset/resource',
            generator: {
                filename: 'static/worker/[hash][ext][query]'
            }
        });

        return config;
    },

    // Експортуємо статичні файли
    experimental: {
        esmExternals: true,
    },

    // Налаштування для production
    env: {
        CUSTOM_KEY: 'my-value',
    },
};

export default nextConfig;