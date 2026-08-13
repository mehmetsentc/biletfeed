'use client';

/** Klavye kullanıcıları için ana içeriğe atlama — görsel olarak yalnızca focus’ta */
export function SkipToContent({
  targetId = 'main-content',
  label = 'İçeriğe atla'
}: {
  targetId?: string;
  label?: string;
}) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {label}
    </a>
  );
}
