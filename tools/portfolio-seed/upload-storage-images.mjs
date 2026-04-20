import fs from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import {initializeApp, applicationDefault, cert} from 'firebase-admin/app';
import {getStorage} from 'firebase-admin/storage';
import {getFirestore, FieldValue} from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');
const defaultJsonPath = path.resolve(__dirname, 'projects.json');
const defaultImagesRoot = path.resolve(__dirname, 'images');
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
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
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
    const firebasercRaw = JSON.parse(readFileSync(firebaseRcPath, 'utf8'));
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

function encodeStoragePath(filePath) {
  return encodeURIComponent(filePath).replace(/%2F/g, '/');
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

async function listFiles(folderPath) {
  try {
    const entries = await fs.readdir(folderPath, {withFileTypes: true});
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => path.join(folderPath, entry.name))
      .filter((filePath) => /\.(png|jpe?g|webp|gif)$/i.test(filePath))
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

async function uploadImagesAndUpdateFirestore() {
  const seedFilePath = path.resolve(rootDir, parseArg('--file') ?? defaultJsonPath);
  const imagesRoot = path.resolve(rootDir, parseArg('--images-root') ?? defaultImagesRoot);
  const collectionName = parseArg('--collection') ?? 'portfolioProjects';
  const projectId = resolveProjectId();
  const bucketName =
    parseArg('--bucket') ??
    process.env.FIREBASE_STORAGE_BUCKET ??
    `${projectId}.appspot.com`;
  const shouldMakePublic = !process.argv.includes('--private');

  if (!bucketName) {
    throw new Error(
      'Missing bucket name. Pass --bucket <bucket-name> or set FIREBASE_STORAGE_BUCKET.'
    );
  }

  const app = initializeApp({
    ...getFirebaseAppOptions(),
    storageBucket: bucketName
  });

  const db = getFirestore(app);
  const bucket = getStorage(app).bucket(bucketName);
  const projects = await readSeedFile(seedFilePath);

  for (const project of projects) {
    const slug = (project.slug ?? '').trim();
    if (!slug) {
      console.warn('Skipped project without slug:', project.title);
      continue;
    }

    const folderName = (project.imageFolder ?? slug).trim();
    const localFolder = path.join(imagesRoot, folderName);
    const localFiles = await listFiles(localFolder);

    if (!localFiles.length) {
      console.warn(`No local images found for ${slug} at ${localFolder}`);
      continue;
    }

    const uploadedUrls = [];

    for (const localFile of localFiles) {
      const fileName = path.basename(localFile);
      const destination = `portfolio-projects/${slug}/${fileName}`;
      await bucket.upload(localFile, {destination});

      const storageFile = bucket.file(destination);
      if (shouldMakePublic) {
        await storageFile.makePublic();
        uploadedUrls.push(`https://storage.googleapis.com/${bucketName}/${encodeStoragePath(destination)}`);
      } else {
        const [url] = await storageFile.getSignedUrl({
          action: 'read',
          expires: '2100-01-01'
        });
        uploadedUrls.push(url);
      }
    }

    await db.collection(collectionName).doc(slug).set(
      {
        image: uploadedUrls,
        updatedAt: FieldValue.serverTimestamp()
      },
      {merge: true}
    );

    console.log(`Uploaded ${uploadedUrls.length} images and updated ${collectionName}/${slug}`);
  }

  console.log('Done uploading project images.');
}

uploadImagesAndUpdateFirestore().catch((error) => {
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
