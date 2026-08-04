import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { ToastProvider } from '@/context/ToastContext';
import './globals.css';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: 'Finance Controller',
  description: 'Controle financeiro mensal simples: receitas, despesas e simulação de investimento.',
  icons: {
    icon: '/images/finance-controller-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${roboto.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
