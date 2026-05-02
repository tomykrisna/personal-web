# Portfolio Seeding Workflow

Fast workflow to seed `portfolioProjects` from JSON and optionally upload screenshots to Firebase Storage.

## Suggested structure

```text
tools/
  portfolio-seed/
    README.md
    portfolio-project.model.ts
    projects.json
    projects.exported.json
    seed-firestore.mjs
    export-firestore-to-json.mjs
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
- `stack[]`, `summary`, `description` (HTML allowed in `description` and `summary`: `<p>`, `<strong>`, `<a href="https://...">`, lists, line breaks via `<br />`; plain text is still supported and is escaped when rendered)
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

## Export Firestore → JSON (sync local file)

Use this when you edited documents in the **Firebase Console** (or want a fresh snapshot) and need [`projects.json`](projects.json) to match before editing in the repo or with AI.

The export script **replaces the entire output file** with whatever documents exist in Firestore right now. It does **not** merge with the old JSON.

### Deleting a project (Firestore → `projects.json`)

1. Delete the document in Firestore (Console or Admin SDK), e.g. `portfolioProjects/<slug>`.
2. Run export to the seed file: `npm run export:portfolio:to-seed` (or `:sa`).

After step 2, [`projects.json`](projects.json) contains **only** the remaining projects—the deleted one is **not** listed anymore. No extra “delete from JSON” step is required as long as you sync after deleting in Firestore.

- Default output: [`projects.exported.json`](projects.exported.json) (avoids overwriting [`projects.json`](projects.json) by accident).
- **`--out tools/portfolio-seed/projects.json`** writes directly to the seed file used by `seed:portfolio`.
- Timestamps are written as **ISO 8601** strings. Sort order in the file: **`order` ascending**, then `slug`, then `title`.
- **`--no-pretty`**: single-line JSON (default is indented for easier editing).

```bash
npm run export:portfolio
npm run export:portfolio:sa
```

Write straight to the seed file (then edit / improve copy, then seed):

```bash
npm run export:portfolio:to-seed
npm run export:portfolio:to-seed:sa
```

Manual flags:

```bash
node tools/portfolio-seed/export-firestore-to-json.mjs --out tools/portfolio-seed/projects.json --collection portfolioProjects --service-account ./service-account.json
```

### Round-trip: Console or AI → Firestore

1. **Pull:** `npm run export:portfolio:to-seed` (or export to `projects.exported.json` first and compare).
2. **Edit:** change [`projects.json`](projects.json) locally (or ask an AI to improve `summary` / `description` / etc.). Keep the same field shapes the seed script expects.
3. **Push:** `npm run seed:portfolio` (or `seed:portfolio:sa`).

**Seed behavior** ([`seed-firestore.mjs`](seed-firestore.mjs)): each document is updated with `set(..., { merge: true })`. Fields present in the JSON payload overwrite the same fields in Firestore; **fields that exist only in Firestore are not removed**. Existing `createdAt` is preserved when the document already exists.

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
