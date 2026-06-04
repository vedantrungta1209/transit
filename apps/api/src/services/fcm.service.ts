import admin from 'firebase-admin';

let initialized = false;

function getApp() {
  if (!initialized && process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    initialized = true;
  }
  return initialized ? admin : null;
}

export async function sendToDevice(fcmToken: string, title: string, body: string, data?: Record<string, string>): Promise<void> {
  const app = getApp();
  if (!app) {
    console.log(`[FCM] To: ${fcmToken?.slice(0, 10)} | ${title}: ${body}`);
    return;
  }
  await app.messaging().send({ token: fcmToken, notification: { title, body }, data });
}

export async function sendToMultiple(tokens: string[], title: string, body: string, data?: Record<string, string>): Promise<void> {
  if (!tokens.length) return;
  const app = getApp();
  if (!app) {
    console.log(`[FCM] Multicast to ${tokens.length} devices | ${title}`);
    return;
  }
  await app.messaging().sendEachForMulticast({ tokens, notification: { title, body }, data });
}
