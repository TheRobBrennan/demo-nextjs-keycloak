/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        config.watchOptions = {
            ignored: /uploads/
        }
        return config
    }
}

module.exports = nextConfig
