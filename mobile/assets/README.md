# BiletFeed Mobil Uygulama Varlıkları

Capacitor Assets (`npm run assets:generate`) bu klasördeki kaynak dosyalardan iOS ve Android ikon/splash setlerini üretir.

## Gerekli dosyalar

| Dosya | Boyut | Açıklama |
| --- | --- | --- |
| `icon-only.png` | **1024×1024 px** | App Store / Play Store ana ikon kaynağı (kare, şeffaf veya düz arka plan) |
| `icon-foreground.png` | 1024×1024 px | Android adaptive icon ön plan (opsiyonel) |
| `icon-background.png` | 1024×1024 px | Android adaptive icon arka plan (opsiyonel) |
| `splash.png` | 2732×2732 px | Açılış ekranı (logo ortada, güvenli alan ~1200 px) |
| `splash-dark.png` | 2732×2732 px | Koyu tema splash (opsiyonel) |

## İkon gereksinimleri (1024×1024)

- PNG formatı, sRGB renk uzayı
- Köşe yuvarlatma **eklemeyin** — mağazalar otomatik uygular
- Metin ve ince detaylardan kaçının; küçük boyutlarda okunabilir olmalı
- BiletFeed marka rengi: `#f5a623` (turuncu) / arka plan `#000000`
- App Store Connect ve Google Play Console’a yüklenen 1024 px ikon bu dosyadan türetilir

## Üretim

```bash
cd mobile
npm install
# icon-only.png ve splash.png dosyalarını bu klasöre ekleyin
npm run assets:generate
npm run cap:sync
```

Üretilen çıktılar `ios/App/App/Assets.xcassets` ve `android/app/src/main/res/` altına yazılır.
