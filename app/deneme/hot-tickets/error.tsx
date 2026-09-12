'use client';

export default function HotTicketsError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-white px-6 text-center text-zinc-900">
      <p className="text-lg font-bold">Hot Tickets yüklenemedi</p>
      <p className="max-w-sm text-sm text-zinc-500">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-xl bg-[#DFFF00] px-5 py-3 text-sm font-bold text-[#050505]"
      >
        Tekrar dene
      </button>
    </div>
  );
}
