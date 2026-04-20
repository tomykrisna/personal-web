import fs from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import {initializeApp, applicationDefault, cert} from 'firebase-admin/app';
import {getFirestore, FieldValue} from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');
const defaultJsonPath = path.resolve(__dirname, 'projects.json');
const firebaseRcPath = path.resolve(rootDir, '.firebaserc');

function parseArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function toSlug(text = '') {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getFirebaseAppOptions() {
  const projectId = resolveProjectId();
  const serviceAccountPath = resolveServiceAccountPath();

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return {
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)),
      projectId
    };
  }

  if (serviceAccountPath) {
    const serviceAccount = requireNodeStyleJson(serviceAccountPath);
    return {
      credential: cert(serviceAccount),
      projectId
    };
  }

  return {
    credential: applicationDefault(),
    projectId
  };
}

function resolveProjectId() {
  const argProjectId = parseArg('--project-id');
  if (argProjectId) return argProjectId;

  if (process.env.FIREBASE_PROJECT_ID) return process.env.FIREBASE_PROJECT_ID;
  if (process.env.GCLOUD_PROJECT) return process.env.GCLOUD_PROJECT;
  if (process.env.GOOGLE_CLOUD_PROJECT) return process.env.GOOGLE_CLOUD_PROJECT;

  try {
    const firebasercRaw = requireNodeStyleJson(firebaseRcPath);
    const defaultProjectId = firebasercRaw?.projects?.default;
    if (defaultProjectId) return defaultProjectId;
  } catch {
    // ignore; explicit error is thrown below
  }

  throw new Error(
    [
      'Unable to determine Firebase projectId.',
      'Provide one of:',
      '- --project-id <project-id>',
      '- FIREBASE_PROJECT_ID env var',
      '- .firebaserc with projects.default'
    ].join('\n')
  );
}

function requireNodeStyleJson(filePath) {
  const raw = readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function resolveServiceAccountPath() {
  const argPath = parseArg('--service-account');
  if (argPath) {
    return path.resolve(rootDir, argPath);
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    return path.resolve(rootDir, process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }

  return null;
}

async function readSeedFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error('Seed JSON must be an array of projects.');
  }
  return parsed;
}

function normalizeProject(project, index) {
  const title = (project.title ?? '').trim();
  if (!title) {
    throw new Error(`Project at index ${index} has no title.`);
  }

  const slug = (project.slug ?? '').trim() || toSlug(title);
  const now = FieldValue.serverTimestamp();

  return {
    docId: slug,
    payload: {
      slug,
      title,
      company: project.company ?? '',
      role: project.role ?? 'Software Developer',
      periodLabel: project.periodLabel ?? '',
      startDate: project.startDate ?? '',
      endDate: project.endDate ?? '',
      highlightProject: Boolean(project.highlightProject ?? project.isFeatured ?? false),
      isFeatured: Boolean(project.isFeatured),
      order: Number(project.order ?? index + 1),
      stack: Array.isArray(project.stack) ? project.stack : [],
      summary: project.summary ?? '',
      description: project.description ?? '',
      image: Array.isArray(project.image) ? project.image : [],
      imageFolder: project.imageFolder ?? slug,
      url: project.url ?? '',
      source: 'seed',
      updatedAt: now,
      createdAt: now
    }
  };
}

async function seedFirestore() {
  const jsonPathArg = parseArg('--file');
  const jsonPath = path.resolve(rootDir, jsonPathArg ?? defaultJsonPath);
  const collectionName = parseArg('--collection') ?? 'portfolioProjects';
  const dryRun = process.argv.includes('--dry-run');

  const projects = await readSeedFile(jsonPath);
  const normalizedProjects = projects.map(normalizeProject);

  if (dryRun) {
    console.log(`[dry-run] Prepared ${normalizedProjects.length} project documents for ${collectionName}`);
    console.log(normalizedProjects.map((item) => item.docId));
    return;
  }

  const app = initializeApp(getFirebaseAppOptions());
  const db = getFirestore(app);

  for (const item of normalizedProjects) {
    const ref = db.collection(collectionName).doc(item.docId);
    const existing = await ref.get();

    if (existing.exists) {
      await ref.set(
        {
          ...item.payload,
          createdAt: existing.get('createdAt') ?? FieldValue.serverTimestamp()
        },
        {merge: true}
      );
      console.log(`Updated: ${collectionName}/${item.docId}`);
    } else {
      await ref.set(item.payload, {merge: true});
      console.log(`Created: ${collectionName}/${item.docId}`);
    }
  }

  console.log(`Done. Seeded ${normalizedProjects.length} documents into ${collectionName}.`);
}

seedFirestore().catch((error) => {
  const errorMessage = String(error?.message ?? '');
  if (errorMessage.includes('Could not load the default credentials')) {
    console.error(
      [
        'Firebase Admin credentials are missing.',
        'Use one of these options:',
        '1) --service-account ./service-account.json',
        '2) FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json',
        '3) GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/service-account.json',
        '4) FIREBASE_SERVICE_ACCOUNT_JSON=\'{...json...}\''
      ].join('\n')
    );
  }
  console.error(error);
  process.exit(1);
});
