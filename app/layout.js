import { Anton, Inter, JetBrains_Mono } from 'next/font/google';
import Header from '@/components/Header';
import './globals.css';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] });
const jetbrains = JetBrains_Mono({ variable: '--font-jetbrains', subsets: ['latin'] });
// Impact-style meme caption face, used for headlines only.
const anton = Anton({ variable: '--font-anton', weight: '400', subsets: ['latin'] });

export const metadata = {
  title: { default: 'Meme Chess', template: '%s · Meme Chess' },
  description: 'Chess where every blunder, fork and checkmate gets a meme. Play the bot or send a friend a link.',
  openGraph: {
    title: 'Meme Chess',
    description: 'Chess where every blunder gets a meme.',
    type: 'website',
  },
};

export const viewport = { themeColor: '#000000' };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable} ${anton.variable}`}>
      <body className="min-h-dvh bg-bg">
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
