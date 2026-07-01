export function ticketPrintStyles(rootId = 'ticket-document'): string {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { background: #FFFFFF !important; font-family: -apple-system, 'Segoe UI', sans-serif; }
    @page { size: A4 portrait; margin: 12mm; }
    @media print {
      html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      #${rootId} { page-break-after: avoid; page-break-inside: avoid; }
    }
    @media screen {
      body { display: flex; justify-content: center; align-items: flex-start; padding: 72px 20px 40px; min-height: 100vh; }
    }
  `;
}

export function ticketWebPrintStyles(): string {
  return `
    @media print {
      body { background: #FFFFFF !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      nav, footer, header { display: none !important; }
    }
  `;
}
