import './globals.css';

export const metadata = {
  title: 'Hugo Veiga',
  description: 'Catálogos e tabelas de preços das marcas representadas por Hugo Veiga.',
  applicationName: 'Hugo Veiga',
  appleWebApp: { capable: true, title: 'Hugo Veiga', statusBarStyle: 'default' },
};

export const viewport = { themeColor: '#8a5a2b', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="pt-PT">
      <body>{children}</body>
    </html>
  );
}
