/** @type {import('next').NextConfig} */
const nextConfig = {
  // For Azure App Service
  distDir: '.next',
  trailingSlash: false,
  // Azure App Service will handle the port via PORT environment variable
}

module.exports = nextConfig
