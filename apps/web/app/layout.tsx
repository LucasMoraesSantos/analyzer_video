import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Analyzer Video',
  description: 'Plataforma de análise de vídeos curtos por nicho'
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
