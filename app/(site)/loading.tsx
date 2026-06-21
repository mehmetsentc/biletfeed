import { Skeleton } from '@/components/ui/skeleton';

export default function SiteLoading() {
  return (
    <div className="animate-in fade-in duration-200">
      <div className="border-b bg-muted/30 py-12">
        <div className="container mx-auto space-y-3 px-4">
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
      </div>
      <div className="container mx-auto grid gap-6 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-video w-full rounded-2xl" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
