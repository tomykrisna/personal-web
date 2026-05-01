import fs from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import {initializeApp, applicationDefault, cert} from 'firebase-admin/app';
import {getFirestore, Timestamp, GeoPoint, DocumentReference} from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');
const defaultOutPath = path.resolve(__dirname, 'projects.exported.json');
const firebaseRcPath = path.resolve(rootDir, '.firebaserc');

function parseArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
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

function serializeFirestoreValue(value) {
  if (value === null || value === undefined) return value;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof GeoPoint) {
    return {latitude: value.latitude, longitude: value.longitude};
  }
  if (value instanceof DocumentReference) return value.path;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serializeFirestoreValue);
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = serializeFirestoreValue(v);
    }
    return out;
  }
  return value;
}

function sortProjects(projects) {
  return [...projects].sort((a, b) => {
    const oa = Number(a.order ?? 0);
    const ob = Number(b.order ?? 0);
    if (oa !== ob) return oa - ob;
    const slugCmp = String(a.slug ?? '').localeCompare(String(b.slug ?? ''));
    if (slugCmp !== 0) return slugCmp;
    return String(a.title ?? '').localeCompare(String(b.title ?? ''));
  });
}

async function exportFirestoreToJson() {
  const outArg = parseArg('--out');
  const outPath = outArg ? path.resolve(rootDir, outArg) : defaultOutPath;
  const collectionName = parseArg('--collection') ?? 'portfolioProjects';
  const pretty = !process.argv.includes('--no-pretty');

  const app = initializeApp(getFirebaseAppOptions());
  const db = getFirestore(app);
  const snapshot = await db.collection(collectionName).get();

  const projects = [];
  for (const doc of snapshot.docs) {
    const raw = doc.data();
    const serialized = serializeFirestoreValue(raw);
    const slug = (serialized.slug ?? '').trim() || doc.id;
    projects.push({...serialized, slug});
  }

  const sorted = sortProjects(projects);
  const space = pretty ? 2 : undefined;
  const json = `${JSON.stringify(sorted, null, space)}\n`;
  await fs.writeFile(outPath, json, 'utf8');

  console.log(`Exported ${sorted.length} documents from ${collectionName} to ${outPath}`);
}

exportFirestoreToJson().catch((error) => {
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
