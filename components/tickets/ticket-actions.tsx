'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Download,
  Share2,
  Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  buildGoogleCalendarUrl,
  buildIcsDataUrl,
  buildOutlookCalendarUrl,
  buildYahooCalendarUrl
} from '@/lib/tickets/calendar';

interface TicketActionsProps {
  ticketId: string;
  ticketCode: string;
  validationToken?: string;
  eventTitle: string;
  startDate: string;
  endDate: string;
  venue: string;
  city: string;
}

export function TicketActions({
  ticketId,
  ticketCode,
  validationToken,
  eventTitle,
  startDate,
  endDate,
  venue,
  city
}: TicketActionsProps) {
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const printUrl =
    validationToken &&
    `/bilet/${encodeURIComponent(ticketCode)}/print?token=${encodeURIComponent(validationToken)}&id=${encodeURIComponent(ticketId)}`;

  const calendarInput = {
    title: eventTitle,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    location: `${venue}, ${city}`,
    description: `BiletFeed bilet: ${ticketCode}`
  };

  const googleUrl = buildGoogleCalendarUrl(calendarInput);
  const outlookUrl = buildOutlookCalendarUrl(calendarInput);
  const yahooUrl = buildYahooCalendarUrl(calendarInput);
  const icsUrl = buildIcsDataUrl(calendarInput);

  const downloadPdf = useCallback(async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/pdf`);
      if (!res.ok) throw new Error('PDF indirilemedi');

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download =
        res.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] ??
        `BiletFeed-${ticketCode}.pdf`;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.alert('Bilet PDF indirilemedi. Lütfen tekrar deneyin.');
    } finally {
      setDownloading(false);
    }
  }, [ticketCode, ticketId]);

  const shareTicket = useCallback(async () => {
    setSharing(true);
    try {
      const url = `${window.location.origin}/biletlerim/${ticketId}`;
      if (navigator.share) {
        await navigator.share({ title: eventTitle, text: `Biletim: ${ticketCode}`, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } finally {
      setSharing(false);
    }
  }, [eventTitle, ticketCode, ticketId]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Button
          className="gap-2"
          disabled={downloading}
          onClick={() => void downloadPdf()}
        >
          <Download className="size-4" />
          {downloading ? 'İndiriliyor…' : 'Bilet İndir'}
        </Button>
        {printUrl && (
          <Button variant="outline" className="gap-2" asChild>
            <Link href={printUrl} target="_blank">
              <Printer className="size-4" />
              Yazdır
            </Link>
          </Button>
        )}
        <Button variant="outline" className="gap-2" disabled={sharing} onClick={() => void shareTicket()}>
          <Share2 className="size-4" />
          Paylaş
        </Button>
        <Button variant="outline" className="gap-2" asChild>
          <a href={googleUrl} target="_blank" rel="noopener noreferrer">
            <Calendar className="size-4" />
            Takvim
          </a>
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <a href={icsUrl} download={`${eventTitle}.ics`} className="text-primary hover:underline">
          Apple Calendar (.ics)
        </a>
        <span className="text-muted-foreground">·</span>
        <a href={outlookUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          Outlook
        </a>
        <span className="text-muted-foreground">·</span>
        <a href={yahooUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          Yahoo
        </a>
      </div>
    </div>
  );
}
