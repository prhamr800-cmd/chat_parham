const fs = require('fs');
const path = require('path');
const os = require('os');

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

const paths = [
  path.join(process.cwd(), "database.json"),
  path.join(process.cwd(), ".database_backup.json"),
  path.join(process.cwd(), ".db_archive.json"),
  path.join(os.tmpdir(), "parham_messenger_db_backup.json")
];

for (const p of paths) {
  try {
    fs.writeFileSync(p, jsonStr, "utf-8");
    console.log(`[WIPE] Reset file: ${p}`);
  } catch (err) {
    console.warn(`[WIPE] Could not write to ${p}:`, err);
  }
}
console.log("Database reset complete.");
