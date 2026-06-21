# Firebase Storage Kurulumu

## 1. Storage'ı aç

1. [Firebase Console](https://console.firebase.google.com) → **BiletFeed**
2. Sol menü → **Storage** → **Get started**
3. **Production mode** seç → bölge: `europe-west1` (veya en yakın)

## 2. Rules yayınla

**Rules** sekmesi → mevcut kuralları sil → aşağıdakini yapıştır → **Publish**

Proje dosyası: `firebase/storage.rules`

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /events/{eventId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }

    match /users/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.uid == userId
        && request.resource.size < 2 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
  }
}
```

## 3. Test

1. Giriş yap → **Profil** → kamera ikonu → fotoğraf seç
2. Hata alırsanız Rules'ın publish edildiğini doğrulayın

## 4. Ortam değişkeni

`.env.local` / Vercel:
```
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=biletfeed.firebasestorage.app
```
