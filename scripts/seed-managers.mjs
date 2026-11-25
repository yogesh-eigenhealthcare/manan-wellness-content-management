import fs from "node:fs";
import path from "node:path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "manan-content-management";

function initAdmin() {
  if (getApps().length > 0) return;
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath && fs.existsSync(credPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(credPath, "utf8"));
    initializeApp({
      credential: cert(serviceAccount),
      projectId: PROJECT_ID,
    });
  } else {
    initializeApp({ projectId: PROJECT_ID });
  }
}

async function main() {
  initAdmin();
  const db = getFirestore();

  const cliEmails = process.argv
    .slice(2)
    .filter((arg) => arg.startsWith("--email="))
    .map((arg) => ({
      email: arg.slice("--email=".length).trim().toLowerCase(),
      teamTag: "Marketing Manager",
    }));

  const configPath = path.resolve(process.cwd(), "scripts/managers.json");
  const rawConfig = fs.existsSync(configPath)
    ? JSON.parse(fs.readFileSync(configPath, "utf8"))
    : { managers: [] };

  const entries = [...(rawConfig.managers || []), ...cliEmails]
    .map((m) => ({
      email: String(m.email || "").trim().toLowerCase(),
      teamTag: String(m.teamTag || "Marketing Manager").trim(),
    }))
    .filter((m) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email));

  if (entries.length === 0) {
    console.log(
      "No manager emails configured yet. Add an email to scripts/managers.json or pass --email=manager@domain.com."
    );
    return;
  }

  for (const entry of entries) {
    await db.collection("rolePreassignments").doc(entry.email).set({
      email: entry.email,
      role: "manager",
      teamTag: entry.teamTag,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // If user already signed in previously, promote their user doc immediately too.
    const existingUsers = await db
      .collection("users")
      .where("email", "==", entry.email)
      .get();

    for (const userDoc of existingUsers.docs) {
      await userDoc.ref.update({
        role: "manager",
        teamTag: entry.teamTag || userDoc.data().teamTag || "Marketing Manager",
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    console.log(`Seeded manager pre-assignment for: ${entry.email}`);
  }
}

main().catch((err) => {
  console.error("Failed to seed managers:", err);
  process.exit(1);
});
