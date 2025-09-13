import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    eslint: {
        // Відключаємо ESLint під час production build
        ignoreDuringBuilds: true,
    },
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
        // Налаштування для PDF.js
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                path: false,
                canvas: false,
                encoding: false,
            };
        }

        // Виключаємо canvas для всіх середовищ
        config.resolve.alias = {
            ...config.resolve.alias,
            canvas: false,
            encoding: false,
        };

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

    experimental: {
        esmExternals: true,
        serverComponentsExternalPackages: ['pdfjs-dist', 'pdf-parse']
    },

    env: {
        CUSTOM_KEY: 'my-value',
    },
};

export default nextConfig;