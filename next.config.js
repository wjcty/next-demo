/** @type {import('next').NextConfig} */

const nextConfig = {
    reactStrictMode: false,
    webpack: (config) => {
        config.externals.push(
            /* add any other modules that might be causing the error */
            'encoding',
            'pino-pretty'
        )
        return config
    }
}

module.exports = nextConfig
