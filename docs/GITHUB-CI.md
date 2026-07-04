# GitHub Actions CI

CI workflow dosyası: `.github/workflows/ci.yml` (yerelde hazır).

PAT `workflow` scope olmadan push reddedilebilir. İki yol:

## A) Token scope güncelle

1. [GitHub → Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Token'a **workflow** scope ekle
3. `git add .github/workflows/ci.yml && git push origin main`

## B) GitHub arayüzünden ekle

1. Repo → **Actions** → **New workflow** → **set up a workflow yourself**
2. Dosya adı: `ci.yml`
3. `docs/github-actions-ci.yml` içeriğini yapıştır → **Commit**

## Ne çalışır?

- `npm ci`
- `npm run test` (Vitest)
- `npm run build` (Prisma generate + Next.js)

CI ortam değişkenleri workflow içinde dummy değerlerle tanımlıdır; gerçek secret gerekmez.
