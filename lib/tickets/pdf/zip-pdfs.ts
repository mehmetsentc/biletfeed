import JSZip from 'jszip';

export type NamedPdf = {
  filename: string;
  content: Buffer;
};

function sanitizeZipLabel(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'davetiye'
  );
}

export function buildInvitationZipFilename(eventTitle: string): string {
  return `BiletFeed-Davetiyeler-${sanitizeZipLabel(eventTitle)}.zip`;
}

/** Tek PDF ise olduğu gibi; birden fazlaysa ZIP. */
export async function bundleNamedPdfs(
  files: NamedPdf[],
  zipFilename: string
): Promise<{ buffer: Buffer; filename: string; contentType: string } | null> {
  if (files.length === 0) return null;
  if (files.length === 1) {
    const only = files[0]!;
    return {
      buffer: only.content,
      filename: only.filename,
      contentType: 'application/pdf'
    };
  }

  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.filename, file.content);
  }
  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE'
  });
  return {
    buffer,
    filename: zipFilename,
    contentType: 'application/zip'
  };
}
