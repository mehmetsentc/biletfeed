import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Kapı Terminali | BiletFeed',
    template: '%s | BiletFeed Kapı'
  },
  robots: { index: false, follow: false }
};

export default function GirisTerminalLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      {children}
    </div>
  );
}
