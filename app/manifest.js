export default function manifest() {
  return {
    name: 'Hugo Veiga',
    short_name: 'Hugo Veiga',
    description: 'Catálogos e tabelas de preços das marcas representadas.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f7f5f1',
    theme_color: '#8a5a2b',
    lang: 'pt-PT',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  };
}
