import admin from "firebase-admin";

let serviceAccount: admin.ServiceAccount;

try {
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (!base64) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 missing");
  }

  const json = Buffer.from(base64, "base64").toString("utf8");
  const parsed = JSON.parse(json);

  serviceAccount = {
    projectId: parsed.project_id,
    clientEmail: parsed.client_email,
    privateKey: parsed.private_key.replace(/\\n/g, "\n"),
  };
} catch (err: any) {
  console.error("❌ Firebase credential load failed:", err.message);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const firebaseAuth = admin.auth();
