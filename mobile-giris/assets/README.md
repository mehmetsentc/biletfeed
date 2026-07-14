# BiletFeed Giriş — Mobil Varlıklar

## Gerekli dosyalar

| Dosya | Boyut | Açıklama |
|---|---|---|
| `icon-only.png` | **1024×1024 px** | Turuncu arka plan (#f97316) üzerinde beyaz QR/tarama ikonu |
| `splash.png` | **2732×2732 px** | Siyah arka plan (#0a0a0a), ortada logo |

## Üretim

```bash
cd mobile-giris
npm install
# icon-only.png ve splash.png ekledikten sonra:
npm run assets:generate
npm run cap:sync
```

## Fark (biletfeed vs giris)

| | biletfeed | giris |
|---|---|---|
| Bundle ID | `com.biletfeed.app` | `com.biletfeed.giris` |
| Hedef URL | `biletfeed.com` | `giris.biletfeed.com` |
| İkon rengi | Siyah | Turuncu (#f97316) |
| Kamera izni | Opsiyonel | Zorunlu (QR tarama) |
