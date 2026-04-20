# Portfolio Seeding Workflow

Fast workflow to seed `portfolioProjects` from JSON and optionally upload screenshots to Firebase Storage.

## Suggested structure

```text
tools/
  portfolio-seed/
    README.md
    portfolio-project.model.ts
    projects.json
    seed-firestore.mjs
    upload-storage-images.mjs
    images/
      youtap-bos-mobile/
        01.png
        02.png
      youtap-portal/
        01.png
```

## Firestore document model

Every project becomes one document in:

- Collection: `portfolioProjects`
- Document id: `slug` (stable + easy to edit)

Core fields:

- `slug`, `title`, `company`, `role`
- `periodLabel`, `startDate`, `endDate`
- `highlightProject`, `isFeatured`, `order`
- `stack[]`, `summary`, `description`
- `image[]`, `url`
- `createdAt`, `updatedAt`, `source`

## Auth options (Admin SDK)

Use one of these:

1. `GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/service-account.json`
2. `FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'`
3. `FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json`
4. CLI flag: `--service-account ./service-account.json`

Project id resolution order:

1. `--project-id <id>`
2. `FIREBASE_PROJECT_ID` / `GCLOUD_PROJECT` / `GOOGLE_CLOUD_PROJECT`
3. `.firebaserc` -> `projects.default`

Optional for Storage script:

- `FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com`

## Commands

### 1) Dry run seed

```bash
npm run seed:portfolio:dry
```

### 2) Seed to Firestore

```bash
npm run seed:portfolio
```

Optional custom file:

```bash
node tools/portfolio-seed/seed-firestore.mjs --file tools/portfolio-seed/projects.json --collection portfolioProjects --service-account ./service-account.json
```

### 3) Upload images to Storage and update image[] in Firestore

```bash
npm run seed:portfolio:images
```

Optional custom paths:

```bash
node tools/portfolio-seed/upload-storage-images.mjs --images-root tools/portfolio-seed/images --bucket your-project-id.appspot.com --service-account ./service-account.json
```

Use signed URLs instead of public files:

```bash
node tools/portfolio-seed/upload-storage-images.mjs --private --bucket your-project-id.appspot.com
```

## Editing projects later

1. Edit `tools/portfolio-seed/projects.json`
2. Re-run `npm run seed:portfolio`
3. For screenshots: place images in `tools/portfolio-seed/images/<slug>/` then run `npm run seed:portfolio:images`

`slug` is the key matcher, so keep it stable.

Sorting recommendation in app:
- `highlightProject: true` goes to top
- then sort by `endDate` desc
- fallback to `startDate` when `endDate` is empty
