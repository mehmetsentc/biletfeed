'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type AccountingExportType = 'kdv' | 'ba-bs' | 'hakedis';

const EXPORT_LABELS: Record<AccountingExportType, string> = {
  kdv: 'KDV özeti CSV',
  'ba-bs': 'BA/BS CSV',
  hakedis: 'Hakediş CSV'
};

export function AccountingExportButtons({
  types = ['kdv', 'ba-bs', 'hakedis']
}: {
  types?: ReadonlyArray<AccountingExportType>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {types.map((type) => (
        <Button key={type} variant="outline" size="sm" asChild>
          <a href={`/api/admin/accounting/export?type=${type}`}>
            <Download className="mr-1.5 size-3.5" />
            {EXPORT_LABELS[type]}
          </a>
        </Button>
      ))}
    </div>
  );
}
