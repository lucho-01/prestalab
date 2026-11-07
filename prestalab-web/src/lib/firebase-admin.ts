import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import type { Auth } from 'firebase-admin/auth';
import path from 'path';
import fs from 'fs';

/**
 * Inicializa Firebase Admin con prioridad a variables de entorno
 * (recomendado para despliegue) y, como respaldo, serviceAccountKey.json.
 *
 * Variables esperadas en .env.local:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY   (con \n escapados)
 *
 * La inicialización es tolerante a fallos: si las credenciales no son válidas,
 * el módulo NO tumba la función serverless. Las rutas comprueban
 * `isFirebaseAdminReady()` y responden 503 con un mensaje claro.
 */
const clean = (v?: string) =>
  (v || '').trim().replace(/^["']|["']$/g, '');

export const ADMIN_CONFIG_ERROR =
  'Firebase Admin no está configurado en el servidor. Define FIREBASE_PROJECT_ID, ' +
  'FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY (o guarda serviceAccountKey.json).';

function fromEnv(): { projectId: string; clientEmail: string; privateKey: string } | null {
  const projectId = clean(process.env.FIREBASE_PROJECT_ID);
  const clientEmail = clean(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKey = clean(process.env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }
  return null;
}

function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const envCreds = fromEnv();
  if (envCreds) {
    return initializeApp({
      credential: cert(envCreds),
      projectId: envCreds.projectId,
    });
  }

  const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  }

  // Último recurso: credenciales por defecto del entorno (GOOGLE_APPLICATION_CREDENTIALS)
  console.warn(
    '[firebase-admin] Sin credenciales explícitas: usando Application Default Credentials. ' +
      'Define FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY en .env.local.',
  );
  return initializeApp();
}

let adminApp: App | null = null;
let adminDbInstance: Firestore | null = null;
let adminAuthInstance: Auth | null = null;
let adminInitError: Error | null = null;

try {
  adminApp = getFirebaseAdminApp();
  adminDbInstance = getFirestore(adminApp);
  adminAuthInstance = getAuth(adminApp);
} catch (error) {
  adminInitError = error instanceof Error ? error : new Error(String(error));
  console.error('[firebase-admin] No se pudo inicializar:', adminInitError.message);
}

export const firebaseAdminError: Error | null = adminInitError;

export function isFirebaseAdminReady(): boolean {
  return adminInitError === null && adminDbInstance !== null && adminAuthInstance !== null;
}

/** Sustitutos que fallan al usarse, no al importar el módulo. */
function unavailable(): never {
  throw new Error(ADMIN_CONFIG_ERROR);
}

const unavailableDb = new Proxy({} as Firestore, { get: unavailable });
const unavailableAuth = new Proxy({} as Auth, { get: unavailable });

export const adminDb: Firestore = adminDbInstance ?? unavailableDb;
export const adminAuth: Auth = adminAuthInstance ?? unavailableAuth;

export default adminApp;
