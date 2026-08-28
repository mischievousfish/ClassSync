import type { Metadata } from 'next';
import { DM_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const sans = Plus_Jakarta_Sans({ subsets: ['latin', 'vietnamese'], variable: '--font-sans' });
const mono = DM_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://classsync.app'),
  title: 'ClassSync | Trợ lý AI & Quản lý Lịch học 2-trong-1',
  description: 'Một lịch học thông minh cho học sinh. Một trợ lý AI đắc lực cho giáo viên.',
  openGraph: { title: 'ClassSync', description: 'Học gọn hơn. Dạy nhẹ hơn.', type: 'website', images: ['/og-image.svg'] },
  twitter: { card: 'summary_large_image', title: 'ClassSync', description: 'Trợ lý AI & Quản lý Lịch học 2-trong-1' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ClassSync',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'iOS, Android, Web',
    description: 'Trợ lý AI và quản lý lịch học 2-trong-1 cho học sinh và giáo viên.',
    offers: [{ '@type': 'Offer', price: '0', priceCurrency: 'VND' }],
  };
  return <html lang="vi"><body className={`${sans.variable} ${mono.variable}`}><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />{children}</body></html>;
}
