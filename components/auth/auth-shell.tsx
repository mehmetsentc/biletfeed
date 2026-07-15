import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { siteConfig } from '@/lib/config/site';

interface AuthShellProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  bullets?: [string, string, string];
  backHomeLabel: string;
}

export function AuthShell({
  children,
  title,
  subtitle,
  bullets,
  backHomeLabel
}: AuthShellProps) {
  const bulletItems = bullets ?? [];
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between">
        <Image
          src="https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&q=80"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/70 to-primary/40" />
        <div className="relative z-10 flex flex-col justify-between p-10 text-white">
          <Logo href="/" variant="on-dark" />
          <div>
            <h1 className="text-3xl font-bold leading-tight md:text-4xl">
              {title}
            </h1>
            <p className="mt-4 max-w-md text-lg text-white/80">{subtitle}</p>
            <ul className="mt-8 space-y-3 text-sm text-white/70">
              {bulletItems.map((item) => (
                <li key={item}>✓ {item}</li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} {siteConfig.name}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center p-6 md:p-10">
        <div className="mb-8 lg:hidden">
          <Logo variant="on-light" />
        </div>
        <div className="w-full max-w-md">{children}</div>
        <p className="mt-8 text-center text-base font-medium text-foreground lg:hidden">
          <Link href="/" className="underline-offset-4 hover:text-primary hover:underline">
            {backHomeLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}
