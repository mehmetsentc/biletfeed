'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ArtistFollowButtonProps {
  artistId: string;
  initialFollowing: boolean;
  isLoggedIn: boolean;
}

export function ArtistFollowButton({
  artistId,
  initialFollowing,
  isLoggedIn
}: ArtistFollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle() {
    if (!isLoggedIn) {
      router.push('/giris');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/artists/${artistId}/follow`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('İşlem başarısız');
      const { following: nowFollowing } = await res.json();
      setFollowing(nowFollowing);
      router.refresh();
    } catch {
      // silent — optimistic state stays
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={following ? 'outline' : 'default'}
      size="sm"
      onClick={toggle}
      disabled={loading}
      className="gap-2 min-w-[110px]"
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : following ? (
        <>
          <BellOff className="size-4" />
          Takipten Çık
        </>
      ) : (
        <>
          <Bell className="size-4" />
          Takip Et
        </>
      )}
    </Button>
  );
}
