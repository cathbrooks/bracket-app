/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        {
          module: /@opentelemetry\/instrumentation/,
          message: /Critical dependency/,
        },
      ];
    }
    return config;
  },
};

module.exports = nextConfig;
