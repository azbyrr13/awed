
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getServiceAccount() {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (!encoded) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 тохируулаагүй байна.");
  }

  return JSON.parse(
    Buffer.from(encoded, "base64").toString("utf8")
  );
}

const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert(getServiceAccount()),
      });

const db = getFirestore(app);

export { app, db };
