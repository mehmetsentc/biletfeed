'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EXPORTS = [
  { type: 'kdv', label: 'KDV özeti CSV' },
  { type: 'ba-bs', label: 'BA/BS CSV' },
  { type: 'hakedis', label: 'Hakediş CSV' }
] as const;

export function AccountingExportButtons() {
  return (
    <div className="flex flex-wrap gap-2">
      {EXPORTS.map((item) => (
        <Button key={item.type} variant="outline" size="sm" asChild>
          <a href={`/api/admin/accounting/export?type=${item.type}`}>
            <Download className="mr-1.5 size-3.5" />
            {item.label}
          </a>
        </Button>
      ))}
    </div>
  );
}
