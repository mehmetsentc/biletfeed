'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdminSettingsSnapshot } from '@/lib/config/admin-settings-snapshot';
import type { EnvCheckStatus } from '@/lib/config/env-status';
import { cn } from '@/lib/utils';
import { AdminMaintenancePanel } from '@/components/admin/admin-maintenance-panel';
import { Clock, Info } from 'lucide-react';

const statusStyles: Record<EnvCheckStatus, string> = {
  ok: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  warn: 'bg-amber-100 text-amber-800 border-amber-200',
  fail: 'bg-red-100 text-red-800 border-red-200'
};

const statusLabels: Record<EnvCheckStatus, string> = {
  ok: 'Tamam',
  warn: 'Uyarı',
  fail: 'Eksik'
};

interface SystemSettingsPanelProps {
  snapshot: AdminSettingsSnapshot;
}

export function SystemSettingsPanel({ snapshot }: SystemSettingsPanelProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex gap-2">
        <Clock className="size-4 shrink-0 mt-0.5" />
        <span>
          Panelden düzenleme <strong>yakında</strong> gelecek. Şimdilik ayarlar
          ortam değişkenleri üzerinden yönetilir — değişiklik için{' '}
          <strong>Vercel Dashboard → Settings → Environment Variables</strong>{' '}
          kullanın veya <code className="text-xs">npm run deploy:checklist</code>{' '}
          ile tam listeyi görün.
        </span>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ortam Durumu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {snapshot.envChecks.map((check) => (
            <div
              key={check.label}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">{check.label}</p>
                <p className="text-xs text-muted-foreground">{check.detail}</p>
              </div>
              <Badge
                variant="outline"
                className={cn('shrink-0', statusStyles[check.status])}
              >
                {statusLabels[check.status]}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {snapshot.sections.map((section) => (
        <Card key={section.title}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{section.title}</CardTitle>
            {section.description && (
              <p className="text-sm text-muted-foreground">{section.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {section.fields.map((field) => (
              <div key={field.key} className="rounded-md border bg-muted/30 px-3 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{field.label}</p>
                  <code className="text-xs text-muted-foreground">{field.key}</code>
                </div>
                {field.hint && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{field.hint}</p>
                )}
                <p className="mt-2 font-mono text-sm text-foreground/90">{field.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <AdminMaintenancePanel />

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 flex gap-2">
        <Info className="size-4 shrink-0 mt-0.5" />
        <span>
          Yerel kurulum kontrolü: <code>npm run setup:check</code> — production
          deploy öncesi tüm kritik değişkenleri doğrular.
        </span>
      </div>
    </div>
  );
}
