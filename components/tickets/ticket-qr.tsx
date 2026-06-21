'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export function TicketQR({ data, size = 180 }: { data: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, data, {
        width: size,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
      });
    }
  }, [data, size]);

  return <canvas ref={canvasRef} />;
}
