-- Admin görev tanımları (granüler yetkiler)
ALTER TABLE "users" ADD COLUMN "admin_permissions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Mevcut adminlere geriye dönük tam yetki (süper admin hariç ayrı yönetilir)
UPDATE "users"
SET "admin_permissions" = ARRAY[
  'dashboard','users.view','users.manage','organizers.view','organizers.manage',
  'events.view','events.manage','events.approve','events.scrape','feed.view','feed.manage',
  'categories.manage','cities.manage','venues.manage','orders.view','orders.refund',
  'tickets.view','tickets.manage','transactions.view','analytics.view','banners.manage',
  'accounting.view','accounting.manage','settings.manage'
]::TEXT[]
WHERE "role" = 'ROLE_ADMIN' AND cardinality("admin_permissions") = 0;
