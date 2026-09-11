import fs from "fs";
import path from "path";
import os from "os";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc, writeBatch } from "firebase/firestore";

async function clearAllData() {
  console.log("=== Starting Database Cleanup ===");

  // 1. Clear Firestore Documents if Firebase is connected
  const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(firebaseConfigPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
      const app = !getApps().length ? initializeApp(config) : getApps()[0];
      const dbId = config.firestoreDatabaseId || "(default)";
      const db = getFirestore(app, dbId);
      console.log("[Firebase] Connecting to Firestore to delete all collection documents...");

      const collectionsToWipe = ["users", "chats", "messages", "systemSettings", "reports", "subscriptionRequests"];
      
      for (const colName of collectionsToWipe) {
        try {
          const colRef = collection(db, colName);
          const snap = await getDocs(colRef);
          if (!snap.empty) {
            console.log(`[Firebase] Deleting ${snap.size} documents from collection '${colName}'...`);
            const batch = writeBatch(db);
            snap.forEach(d => batch.delete(d.ref));
            await batch.commit();
            console.log(`[Firebase] Collection '${colName}' cleared successfully.`);
          } else {
            console.log(`[Firebase] Collection '${colName}' is already empty.`);
          }
        } catch (colErr) {
          console.error(`[Firebase] Error wiping collection '${colName}':`, colErr);
        }
      }
    } catch (e) {
      console.error("[Firebase] Firestore cleanup error:", e);
    }
  }

  // 2. Base initial clean structure
  const cleanDb = {
    users: {
      "usr_parham_ai": {
        "id": "usr_parham_ai",
        "username": "parham_ai",
        "nickname": "پرهام AI (هوش مصنوعی)",
        "avatarEmoji": "🤖",
        "avatarColor": "bg-gradient-to-tr from-cyan-500 to-blue-600",
        "bio": "دستیار هوشمند چت و حل مسائل شما مجهز به مدل پیشرفته Gemini.",
        "role": "assistant",
        "isOnline": true,
        "password": "123456",
        "salt": "",
        "passwordHash": "",
        "isTwoFactorEnabled": false,
        "blockedUsers": []
      },
      "usr_parham": {
        "id": "usr_parham",
        "username": "parham",
        "nickname": "پرهام (مدیریت کل سیستم)",
        "avatarEmoji": "👑",
        "avatarColor": "bg-amber-600",
        "bio": "سازنده و مدیر کل سیستم پیام‌رسان",
        "role": "owner",
        "subscriptionTier": "plus",
        "subscriptionPlan": "permanent",
        "isOnline": true,
        "password": "123456",
        "salt": "",
        "passwordHash": "",
        "isTwoFactorEnabled": false,
        "blockedUsers": []
      }
    },
    messages: [],
    chats: [],
    reports: [],
    subscriptionRequests: [],
    systemSettings: {
      "aiModel": "gemini-3.6-flash",
      "aiTemperature": 0.7,
      "aiSearchGrounding": true
    }
  };

  const jsonStr = JSON.stringify(cleanDb, null, 2);

  // 3. Overwrite local persistence files
  const paths = [
    path.join(process.cwd(), "database.json"),
    path.join(process.cwd(), ".database_backup.json"),
    path.join(process.cwd(), ".db_archive.json"),
    path.join(os.tmpdir(), "parham_messenger_db_backup.json")
  ];

  for (const p of paths) {
    try {
      fs.writeFileSync(p, jsonStr, "utf-8");
      console.log(`[Local Disk] Reset file successfully: ${p}`);
    } catch (err) {
      console.warn(`[Local Disk] Could not write to ${p}:`, err);
    }
  }

  console.log("=== Database Cleanup Finished Successfully ===");
}

clearAllData().catch(console.error);
