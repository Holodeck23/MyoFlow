/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@myoflow/ui", "@myoflow/lib", "@myoflow/db"],
  // TODO: Re-enable instrumentation hook once build-time handling is fixed
  // experimental: {
  //   instrumentationHook: true,
  // },
  images: {
    domains: ['localhost'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig