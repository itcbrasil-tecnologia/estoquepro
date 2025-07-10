/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'placehold.co',
          port: '',
          pathname: '/**',
        },
        // Se você planeja usar outras fontes de imagens,
        // adicione os domínios delas aqui.
        // Exemplo:
        // {
        //   protocol: 'https',
        //   hostname: 's3.amazonaws.com',
        //   port: '',
        //   pathname: '/my-bucket/**',
        // },
      ],
    },
  };
  
  export default nextConfig;