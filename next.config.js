/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // pdfjs-dist optionally requires the native `canvas` package to render in Node.
    // PDFs are only rendered in the browser, so keep it out of every bundle.
    config.resolve.alias.canvas = false
    return config
  },
}

module.exports = nextConfig
