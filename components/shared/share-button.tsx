'use client';

import { useCallback, useState } from 'react';
import { Check, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
  title: string;
  url: string;
  text?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'icon';
}

export function ShareButton({
  title,
  url,
  text,
  className,
  variant = 'outline'
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const shareText = text ?? title;

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title, text: shareText, url });
        return;
      }

      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // User cancelled native share — no error UI needed
    }
  }, [title, text, url]);

  if (variant === 'icon') {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn(className)}
        onClick={() => void handleShare()}
        aria-label="Paylaş"
      >
        {copied ? (
          <Check className="size-4 text-green-600" />
        ) : (
          <Share2 className="size-4" />
        )}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      className={cn(className)}
      onClick={() => void handleShare()}
    >
      {copied ? (
        <>
          <Check className="mr-1.5 size-4" />
          Kopyalandı
        </>
      ) : (
        <>
          <Share2 className="mr-1.5 size-4" />
          Paylaş
        </>
      )}
    </Button>
  );
}
