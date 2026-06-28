'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Loader2,
  Mail,
  MessageCircle,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEventJoy } from '@/components/providers/eventjoy-provider';
import type { EventJoyEvent } from '@/lib/eventjoy/types';
import { getEventJoyInviteUrl } from '@/lib/eventjoy/invitations';
import { cn } from '@/lib/utils';

function hostNameFromProfile(profile: {
  firstName: string;
  lastName: string;
}): string {
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
  return name || 'Organizatör';
}

export function EventJoyInvitationShare({ event }: { event: EventJoyEvent }) {
  const { profile, updateEvent } = useEventJoy();
  const [shareToken, setShareToken] = useState(event.shareToken ?? '');
  const [personalMessage, setPersonalMessage] = useState(event.personalMessage ?? '');
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [guestName, setGuestName] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inviteLink = shareToken ? getEventJoyInviteUrl(shareToken) : '';

  const publish = useCallback(async (messageOverride?: string) => {
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch('/api/eventjoy/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          title: event.title,
          type: event.type,
          date: event.date,
          time: event.time,
          location: event.location,
          description: event.description,
          coverColor: event.coverColor,
          coverImage: event.coverImage,
          hostName: hostNameFromProfile(profile),
          personalMessage: (messageOverride ?? personalMessage) || undefined,
          existingToken: event.shareToken
        })
      });
      const data = (await res.json()) as {
        error?: string;
        invitation?: { token: string };
      };
      if (!res.ok) throw new Error(data.error || 'Davetiye oluşturulamadı');
      const token = data.invitation!.token;
      setShareToken(token);
      const savedMessage = (messageOverride ?? personalMessage) || undefined;
      updateEvent(event.id, { shareToken: token, personalMessage: savedMessage });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Davetiye oluşturulamadı');
    } finally {
      setPublishing(false);
    }
  }, [event, personalMessage, profile, updateEvent]);

  useEffect(() => {
    if (!event.shareToken) {
      void publish();
    } else {
      setShareToken(event.shareToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial publish only
  }, [event.id]);

  function copyLink() {
    if (!inviteLink) return;
    void navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsApp() {
    if (!inviteLink) return;
    const text = encodeURIComponent(
      `Merhaba! ${event.title} etkinliğine davetlisiniz: ${inviteLink}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  }

  function shareSms() {
    if (!inviteLink) return;
    const body = encodeURIComponent(
      `Merhaba! ${event.title} etkinliğine davetlisiniz: ${inviteLink}`
    );
    window.location.href = `sms:?body=${body}`;
  }

  async function sendEmail() {
    if (!shareToken || !emailTo.trim()) return;
    setSendingEmail(true);
    setEmailStatus(null);
    setError(null);
    try {
      const res = await fetch('/api/eventjoy/invitations/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: shareToken,
          to: emailTo.trim(),
          guestName: guestName.trim() || undefined
        })
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) throw new Error(data.error || 'E-posta gönderilemedi');
      setEmailStatus('Davetiye e-postası gönderildi.');
      setEmailTo('');
      setGuestName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'E-posta gönderilemedi');
    } finally {
      setSendingEmail(false);
    }
  }

  const formattedDate = new Date(event.date).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/eventjoy/etkinlik/${event.id}`}
          className="flex size-9 items-center justify-center rounded-full border border-border hover:bg-muted"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="text-lg font-bold">Davetiye Paylaş</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {event.coverImage && (
          <img src={event.coverImage} alt="" className="aspect-video w-full object-cover" />
        )}
        <div
          className={cn(
            !event.coverImage && 'bg-gradient-to-br p-6 text-white',
            !event.coverImage && event.coverColor
          )}
        >
          <div className={cn(event.coverImage && 'p-6 text-center')}>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              {event.type}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-foreground">{event.title}</h2>
            <p className="mt-3 text-muted-foreground">
              {formattedDate} · {event.time}
            </p>
            {event.location && (
              <p className="mt-1 text-sm text-muted-foreground">{event.location}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <Label htmlFor="personal-message">Kişisel Mesaj (isteğe bağlı)</Label>
          <textarea
            id="personal-message"
            value={personalMessage}
            onChange={(e) => setPersonalMessage(e.target.value)}
            placeholder="Misafirlerinize özel bir not ekleyin…"
            className="mt-2 flex min-h-[80px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            disabled={publishing}
            onClick={() => void publish(personalMessage)}
          >
            {publishing ? <Loader2 className="size-4 animate-spin" /> : 'Mesajı Kaydet'}
          </Button>
        </div>

        {publishing && !shareToken ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Paylaşım linki hazırlanıyor…
          </div>
        ) : shareToken ? (
          <>
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
              <p className="text-xs text-muted-foreground">Paylaşım linki</p>
              <p className="mt-1 break-all text-sm font-medium">{inviteLink}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="gap-2" onClick={copyLink}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? 'Kopyalandı' : 'Linki Kopyala'}
              </Button>
              <Button variant="outline" className="gap-2" onClick={shareWhatsApp}>
                <Share2 className="size-4" />
                WhatsApp
              </Button>
              <Button variant="outline" className="gap-2" onClick={shareSms}>
                <MessageCircle className="size-4" />
                SMS
              </Button>
              <Button variant="outline" className="gap-2" asChild>
                <Link
                  href={`/eventjoy/i/${shareToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Önizle
                </Link>
              </Button>
            </div>

            <div className="rounded-xl border border-border p-4">
              <div className="mb-3 flex items-center gap-2 font-semibold">
                <Mail className="size-4 text-primary" />
                E-posta ile Gönder
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="guest-name">Misafir Adı</Label>
                  <Input
                    id="guest-name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Ahmet Yılmaz"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="guest-email">E-posta</Label>
                  <Input
                    id="guest-email"
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="misafir@ornek.com"
                    className="mt-1"
                  />
                </div>
                <Button
                  type="button"
                  className="w-full gap-2"
                  disabled={sendingEmail || !emailTo.trim()}
                  onClick={() => void sendEmail()}
                >
                  {sendingEmail ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Mail className="size-4" />
                  )}
                  E-posta Gönder
                </Button>
                {emailStatus && (
                  <p className="text-sm text-emerald-600">{emailStatus}</p>
                )}
              </div>
            </div>

            <Button variant="outline" className="w-full gap-2" asChild>
              <a
                href={`/api/eventjoy/invitations/${shareToken}/pdf`}
                download
              >
                <Download className="size-4" />
                Davetiye İndir (PDF)
              </a>
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
