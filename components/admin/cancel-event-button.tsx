'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';

interface CancelEventButtonProps {
  eventId: string;
  eventTitle: string;
  /** 'list' → küçük inline buton, 'detail' → tam boyut */
  variant?: 'list' | 'detail';
}

export function CancelEventButton({
  eventId,
  eventTitle,
  variant = 'list'
}: CancelEventButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/cancel`, {
        method: 'POST',
        credentials: 'same-origin'
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        alert(data.error ?? 'İptal başarısız');
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (variant === 'detail') {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={loading}>
            <Ban className="mr-2 size-4" />
            Etkinliği İptal Et
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Etkinliği iptal et?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{eventTitle}</strong> etkinliği iptal edilecek. Bu işlem geri alınabilir
              (durum tekrar &quot;yayında&quot;ya alınabilir), ancak kullanıcılara iade bildirimi
              göndermek ayrıca yapılmalıdır.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? 'İptal ediliyor…' : 'Evet, İptal Et'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={loading}>
          <Ban className="mr-1 size-3.5" />
          İptal
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Etkinliği iptal et?</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{eventTitle}</strong> etkinliği iptal edilecek. Yayından kalkacak ve
            &quot;İptal Edildi&quot; olarak görünecek.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Vazgeç</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'İptal ediliyor…' : 'Evet, İptal Et'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
