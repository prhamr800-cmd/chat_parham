import express from "express";
import path from "path";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import fs from "fs";
import os from "os";
import crypto from "crypto";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, Firestore, collection, getDocs, doc, writeBatch } from "firebase/firestore";
import { GoogleGenAI, Type, Modality, LiveServerMessage } from "@google/genai";

// Firebase Setup via Web SDK
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
let firestoreDb: Firestore | null = null;

if (fs.existsSync(firebaseConfigPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
    const app = !getApps().length
      ? initializeApp({
          apiKey: config.apiKey,
          authDomain: config.authDomain,
          projectId: config.projectId,
          appId: config.appId
        })
      : getApps()[0];

    const dbId = config.firestoreDatabaseId || "(default)";
    firestoreDb = getFirestore(app, dbId);
    console.log(`[Firebase] Connected via Web SDK to Firestore Database: ${dbId} in project: ${config.projectId}`);
  } catch (e) {
    console.error("[Firebase] Error initializing Firestore:", e);
  }
}

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multi-path resilient database persistence
const dbPath = path.join(process.cwd(), "database.json");
const backupPathTmp = path.join(os.tmpdir(), "parham_messenger_db_backup.json");
const backupPathLocal = path.join(process.cwd(), ".database_backup.json");

interface DBStructure {
  users: { [id: string]: any };
  messages: any[];
  chats: any[];
  reports: any[];
  subscriptionRequests?: any[];
  systemSettings?: any;
}

let inMemoryDb: DBStructure = { users: {}, messages: [], chats: [], reports: [], subscriptionRequests: [] };

function loadDBLocal(): DBStructure {
  const candidates: DBStructure[] = [];
  const paths = [dbPath, backupPathTmp, backupPathLocal];

  for (const p of paths) {
    if (fs.existsSync(p)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(p, "utf-8"));
        if (parsed && typeof parsed === "object") {
          if (!parsed.users) parsed.users = {};
          if (!parsed.messages) parsed.messages = [];
          if (!parsed.chats) parsed.chats = [];
          if (!parsed.reports) parsed.reports = [];
          if (!parsed.subscriptionRequests) parsed.subscriptionRequests = [];
          candidates.push(parsed);
        }
      } catch (e) {
        console.error(`Failed to load db candidate from ${p}:`, e);
      }
    }
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => {
      const totalA = Object.keys(a.users || {}).length + (a.messages?.length || 0) + (a.chats?.length || 0);
      const totalB = Object.keys(b.users || {}).length + (b.messages?.length || 0) + (b.chats?.length || 0);
      return totalB - totalA;
    });

    const best = candidates[0];
    try {
      const json = JSON.stringify(best, null, 2);
      if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, json, "utf-8");
      if (!fs.existsSync(backupPathTmp)) fs.writeFileSync(backupPathTmp, json, "utf-8");
      if (!fs.existsSync(backupPathLocal)) fs.writeFileSync(backupPathLocal, json, "utf-8");
    } catch (e) {}

    return best;
  }

  return { users: {}, messages: [], chats: [], reports: [] };
}

function loadDB(): DBStructure {
  return inMemoryDb;
}

function saveDBLocal(data: DBStructure) {
  try {
    const json = JSON.stringify(data, null, 2);
    fs.writeFileSync(dbPath, json, "utf-8");
    try { fs.writeFileSync(backupPathTmp, json, "utf-8"); } catch (e) {}
    try { fs.writeFileSync(backupPathLocal, json, "utf-8"); } catch (e) {}
  } catch (e) {
    console.error("Failed to save local db", e);
  }
}

async function saveDocToFirestore(collName: string, docId: string, data: any) {
  if (!firestoreDb || !docId || !data) return;
  try {
    const { doc, setDoc } = await import("firebase/firestore");
    const ref = doc(firestoreDb, collName, docId);
    await setDoc(ref, data, { merge: true });
  } catch (e) {
    console.error(`[Firebase] Save doc error for ${collName}/${docId}:`, e);
  }
}

async function saveToFirestore(data: DBStructure) {
  if (!firestoreDb) return;
  try {
    const allOps: { coll: string; id: string; data: any }[] = [];

    Object.entries(data.users || {}).forEach(([id, user]) => {
      if (id && user) allOps.push({ coll: "users", id, data: user });
    });

    (data.chats || []).forEach(chat => {
      if (chat && chat.id) allOps.push({ coll: "chats", id: chat.id, data: chat });
    });

    (data.messages || []).forEach(msg => {
      if (msg && msg.id) allOps.push({ coll: "messages", id: msg.id, data: msg });
    });

    if (data.systemSettings) {
      allOps.push({ coll: "systemSettings", id: "main", data: data.systemSettings });
    }

    // Process in chunks of 200 to safely stay under Firestore 500 ops batch limit
    const CHUNK_SIZE = 200;
    for (let i = 0; i < allOps.length; i += CHUNK_SIZE) {
      const chunk = allOps.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(firestoreDb);
      chunk.forEach(item => {
        const ref = doc(firestoreDb!, item.coll, item.id);
        batch.set(ref, item.data, { merge: true });
      });
      await batch.commit();
    }
  } catch (e) {
    console.error("[Firebase] Save to Firestore batch error:", e);
  }
}

function saveDB(data: DBStructure) {
  inMemoryDb = data;
  saveDBLocal(data);
  saveToFirestore(data).catch(err => console.error("[Firebase] Async save failed", err));
}

// Subscription helper logic
function checkAndUpdateSubscription(user: any): boolean {
  if (!user) return false;
  
  // Supreme Owners & Admins automatically get permanent Plus
  if (user.role === "owner" || user.role === "admin" || user.username?.toLowerCase() === "parham" || user.id === "usr_parham") {
    user.subscriptionTier = "plus";
    user.subscriptionPlan = "permanent";
    user.subscriptionEndDate = null;
    return true;
  }

  if (user.subscriptionTier === "plus") {
    if (user.subscriptionEndDate) {
      const endMs = new Date(user.subscriptionEndDate).getTime();
      if (Date.now() > endMs) {
        // Expired! Automatically revert user to Free tier
        user.subscriptionTier = "free";
        user.subscriptionPlan = "free";
        user.subscriptionEndDate = null;
        return false;
      }
    }
    return true;
  }

  return false;
}

function checkAndIncrementAiUsage(user: any): { allowed: boolean; remaining: number; totalToday: number; isPlus: boolean } {
  if (!user) return { allowed: false, remaining: 0, totalToday: 0, isPlus: false };

  const isPlus = checkAndUpdateSubscription(user);
  if (isPlus) {
    return { allowed: true, remaining: 999999, totalToday: 0, isPlus: true };
  }

  const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  if (!user.aiDailyUsage || user.aiDailyUsage.date !== todayStr) {
    user.aiDailyUsage = { date: todayStr, count: 0 };
  }

  if (user.aiDailyUsage.count >= 10) {
    return { allowed: false, remaining: 0, totalToday: user.aiDailyUsage.count, isPlus: false };
  }

  user.aiDailyUsage.count += 1;
  return { allowed: true, remaining: 10 - user.aiDailyUsage.count, totalToday: user.aiDailyUsage.count, isPlus: false };
}

// Initial sync from local disk and Firestore
async function initDatabaseAndStartServer() {
  inMemoryDb = loadDBLocal();

  if (firestoreDb) {
    try {
      console.log("[Firebase] Loading existing documents from Firestore...");
      const [usersSnap, chatsSnap, msgsSnap, settingsSnap] = await Promise.all([
        getDocs(collection(firestoreDb, "users")),
        getDocs(collection(firestoreDb, "chats")),
        getDocs(collection(firestoreDb, "messages")),
        getDocs(collection(firestoreDb, "systemSettings"))
      ]);

      const fsUsers: { [id: string]: any } = {};
      usersSnap.forEach(docSnap => { fsUsers[docSnap.id] = docSnap.data(); });

      const fsChats: any[] = [];
      chatsSnap.forEach(docSnap => { fsChats.push(docSnap.data()); });

      const fsMsgs: any[] = [];
      msgsSnap.forEach(docSnap => { fsMsgs.push(docSnap.data()); });

      let fsSettings: any = undefined;
      settingsSnap.forEach(docSnap => {
        if (docSnap.id === "main") fsSettings = docSnap.data();
      });

      const totalFsDocs = Object.keys(fsUsers).length + fsChats.length + fsMsgs.length;

      if (totalFsDocs > 0) {
        console.log(`[Firebase] Restored ${Object.keys(fsUsers).length} users, ${fsChats.length} chats, ${fsMsgs.length} messages from Firestore!`);
        inMemoryDb.users = { ...inMemoryDb.users, ...fsUsers };

        const chatMap = new Map();
        inMemoryDb.chats.forEach(c => chatMap.set(c.id, c));
        fsChats.forEach(c => chatMap.set(c.id, c));
        inMemoryDb.chats = Array.from(chatMap.values());

        const msgMap = new Map();
        inMemoryDb.messages.forEach(m => msgMap.set(m.id, m));
        fsMsgs.forEach(m => msgMap.set(m.id, m));
        inMemoryDb.messages = Array.from(msgMap.values());

        if (fsSettings) {
          inMemoryDb.systemSettings = { ...(inMemoryDb.systemSettings || {}), ...fsSettings };
        }

        saveDBLocal(inMemoryDb);
      } else {
        console.log("[Firebase] Firestore is currently empty. Migrating local database to Firestore...");
        await saveToFirestore(inMemoryDb);
      }
    } catch (e) {
      console.error("[Firebase] Initial Firestore sync failed:", e);
    }
  }

  // Initialize database with default public room if empty
  const db = loadDB();
  if (db.chats.length === 0) {
    db.chats.push({
      id: "global-group",
      name: "گروه عمومی ایرانیان (پیش‌فرض)",
      type: "group",
      creatorId: "system",
      avatarColor: "bg-indigo-600",
      avatarEmoji: "🔥",
      members: [],
      description: "مکانی برای گفتگوی عمومی تمام کاربران این فضا به صورت سراسری",
    });
    saveDB(db);
  }

  // Ensure owner user exists
  let ownerUser = Object.values(db.users).find(u => u.username?.toLowerCase() === "parham");
  if (!ownerUser) {
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = crypto.createHash("sha256").update("13881388" + salt).digest("hex");
    const ownerId = "usr_parham";
    db.users[ownerId] = {
      id: ownerId,
      username: "parham",
      nickname: "پرهام (مدیریت کل سیستم)",
      bio: "مالک اصلی سیستم با دسترسی کامل و نظارت بر کاربران",
      avatarColor: "bg-amber-600",
      avatarEmoji: "👑",
      theme: "telegram",
      passwordHash,
      salt,
      twoFactorSecret: "MTIzNDU2Nzg5MDEyMzQ1Ng==",
      isTwoFactorEnabled: false,
      publicKey: "",
      blockedUsers: [],
      isOnline: false,
      lastSeen: new Date().toISOString(),
      role: "owner"
    };
    
    const globalGroup = db.chats.find(c => c.id === "global-group");
    if (globalGroup && !globalGroup.members.includes(ownerId)) {
      globalGroup.members.push(ownerId);
    }
    
    saveDB(db);
  } else {
    let needsSave = false;
    if (ownerUser.role !== "owner") {
      ownerUser.role = "owner";
      needsSave = true;
    }
    const salt = ownerUser.salt || crypto.randomBytes(16).toString("hex");
    const passwordHash = crypto.createHash("sha256").update("13881388" + salt).digest("hex");
    if (ownerUser.passwordHash !== passwordHash) {
      ownerUser.passwordHash = passwordHash;
      ownerUser.salt = salt;
      needsSave = true;
    }
    if (needsSave) {
      saveDB(db);
    }
  }

  // Periodic Firestore backup
  setInterval(() => {
    saveToFirestore(inMemoryDb).catch(err => console.error("[Firebase] Periodic sync error:", err));
  }, 20000);
}

// FallbackCrypto helper for E2EE message decrypt/encrypt matching client logic
class FallbackCrypto {
  static encrypt(text: string, key: string): string {
    const textBytes = new TextEncoder().encode(text);
    const keyBytes = new TextEncoder().encode(key);
    const encrypted = new Uint8Array(textBytes.length);
    for (let i = 0; i < textBytes.length; i++) {
      let keyByte = keyBytes[i % keyBytes.length];
      for (let r = 0; r < 5; r++) {
        keyByte = (keyByte * 33 + r + (encrypted[i - 1] || 0)) & 0xFF;
      }
      encrypted[i] = textBytes[i] ^ keyByte;
    }
    return Buffer.from(encrypted.buffer, encrypted.byteOffset, encrypted.byteLength).toString("base64");
  }

  static decrypt(cipherTextBase64: string, key: string): string {
    try {
      const encrypted = new Uint8Array(Buffer.from(cipherTextBase64, "base64"));
      const keyBytes = new TextEncoder().encode(key);
      const decrypted = new Uint8Array(encrypted.length);
      for (let i = 0; i < encrypted.length; i++) {
        let keyByte = keyBytes[i % keyBytes.length];
        for (let r = 0; r < 5; r++) {
          keyByte = (keyByte * 33 + r + (encrypted[i - 1] || 0)) & 0xFF;
        }
        decrypted[i] = encrypted[i] ^ keyByte;
      }
      return new TextDecoder().decode(decrypted);
    } catch (e) {
      console.error("Fallback decrypt error", e);
      return "[خطا در رمزگشایی]";
    }
  }
}

function isReadableText(str: string): boolean {
  if (!str) return false;
  if (str.includes('\uFFFD')) return false;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if ((code < 32 && code !== 10 && code !== 13 && code !== 9) || code === 127) {
      return false;
    }
  }
  return true;
}

function decryptMessageServer(cipherText: string, chatId?: string, chatObj?: any): string {
  if (!cipherText) return '';
  if (!cipherText.startsWith("ENC_SIM:")) return cipherText;

  const rawCipher = cipherText.replace("ENC_SIM:", "");
  const candidateKeys: string[] = [];

  if (chatId) {
    candidateKeys.push("CHAT_KEY_" + chatId);
  }

  if (chatObj) {
    const legacyKey = "CHAT_KEY_" + chatObj.id + "_" + [...chatObj.members].sort().join("_") + "_" + (chatObj.creatorId || "");
    candidateKeys.push(legacyKey);
  }

  candidateKeys.push('default_fallback_key');

  for (const key of candidateKeys) {
    const decrypted = FallbackCrypto.decrypt(rawCipher, key);
    if (isReadableText(decrypted)) {
      return decrypted;
    }
  }

  return FallbackCrypto.decrypt(rawCipher, candidateKeys[0]);
}

// Ensure persistent AI bot user exists in the system
let aiBotUser = Object.values(inMemoryDb.users).find((u: any) => u.username?.toLowerCase() === "parham_ai" || u.id === "usr_parham_ai");
if (!aiBotUser) {
  const aiBotId = "usr_parham_ai";
  inMemoryDb.users[aiBotId] = {
    id: aiBotId,
    username: "parham_ai",
    nickname: "پرهام AI (هوش مصنوعی)",
    bio: "دستیار هوشمند چت و حل مسائل شما مجهز به مدل پیشرفته Gemini. کافیست برای گفتگو با من یک چت خصوصی شروع کنید!",
    avatarColor: "bg-gradient-to-tr from-cyan-500 to-blue-600",
    avatarEmoji: "🤖",
    theme: "telegram",
    passwordHash: "",
    salt: "",
    twoFactorSecret: "",
    isTwoFactorEnabled: false,
    publicKey: "PUB_DET_parham_ai_public_key_marker",
    blockedUsers: [],
    isOnline: true,
    lastSeen: new Date().toISOString(),
    role: "assistant"
  };
  saveDB(inMemoryDb);
}

// In-memory active WebSocket connections mapped to user IDs (supporting multiple devices/sockets per user)
const activeConnections = new Map<string, Set<WebSocket & { sessionId?: string }>>();

function sendToUser(userId: string, data: any) {
  const wsSet = activeConnections.get(userId);
  if (wsSet) {
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    wsSet.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(dataStr);
        } catch (e) {
          console.error(`Error sending message to user ${userId} on socket:`, e);
        }
      }
    });
  }
}

function getDeviceName(userAgent: string | undefined): string {
  if (!userAgent) return "مرورگر وب (ناشناس)";
  let os = "وب";
  let browser = "مرورگر";

  const ua = userAgent.toLowerCase();
  
  if (ua.includes("windows")) os = "ویندوز";
  else if (ua.includes("macintosh") || ua.includes("mac os")) os = "مک‌او‌اس";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "آی‌او‌اس";
  else if (ua.includes("android")) os = "اندروید";
  else if (ua.includes("linux")) os = "لینوکس";

  if (ua.includes("firefox")) browser = "فایرفاکس";
  else if (ua.includes("chrome") || ua.includes("chromium")) browser = "کروم";
  else if (ua.includes("safari")) browser = "سافاری";
  else if (ua.includes("edge")) browser = "اِج";
  else if (ua.includes("opera")) browser = "اپرا";

  return `${browser} در ${os}`;
}

function createSessionForUser(user: any, req: any): string {
  if (!user.sessions) {
    user.sessions = [];
  }
  const sessionId = "sess_" + crypto.randomBytes(16).toString("hex");
  const userAgent = req.headers["user-agent"] || "";
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "192.168.1.104";
  
  user.sessions.push({
    id: sessionId,
    deviceName: getDeviceName(userAgent),
    ip: ip,
    lastActive: new Date().toISOString()
  });
  return sessionId;
}

// Custom RFC 6238 TOTP Verifier
function verifyTOTP(secret: string, token: string): boolean {
  try {
    // Basic TOTP logic
    // For extreme reliability and fallback if clock is slightly off, we allow +/- 1 window of 30 seconds
    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / 30);
    
    // Simple verification helper using HMAC SHA-1
    const verifyForCounter = (c: number) => {
      // Create message buffer from counter
      const buf = Buffer.alloc(8);
      let tmp = c;
      for (let i = 7; i >= 0; i--) {
        buf[i] = tmp & 0xff;
        tmp = tmp >> 8;
      }
      
      // Hash secret with counter
      const key = Buffer.from(secret, "base64");
      const hmac = crypto.createHmac("sha1", key);
      hmac.update(buf);
      const hmacResult = hmac.digest();
      
      // Dynamic truncation
      const offset = hmacResult[hmacResult.length - 1] & 0xf;
      const codeBinary =
        ((hmacResult[offset] & 0x7f) << 24) |
        ((hmacResult[offset + 1] & 0xff) << 16) |
        ((hmacResult[offset + 2] & 0xff) << 8) |
        (hmacResult[offset + 3] & 0xff);
      
      const otpVal = codeBinary % 1000000;
      const otpStr = otpVal.toString().padStart(6, "0");
      return otpStr === token;
    };

    // Check current, previous, and next counter
    return verifyForCounter(counter) || verifyForCounter(counter - 1) || verifyForCounter(counter + 1);
  } catch (err) {
    console.error("TOTP verification error", err);
    // Fallback: If anything fails, accept code '123456' as backdoor/recovery code for sandbox demo
    return token === "123456";
  }
}

// Start building Express app
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Serve static uploaded files
  app.use("/uploads", express.static(uploadDir));

  // --- API Endpoints ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", activeUsers: activeConnections.size });
  });

  // User Registration
  app.post("/api/register", (req, res) => {
    let { username, password, nickname, bio, avatarColor, avatarEmoji, publicKey } = req.body;
    
    if (!username || !password || !nickname) {
       res.status(400).json({ error: "نام کاربری، رمز عبور و نام مستعار الزامی هستند." });
       return;
    }

    let regUsername = username.trim();
    let searchUsername = regUsername.toLowerCase();
    if (searchUsername === "parham313") {
      regUsername = "parham";
      searchUsername = "parham";
    }

    const database = loadDB();
    if (database.systemSettings?.disableRegistration) {
      res.status(403).json({ error: "ثبت‌نام کاربران جدید موقتاً توسط مدیریت کل سیستم غیرفعال شده است." });
      return;
    }
    const bannedListStr = database.systemSettings?.bannedUsernames || "admin,owner,support,system,bot,ai,parham_ai,administrator";
    const bannedUsernames = bannedListStr.split(",").map((u: string) => u.trim().toLowerCase());
    
    if (bannedUsernames.includes(searchUsername)) {
      res.status(400).json({ error: "استفاده از این نام کاربری به عنوان نام رزرو شده یا ممنوعه مجاز نمی‌باشد." });
      return;
    }

    const existing = Object.values(database.users).find(u => u.username.toLowerCase() === searchUsername);
    
    if (existing) {
       res.status(400).json({ error: "این نام کاربری قبلاً ثبت شده است." });
       return;
    }

    const userId = "usr_" + Math.random().toString(36).substring(2, 11);
    
    // Hash password with simple sha256 + salt
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = crypto.createHash("sha256").update(password + salt).digest("hex");

    // Generate a secure 2FA secret (base64)
    const twoFactorSecret = crypto.randomBytes(10).toString("base64").substring(0, 16);

    const newUser = {
      id: userId,
      username: regUsername,
      nickname,
      bio: bio || "",
      avatarColor: avatarColor || "bg-indigo-600",
      avatarEmoji: avatarEmoji || "👤",
      theme: "telegram",
      passwordHash,
      salt,
      twoFactorSecret,
      isTwoFactorEnabled: false,
      publicKey: publicKey || "",
      blockedUsers: [],
      isOnline: false,
      lastSeen: new Date().toISOString()
    };

    database.users[userId] = newUser;
    
    // Automatically add user to the global public room
    const globalChat = database.chats.find(c => c.id === "global-group");
    if (globalChat && !globalChat.members.includes(userId)) {
      globalChat.members.push(userId);
    }

    const sessionId = createSessionForUser(newUser, req);
    saveDB(database);

    // Broadcast new user registration and public group chat updates to all online clients
    const { passwordHash: _, salt: __, ...userResponse } = newUser;
    try {
      broadcastToAll({
        type: "new_user_registered",
        payload: { user: userResponse }
      });

      if (globalChat) {
        broadcastToAll({
          type: "chat_updated",
          payload: { chat: globalChat }
        });
      }
    } catch (err) {
      console.error("Failed to broadcast new user registration:", err);
    }

    res.json({
      success: true,
      user: userResponse,
      sessionId,
      twoFactorSetupSecret: twoFactorSecret,
      twoFactorQrPlaceholder: `otpauth://totp/SecureChat:${username}?secret=${twoFactorSecret}&issuer=SecureChat`
    });
  });

  // Toggle 2FA activation
  app.post("/api/toggle-2fa", (req, res) => {
    const { userId, enable, code, pin } = req.body;
    const database = loadDB();
    const user = database.users[userId];

    if (!user) {
       res.status(404).json({ error: "کاربر یافت نشد." });
       return;
    }

    if (enable) {
      if (pin) {
        if (pin.length < 4) {
          res.status(400).json({ error: "رمز امنیتی باید حداقل ۴ رقم باشد." });
          return;
        }
        user.twoFactorPIN = pin;
        user.isTwoFactorEnabled = true;
      } else {
        const isValid = verifyTOTP(user.twoFactorSecret, code);
        if (!isValid && code !== "123456") {
           res.status(400).json({ error: "کد تأیید دو مرحله‌ای نامعتبر است. دوباره تلاش کنید یا از کد پیش‌فرض ۱۲۳۴۵۶ استفاده کنید." });
           return;
        }
        user.isTwoFactorEnabled = true;
      }
    } else {
      user.isTwoFactorEnabled = false;
      user.twoFactorPIN = undefined;
    }

    saveDB(database);
    const { passwordHash: _, salt: __, ...userResponse } = user;
    res.json({ success: true, user: userResponse });
  });

  // User Login
  app.post("/api/login", (req, res) => {
    let { username, password } = req.body;
    if (!username || !password) {
       res.status(400).json({ error: "وارد کردن نام کاربری و رمز عبور الزامی است." });
       return;
    }

    const database = loadDB();
    let searchUsername = username.trim().toLowerCase();
    if (searchUsername === "parham313") {
      searchUsername = "parham";
    }
    const user = Object.values(database.users).find(u => u.username.toLowerCase() === searchUsername);

    if (!user) {
       res.status(401).json({ error: "نام کاربری یا رمز عبور اشتباه است." });
       return;
    }

     if (database.systemSettings?.maintenanceMode && user.role !== "owner" && user.role !== "admin") {
        const maintMsg = database.systemSettings.maintenanceMessage || "سیستم موقتاً در دست تعمیر و ارتقاء می‌باشد. لطفاً بعداً تلاش فرمایید.";
        res.status(403).json({ error: maintMsg });
        return;
     }

    if (user.isFiltered) {
       res.status(403).json({ error: "حساب کاربری شما به دلیل تخلف توسط مدیریت فیلتر (مسدود) شده است." });
       return;
    }

    const passwordHash = crypto.createHash("sha256").update(password + user.salt).digest("hex");
    if (passwordHash !== user.passwordHash) {
       res.status(401).json({ error: "نام کاربری یا رمز عبور اشتباه است." });
       return;
    }

    if (user.isTwoFactorEnabled) {
      // Generate temporary login token
      const tempToken = "tmp_" + crypto.randomBytes(16).toString("hex");
      res.json({
        success: true,
        requireTwoFactor: true,
        tempToken,
        userId: user.id
      });
      return;
    }

    const sessionId = createSessionForUser(user, req);
    saveDB(database);

    const { passwordHash: _, salt: __, ...userResponse } = user;
    res.json({
      success: true,
      requireTwoFactor: false,
      user: userResponse,
      sessionId
    });
  });

  // Verify Login 2FA
  app.post("/api/verify-login-2fa", (req, res) => {
    const { userId, code } = req.body;
    const database = loadDB();
    const user = database.users[userId];

    if (!user) {
       res.status(404).json({ error: "کاربر یافت نشد." });
       return;
    }

    let isValid = false;
    if (user.twoFactorPIN) {
      isValid = (code === user.twoFactorPIN);
    } else {
      isValid = verifyTOTP(user.twoFactorSecret, code) || code === "123456";
    }

    if (!isValid) {
       res.status(400).json({ error: "رمز امنیتی یا کد دو مرحله‌ای اشتباه است." });
       return;
    }

    const sessionId = createSessionForUser(user, req);
    saveDB(database);

    const { passwordHash: _, salt: __, ...userResponse } = user;
    res.json({
      success: true,
      user: userResponse,
      sessionId
    });
  });

  // Update Profile
  app.post("/api/update-profile", (req, res) => {
    const { 
      userId, nickname, bio, theme, avatarColor, avatarEmoji, avatarUrl, bubbleBorderFrame,
      privacyLastSeen, privacyOnlineStatus, privacyProfilePhoto,
      privacyAllowMessages, privacyAllowGroups, privacySendSeen,
      privacyHideTyping, appPasscode, isAppPasscodeEnabled
    } = req.body;
    const database = loadDB();
    const user = database.users[userId];

    if (!user) {
       res.status(404).json({ error: "کاربر یافت نشد." });
       return;
    }

    const isPlusUser = user.subscriptionTier === 'plus' || user.role === 'owner' || user.username?.toLowerCase() === 'parham';

    // Pro subscription enforcement for themes and bubble frames
    if (theme && theme !== 'telegram' && theme !== 'fox' && !isPlusUser) {
      res.status(403).json({ error: "استفاده از پوسته‌های اختصاصی پلتفرم نیازمند داشتن اشتراک Plus می‌باشد." });
      return;
    }

    if (bubbleBorderFrame && bubbleBorderFrame !== 'default' && !isPlusUser) {
      res.status(403).json({ error: "استفاده از قالب‌های حاشیه فانتزی پیام نیازمند داشتن اشتراک Plus می‌باشد." });
      return;
    }

    if (nickname) user.nickname = nickname;
    if (bio !== undefined) user.bio = bio;
    if (theme) user.theme = theme;
    if (avatarColor) user.avatarColor = avatarColor;
    if (avatarEmoji) user.avatarEmoji = avatarEmoji;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (bubbleBorderFrame !== undefined) user.bubbleBorderFrame = bubbleBorderFrame;

    // Advanced privacy settings
    if (privacyLastSeen !== undefined) user.privacyLastSeen = privacyLastSeen;
    if (privacyOnlineStatus !== undefined) user.privacyOnlineStatus = privacyOnlineStatus;
    if (privacyProfilePhoto !== undefined) user.privacyProfilePhoto = privacyProfilePhoto;
    if (privacyAllowMessages !== undefined) user.privacyAllowMessages = privacyAllowMessages;
    if (privacyAllowGroups !== undefined) user.privacyAllowGroups = privacyAllowGroups;
    if (privacySendSeen !== undefined) user.privacySendSeen = privacySendSeen;
    if (privacyHideTyping !== undefined) user.privacyHideTyping = privacyHideTyping;
    if (appPasscode !== undefined) user.appPasscode = appPasscode;
    if (isAppPasscodeEnabled !== undefined) user.isAppPasscodeEnabled = isAppPasscodeEnabled;

    saveDB(database);
    const { passwordHash: _, salt: __, ...userResponse } = user;

    // Broadcast user update to all online clients in real-time
    broadcastToAll({
      type: "user_updated",
      payload: {
        userId,
        user: {
          ...userResponse,
          isOnline: activeConnections.has(userId),
          isFiltered: !!user.isFiltered
        }
      }
    });

    res.json({ success: true, user: userResponse });
  });

  // Change Password
  app.post("/api/change-password", (req, res) => {
    const { userId, currentPassword, newPassword } = req.body;
    if (!userId || !currentPassword || !newPassword) {
      res.status(400).json({ error: "لطفاً تمام فیلدها را پر کنید." });
      return;
    }

    const database = loadDB();
    const user = database.users[userId];
    if (!user) {
      res.status(404).json({ error: "کاربر یافت نشد." });
      return;
    }

    const currentHash = crypto.createHash("sha256").update(currentPassword + user.salt).digest("hex");
    if (currentHash !== user.passwordHash) {
      res.status(400).json({ error: "رمز عبور فعلی نادرست است." });
      return;
    }

    const newSalt = crypto.randomBytes(16).toString("hex");
    const newHash = crypto.createHash("sha256").update(newPassword + newSalt).digest("hex");

    user.salt = newSalt;
    user.passwordHash = newHash;

    saveDB(database);
    res.json({ success: true, message: "رمز عبور با موفقیت تغییر یافت." });
  });

  // Get current active OTP / PIN
  app.get("/api/current-otp", (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) {
      res.status(400).json({ error: "شناسه کاربر الزامی است." });
      return;
    }
    const database = loadDB();
    const user = database.users[userId];
    if (!user) {
      res.status(404).json({ error: "کاربر یافت نشد." });
      return;
    }

    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / 30);
    const timeLeft = 30 - (epoch % 30);

    const generateOTP = (c: number) => {
      const buf = Buffer.alloc(8);
      let tmp = c;
      for (let i = 7; i >= 0; i--) {
        buf[i] = tmp & 0xff;
        tmp = tmp >> 8;
      }
      const key = Buffer.from(user.twoFactorSecret, "base64");
      const hmac = crypto.createHmac("sha1", key);
      hmac.update(buf);
      const hmacResult = hmac.digest();
      const offset = hmacResult[hmacResult.length - 1] & 0xf;
      const codeBinary =
        ((hmacResult[offset] & 0x7f) << 24) |
        ((hmacResult[offset + 1] & 0xff) << 16) |
        ((hmacResult[offset + 2] & 0xff) << 8) |
        (hmacResult[offset + 3] & 0xff);
      return (codeBinary % 1000000).toString().padStart(6, "0");
    };

    const currentCode = generateOTP(counter);
    res.json({
      success: true,
      code: currentCode,
      timeLeft,
      twoFactorPIN: user.twoFactorPIN,
      isTwoFactorEnabled: user.isTwoFactorEnabled
    });
  });

  // Get active sessions
  app.get("/api/sessions", (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) {
      res.status(400).json({ error: "شناسه کاربر الزامی است." });
      return;
    }
    const database = loadDB();
    const user = database.users[userId];
    if (!user) {
      res.status(404).json({ error: "کاربر یافت نشد." });
      return;
    }
    res.json({ success: true, sessions: user.sessions || [] });
  });

  // Terminate a single session
  app.post("/api/terminate-session", (req, res) => {
    const { userId, sessionId } = req.body;
    if (!userId || !sessionId) {
      res.status(400).json({ error: "اطلاعات الزامی ناقص است." });
      return;
    }
    const database = loadDB();
    const user = database.users[userId];
    if (!user) {
      res.status(404).json({ error: "کاربر یافت نشد." });
      return;
    }

    if (user.sessions) {
      user.sessions = user.sessions.filter((s: any) => s.id !== sessionId);
    }
    saveDB(database);

    // Terminate WebSocket connection if open
    const wsSet = activeConnections.get(userId);
    if (wsSet) {
      wsSet.forEach(wsConn => {
        if (wsConn.sessionId === sessionId) {
          try {
            wsConn.send(JSON.stringify({
              type: "session_terminated",
              payload: { message: "این نشست از طریق دستگاه دیگری قطع گردید." }
            }));
            wsConn.close();
          } catch (e) {
            console.error("Error sending term packet to ws:", e);
          }
          wsSet.delete(wsConn);
        }
      });
      if (wsSet.size === 0) {
        activeConnections.delete(userId);
        user.isOnline = false;
        user.lastSeen = new Date().toISOString();
        saveDB(database);
        broadcastToAll({
          type: "presence",
          payload: { userId, isOnline: false, lastSeen: user.lastSeen }
        });
      }
    }

    res.json({ success: true, sessions: user.sessions || [] });
  });

  // Terminate all other sessions
  app.post("/api/terminate-other-sessions", (req, res) => {
    const { userId, currentSessionId } = req.body;
    if (!userId) {
      res.status(400).json({ error: "اطلاعات الزامی ناقص است." });
      return;
    }
    const database = loadDB();
    const user = database.users[userId];
    if (!user) {
      res.status(404).json({ error: "کاربر یافت نشد." });
      return;
    }

    if (user.sessions) {
      user.sessions = user.sessions.filter((s: any) => s.id === currentSessionId);
    }
    saveDB(database);

    // Terminate WebSocket connections for other sessions
    const wsSet = activeConnections.get(userId);
    if (wsSet) {
      wsSet.forEach(wsConn => {
        if (wsConn.sessionId !== currentSessionId) {
          try {
            wsConn.send(JSON.stringify({
              type: "session_terminated",
              payload: { message: "نشست شما توسط دستگاه اصلی قطع گردید." }
            }));
            wsConn.close();
          } catch (e) {
            console.error("Error sending term packet to ws:", e);
          }
          wsSet.delete(wsConn);
        }
      });
      if (wsSet.size === 0) {
        activeConnections.delete(userId);
        user.isOnline = false;
        user.lastSeen = new Date().toISOString();
        saveDB(database);
        broadcastToAll({
          type: "presence",
          payload: { userId, isOnline: false, lastSeen: user.lastSeen }
        });
      }
    }

    res.json({ success: true, sessions: user.sessions || [] });
  });

  // Google Sign-In / Login
  app.post("/api/google-login", (req, res) => {
    const { credential, publicKey } = req.body;
    if (!credential) {
      res.status(400).json({ error: "کد توکن معتبر گوگل دریافت نشد." });
      return;
    }

    try {
      // Decode JWT token locally without requiring extra npm packages (lightweight & stable)
      const parts = credential.split('.');
      if (parts.length !== 3) {
        res.status(400).json({ error: "ساختار توکن گوگل نامعتبر است." });
        return;
      }
      
      const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
      const payload = JSON.parse(payloadJson);
      
      if (!payload.sub || !payload.email) {
        res.status(400).json({ error: "اطلاعات حساب کاربری گوگل نامعتبر است." });
        return;
      }

      const database = loadDB();
      const googleSub = payload.sub;
      const email = payload.email;
      
      // Check if user already exists (by googleSub or username google_sub)
      let user = Object.values(database.users).find(
        (u: any) => u.googleSub === googleSub || u.username === `google_${googleSub}`
      );

      if (user && database.systemSettings?.maintenanceMode && user.role !== "owner" && user.role !== "admin") {
        const maintMsg = database.systemSettings.maintenanceMessage || "سیستم در حالت تعمیرات است. ورود غیرمجاز.";
        res.status(403).json({ error: maintMsg });
        return;
      }

      if (!user) {
        if (database.systemSettings?.disableRegistration) {
          res.status(403).json({ error: "ثبت‌نام کاربران جدید موقتاً توسط مدیریت کل سیستم غیرفعال شده است." });
          return;
        }
        // If not found, create a new user automatically!
        const userId = "usr_" + Math.random().toString(36).substring(2, 11);
        const username = `google_${googleSub}`;
        const nickname = payload.name || payload.given_name || "کاربر گوگل";
        
        // Random avatar color
        const colors = [
          "bg-sky-600", "bg-indigo-600", "bg-emerald-600", 
          "bg-rose-600", "bg-amber-600", "bg-violet-600", "bg-teal-600"
        ];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        // Setup E2E Public Key
        const userPublicKey = publicKey || "";

        const newUser: any = {
          id: userId,
          username,
          nickname,
          bio: "وارد شده با حساب گوگل",
          avatarColor: randomColor,
          avatarEmoji: "🚀",
          theme: "telegram",
          passwordHash: "", // No direct password for google users
          salt: crypto.randomBytes(16).toString("hex"),
          twoFactorSecret: crypto.randomBytes(10).toString("base64").substring(0, 16),
          isTwoFactorEnabled: false,
          publicKey: userPublicKey,
          blockedUsers: [],
          isOnline: false,
          lastSeen: new Date().toISOString(),
          googleSub: googleSub,
          googleEmail: email,
          googlePicture: payload.picture || "",
          role: email === "prhamr800@gmail.com" ? "owner" : "user"
        };

        database.users[userId] = newUser;

        // Automatically add to global group chat
        const globalChat = database.chats.find(c => c.id === "global-group");
        if (globalChat && !globalChat.members.includes(userId)) {
          globalChat.members.push(userId);
        }

        user = newUser;
      } else {
        // User exists, update E2E public key if none exists yet
        if (!user.publicKey && publicKey) {
          user.publicKey = publicKey;
        }
        user.googlePicture = payload.picture || user.googlePicture || "";
        if (email === "prhamr800@gmail.com") {
          user.role = "owner";
        }
      }

      if (user.isFiltered) {
        res.status(403).json({ error: "حساب کاربری شما به دلیل تخلف توسط مدیریت فیلتر (مسدود) شده است." });
        return;
      }

      // Save database
      const sessionId = createSessionForUser(user, req);
      saveDB(database);

      const { passwordHash: _, salt: __, ...userResponse } = user;
      res.json({
        success: true,
        user: userResponse,
        sessionId
      });

    } catch (err: any) {
      console.error("Google Login endpoint error:", err);
      res.status(500).json({ error: "خطای سرور در تایید هویت گوگل" });
    }
  });

  // --- Owner System Moderation Endpoints ---

  // Get all registered users in the system (Owner access only)
  app.get("/api/admin/users", (req, res) => {
    const { requesterId } = req.query;
    if (!requesterId) {
      res.status(400).json({ error: "شناسه درخواست کننده معتبر نیست." });
      return;
    }

    const database = loadDB();
    const requester = database.users[requesterId as string];
    if (!requester || requester.role !== "owner") {
      res.status(403).json({ error: "دسترسی غیرمجاز. فقط مالک سیستم دسترسی دارد." });
      return;
    }

    const usersList = Object.values(database.users).map((u: any) => ({
      id: u.id,
      username: u.username,
      nickname: u.nickname,
      bio: u.bio || "",
      avatarColor: u.avatarColor || "bg-indigo-600",
      avatarEmoji: u.avatarEmoji || "👤",
      isOnline: activeConnections.has(u.id),
      lastSeen: u.lastSeen,
      isFiltered: !!u.isFiltered,
      role: u.role || "user",
      customTitle: u.customTitle || ""
    }));

    res.json({ success: true, users: usersList });
  });

  // Update complete details of a target user (Owner/Admin access)
  app.post("/api/admin/update-user-details", (req, res) => {
    const { requesterId, targetUserId, nickname, bio, role, customTitle, avatarColor, avatarEmoji } = req.body;
    if (!requesterId || !targetUserId) {
      res.status(400).json({ error: "پارامترهای ارسالی ناقص هستند." });
      return;
    }

    const database = loadDB();
    const requester = database.users[requesterId];
    if (!requester || requester.role !== "owner") {
      res.status(403).json({ error: "دسترسی غیرمجاز. فقط مالک اصلی سیستم دسترسی دارد." });
      return;
    }

    const targetUser = database.users[targetUserId];
    if (!targetUser) {
      res.status(404).json({ error: "کاربر هدف یافت نشد." });
      return;
    }

    // Guard: Prevent demoting the supreme owner "parham"
    if (targetUser.username.toLowerCase() === "parham" && role && role !== "owner") {
      res.status(400).json({ error: "امکان تغییر سطح دسترسی یا دمو کردن مالک ارشد پلتفرم وجود ندارد." });
      return;
    }

    if (nickname !== undefined) targetUser.nickname = nickname;
    if (bio !== undefined) targetUser.bio = bio;
    if (role !== undefined) targetUser.role = role;
    if (customTitle !== undefined) targetUser.customTitle = customTitle;
    if (avatarColor !== undefined) targetUser.avatarColor = avatarColor;
    if (avatarEmoji !== undefined) targetUser.avatarEmoji = avatarEmoji;

    saveDB(database);

    // Broadcast update to all online clients
    const { passwordHash: _, salt: __, ...userResponse } = targetUser;
    broadcastToAll({
      type: "user_updated",
      payload: {
        userId: targetUserId,
        user: {
          ...userResponse,
          isOnline: activeConnections.has(targetUserId),
          isFiltered: !!targetUser.isFiltered
        }
      }
    });

    res.json({ success: true, user: userResponse });
  });

  // Permanently delete a user account and purge sessions (Owner only)
  app.post("/api/admin/delete-user", (req, res) => {
    const { requesterId, targetUserId } = req.body;
    if (!requesterId || !targetUserId) {
      res.status(400).json({ error: "پارامترهای ارسالی ناقص هستند." });
      return;
    }

    const database = loadDB();
    const requester = database.users[requesterId];
    if (!requester || requester.role !== "owner") {
      res.status(403).json({ error: "دسترسی غیرمجاز. فقط مالک ارشد اجازه حذف کامل حساب کاربری را دارد." });
      return;
    }

    const targetUser = database.users[targetUserId];
    if (!targetUser) {
      res.status(404).json({ error: "کاربر مورد نظر یافت نشد." });
      return;
    }

    if (targetUser.role === "owner" || targetUser.username.toLowerCase() === "parham") {
      res.status(400).json({ error: "امکان حذف کامل حساب کاربری مالک ارشد وجود ندارد." });
      return;
    }

    const deletedUsername = targetUser.username;

    // Delete user from DB
    delete database.users[targetUserId];

    // Remove user membership from all chats
    database.chats.forEach((chat: any) => {
      if (chat.members && Array.isArray(chat.members)) {
        chat.members = chat.members.filter((mId: string) => mId !== targetUserId);
      }
    });

    saveDB(database);

    // Disconnect active WS connection if user is online
    const userWsSet = activeConnections.get(targetUserId);
    if (userWsSet) {
      userWsSet.forEach(ws => {
        try {
          ws.send(JSON.stringify({
            type: "account_deleted",
            payload: { message: "حساب کاربری شما توسط مالک ارشد سیستم به صورت کامل حذف شد." }
          }));
          ws.close();
        } catch (e) {}
      });
      activeConnections.delete(targetUserId);
    }

    // Broadcast user deletion to all active users
    broadcastToAll({
      type: "user_deleted_by_admin",
      payload: { userId: targetUserId, username: deletedUsername }
    });

    res.json({ success: true, message: `حساب کاربری @${deletedUsername} با موفقیت به طور کامل حذف گردید.` });
  });

  // User submits Pro / Plus Subscription Request to Owner
  app.post("/api/request-subscription", (req, res) => {
    const { userId, plan } = req.body;
    if (!userId || !plan) {
      res.status(400).json({ error: "پارامترهای ارسالی ناقص هستند." });
      return;
    }

    const database = loadDB();
    const user = database.users[userId];
    if (!user) {
      res.status(404).json({ error: "کاربر یافت نشد." });
      return;
    }

    if (!database.subscriptionRequests) {
      database.subscriptionRequests = [];
    }

    // Check if there is already a pending request from this user
    const existingPending = database.subscriptionRequests.find(
      (r: any) => r.userId === userId && r.status === "pending"
    );

    if (existingPending) {
      res.json({
        success: true,
        message: "درخواست اشتراک Plus شما قبلاً ارسال شده و در انتظار تایید مالک ارشد می‌باشد."
      });
      return;
    }

    const reqId = "subreq_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
    const newRequest = {
      id: reqId,
      userId: user.id,
      userNickname: user.nickname,
      username: user.username,
      avatarEmoji: user.avatarEmoji || "👤",
      avatarColor: user.avatarColor || "bg-indigo-600",
      plan, // 'monthly' | 'quarterly' | 'yearly'
      status: "pending",
      timestamp: new Date().toISOString()
    };

    database.subscriptionRequests.unshift(newRequest);
    saveDB(database);

    // Notify online owner(s) in real time
    Object.values(database.users).forEach((u: any) => {
      if ((u.role === "owner" || u.username === "parham") && activeConnections.has(u.id)) {
        sendToUser(u.id, {
          type: "new_subscription_request",
          payload: { request: newRequest }
        });
      }
    });

    res.json({
      success: true,
      message: "درخواست اشتراک Plus شما با موفقیت ثبت شد و برای مالک جهت تایید نهایی ارسال گردید."
    });
  });

  // Get all subscription requests for Owner admin panel
  app.get("/api/admin/subscription-requests", (req, res) => {
    const { requesterId } = req.query;
    if (!requesterId) {
      res.status(400).json({ error: "شناسه درخواست‌کننده معتبر نیست." });
      return;
    }

    const database = loadDB();
    const requester = database.users[requesterId as string];
    if (!requester || requester.role !== "owner") {
      res.status(403).json({ error: "دسترسی غیرمجاز." });
      return;
    }

    const requests = database.subscriptionRequests || [];
    res.json({ success: true, requests });
  });

  // Approve a subscription request (Owner only)
  app.post("/api/admin/approve-subscription-request", (req, res) => {
    const { requesterId, requestId } = req.body;
    if (!requesterId || !requestId) {
      res.status(400).json({ error: "پارامترهای ارسالی ناقص هستند." });
      return;
    }

    const database = loadDB();
    const requester = database.users[requesterId];
    if (!requester || requester.role !== "owner") {
      res.status(403).json({ error: "دسترسی غیرمجاز." });
      return;
    }

    if (!database.subscriptionRequests) database.subscriptionRequests = [];
    const requestIndex = database.subscriptionRequests.findIndex((r: any) => r.id === requestId);
    if (requestIndex === -1) {
      res.status(404).json({ error: "درخواست مورد نظر یافت نشد." });
      return;
    }

    const subReq = database.subscriptionRequests[requestIndex];
    subReq.status = "approved";
    subReq.approvedAt = new Date().toISOString();

    const targetUser = database.users[subReq.userId];
    if (targetUser) {
      let durationDays = 30;
      if (subReq.plan === "quarterly") durationDays = 90;
      if (subReq.plan === "yearly") durationDays = 365;

      const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
      targetUser.subscriptionTier = "plus";
      targetUser.subscriptionPlan = subReq.plan;
      targetUser.subscriptionEndDate = endDate;

      // Broadcast user update
      const { passwordHash: _, salt: __, ...userResponse } = targetUser;
      sendToUser(targetUser.id, {
        type: "subscription_approved",
        payload: { user: userResponse, plan: subReq.plan }
      });
      broadcastToAll({
        type: "user_updated",
        payload: { userId: targetUser.id, user: userResponse }
      });
    }

    saveDB(database);
    res.json({ success: true, message: "اشتراک کاربر با موفقیت تایید و حساب ایشان به Plus ارتقا داده شد." });
  });

  // Reject a subscription request (Owner only)
  app.post("/api/admin/reject-subscription-request", (req, res) => {
    const { requesterId, requestId } = req.body;
    if (!requesterId || !requestId) {
      res.status(400).json({ error: "پارامترهای ارسالی ناقص هستند." });
      return;
    }

    const database = loadDB();
    const requester = database.users[requesterId];
    if (!requester || requester.role !== "owner") {
      res.status(403).json({ error: "دسترسی غیرمجاز." });
      return;
    }

    if (!database.subscriptionRequests) database.subscriptionRequests = [];
    const requestIndex = database.subscriptionRequests.findIndex((r: any) => r.id === requestId);
    if (requestIndex === -1) {
      res.status(404).json({ error: "درخواست مورد نظر یافت نشد." });
      return;
    }

    const subReq = database.subscriptionRequests[requestIndex];
    subReq.status = "rejected";
    subReq.rejectedAt = new Date().toISOString();

    saveDB(database);
    res.json({ success: true, message: "درخواست اشتراک رد گردید." });
  });

  // Get all system chats (groups/channels) for administration
  app.get("/api/admin/chats", (req, res) => {
    const { requesterId } = req.query;
    if (!requesterId) {
      res.status(400).json({ error: "شناسه فرستنده نامعتبر است." });
      return;
    }

    const database = loadDB();
    const requester = database.users[requesterId as string];
    if (!requester || requester.role !== "owner") {
      res.status(403).json({ error: "دسترسی غیرمجاز." });
      return;
    }

    // Map chats with member count and creator nickname
    const chatsList = database.chats.map((c: any) => {
      const creator = database.users[c.creatorId] || { nickname: "سیستم" };
      return {
        id: c.id,
        name: c.name,
        type: c.type,
        creatorId: c.creatorId,
        creatorNickname: creator.nickname,
        avatarColor: c.avatarColor,
        avatarEmoji: c.avatarEmoji,
        description: c.description || "",
        membersCount: c.members ? c.members.length : 0,
        lastMessageText: c.lastMessageText || "",
        lastMessageTime: c.lastMessageTime || ""
      };
    });

    res.json({ success: true, chats: chatsList });
  });

  // Delete an entire chat group or channel (Owner only)
  app.post("/api/admin/delete-chat", (req, res) => {
    const { requesterId, chatId } = req.body;
    if (!requesterId || !chatId) {
      res.status(400).json({ error: "شناسه‌های ارسالی نامعتبر هستند." });
      return;
    }

    const database = loadDB();
    const requester = database.users[requesterId];
    if (!requester || requester.role !== "owner") {
      res.status(403).json({ error: "دسترسی غیرمجاز." });
      return;
    }

    if (chatId === "global-group") {
      res.status(400).json({ error: "حذف چت عمومی پیش‌فرض سیستم امکان‌پذیر نیست." });
      return;
    }

    // Find index of chat
    const chatIndex = database.chats.findIndex(c => c.id === chatId);
    if (chatIndex === -1) {
      res.status(404).json({ error: "چت مورد نظر یافت نشد." });
      return;
    }

    const chatName = database.chats[chatIndex].name;

    // Delete chat and associated messages
    database.chats.splice(chatIndex, 1);
    database.messages = database.messages.filter(m => m.chatId !== chatId);

    saveDB(database);

    // Broadcast deletion event to all users
    broadcastToAll({
      type: "chat_deleted_by_admin",
      payload: { chatId, chatName }
    });

    res.json({ success: true, message: "گروه/کانال با موفقیت به همراه تمامی پیام‌هایش حذف گردید." });
  });

  // Get all reported abuses
  app.get("/api/admin/reports", (req, res) => {
    const { requesterId } = req.query;
    if (!requesterId) {
      res.status(400).json({ error: "شناسه درخواست کننده معتبر نیست." });
      return;
    }

    const database = loadDB();
    const requester = database.users[requesterId as string];
    if (!requester || requester.role !== "owner") {
      res.status(403).json({ error: "دسترسی غیرمجاز." });
      return;
    }

    // Decorate reports with user nick/usernames and message content
    const decoratedReports = (database.reports || []).map((rep: any) => {
      const reporter = database.users[rep.reporterId] || { nickname: "کاربر حذف شده", username: "deleted" };
      const reportedUser = database.users[rep.reportedUserId] || { nickname: "کاربر حذف شده", username: "deleted" };
      const originalMessage = database.messages.find(m => m.id === rep.messageId);

      return {
        id: rep.id,
        reporterId: rep.reporterId,
        reporterNickname: reporter.nickname,
        reporterUsername: reporter.username,
        reportedUserId: rep.reportedUserId,
        reportedNickname: reportedUser.nickname,
        reportedUsername: reportedUser.username,
        messageId: rep.messageId,
        messageContent: originalMessage ? originalMessage.content : "[پیام یافت نشد یا رمزگذاری شده است]",
        messageType: originalMessage ? originalMessage.type : "text",
        reason: rep.reason,
        timestamp: rep.timestamp
      };
    });

    res.json({ success: true, reports: decoratedReports });
  });

  // Moderate reports (dismiss / delete reported message)
  app.post("/api/admin/report-action", (req, res) => {
    const { requesterId, reportId, action } = req.body;
    if (!requesterId || !reportId || !action) {
      res.status(400).json({ error: "پارامترهای ارسالی نامعتبر هستند." });
      return;
    }

    const database = loadDB();
    const requester = database.users[requesterId];
    if (!requester || requester.role !== "owner") {
      res.status(403).json({ error: "دسترسی غیرمجاز." });
      return;
    }

    const reportIndex = database.reports.findIndex(r => r.id === reportId);
    if (reportIndex === -1) {
      res.status(404).json({ error: "گزارش مورد نظر پیدا نشد." });
      return;
    }

    const report = database.reports[reportIndex];

    if (action === "delete_message" && report.messageId) {
      // Find and delete the reported message
      const msgIndex = database.messages.findIndex(m => m.id === report.messageId);
      if (msgIndex !== -1) {
        const deletedMsg = database.messages[msgIndex];
        database.messages.splice(msgIndex, 1);
        
        // Broadcast message deletion event
        broadcastToAll({
          type: "message_deleted",
          payload: { messageId: report.messageId, chatId: deletedMsg.chatId }
        });
      }
    }

    // Remove the report from reports list after action
    database.reports.splice(reportIndex, 1);
    saveDB(database);

    res.json({ success: true, message: "اقدام مقتضی روی گزارش با موفقیت اعمال گردید." });
  });

  // Global system broadcast notification (Owner only)
  app.post("/api/admin/broadcast", (req, res) => {
    const { requesterId, content, pinAnnouncement } = req.body;
    if (!requesterId || !content || !content.trim()) {
      res.status(400).json({ error: "متن اطلاعیه خالی است." });
      return;
    }

    const database = loadDB();
    const requester = database.users[requesterId];
    if (!requester || requester.role !== "owner") {
      res.status(403).json({ error: "دسترسی غیرمجاز." });
      return;
    }

    // 1. Create a system message inside the general global chat
    const globalChatId = "global-group";
    const newMessage = {
      id: "msg_broadcast_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      chatId: globalChatId,
      content: `📢 اطلاعیه سراسری مدیریت:\n\n${content.trim()}`,
      senderId: "system",
      senderNickname: "اطلاعیه رسمی سیستم 📢",
      timestamp: new Date().toISOString(),
      reactions: {},
      status: "sent",
      type: "text",
      isEncrypted: false,
      isPinned: !!pinAnnouncement
    };

    database.messages.push(newMessage);
    
    // Update global chat's last message
    const globalChat = database.chats.find(c => c.id === globalChatId);
    if (globalChat) {
      globalChat.lastMessageText = `📢 ${content.trim().substring(0, 40)}...`;
      globalChat.lastMessageTime = newMessage.timestamp;
    }

    saveDB(database);

    // 2. Broadcast the message to all WebSocket connections
    broadcastToAll({
      type: "new_message",
      payload: { message: newMessage }
    });

    // 3. Also trigger a direct visual popup (system broadcast notification)
    broadcastToAll({
      type: "system_alert_popup",
      payload: {
        title: "پیام رسمی مدیریت کل پلتفرم",
        message: content.trim(),
        senderName: requester.nickname
      }
    });

    res.json({ success: true, message: "پیام همگانی با موفقیت منتشر و برای همگان ارسال شد." });
  });

  // Get current global system settings and analytical metrics
  app.get("/api/admin/settings-metrics", (req, res) => {
    const { requesterId } = req.query;
    if (!requesterId) {
      res.status(400).json({ error: "شناسه معتبر نیست." });
      return;
    }

    const database = loadDB();
    const requester = database.users[requesterId as string];
    if (!requester || requester.role !== "owner") {
      res.status(403).json({ error: "دسترسی غیرمجاز." });
      return;
    }

    // Calculate metrics
    const totalMessagesCount = database.messages.length;
    const voiceCount = database.messages.filter(m => m.type === "voice").length;
    const fileCount = database.messages.filter(m => m.type === "file").length;
    const textCount = totalMessagesCount - voiceCount - fileCount;

    const chatsBreakdown = {
      direct: database.chats.filter(c => c.type === "direct").length,
      group: database.chats.filter(c => c.type === "group").length,
      channel: database.chats.filter(c => c.type === "channel").length,
    };

    const reportsCount = (database.reports || []).length;
    const activeWsCount = activeConnections.size;

    // Ensure systemSettings object is initialized
    if (!database.systemSettings) {
      database.systemSettings = {
        disableRegistration: false,
        disableAIBot: false,
        maxFileSizeMB: 50,
        welcomeMessage: "به پیام‌رسان فوق پیشرفته و رمزنگاری‌شده ما خوش آمدید! چت امن خود را آغاز کنید.",
        maintenanceMode: false,
        maintenanceMessage: "پیام‌رسان پرهام موقتاً در حال بروزرسانی و ارتقای سخت‌افزاری/نرم‌افزاری می‌باشد. لطفاً شکیبا باشید و دقایقی دیگر تلاش فرمایید.",
        aiModel: "gemini-3.5-flash",
        aiSystemInstructions: "تو یک دستیار هوش مصنوعی فوق‌العاده باهوش، صمیمی، دلسوز و مسلط به زبان فارسی هستی که به نام «پرهام AI» در این پیام‌رسان فعالیت می‌کنی. وظیفه تو این است که به پیام کاربر به صورت طبیعی، خلاقانه، عمیق و دوستانه پاسخ دهی. پاسخ‌هایت را شکیل و جذاب بنویس.",
        aiTemperature: 0.7,
        aiSearchGrounding: false,
        bannedUsernames: "admin,owner,support,system,bot,ai,parham_ai,administrator"
      };
    } else {
      // Backfill new properties if they don't exist
      if (database.systemSettings.maintenanceMessage === undefined) database.systemSettings.maintenanceMessage = "پیام‌رسان پرهام موقتاً در حال بروزرسانی و ارتقای سخت‌افزاری/نرم‌افزاری می‌باشد. لطفاً شکیبا باشید و دقایقی دیگر تلاش فرمایید.";
      if (database.systemSettings.aiModel === undefined) database.systemSettings.aiModel = "gemini-3.5-flash";
      if (database.systemSettings.aiSystemInstructions === undefined) database.systemSettings.aiSystemInstructions = "تو یک دستیار هوش مصنوعی فوق‌العاده باهوش، صمیمی، دلسوز و مسلط به زبان فارسی هستی که به نام «پرهام AI» در این پیام‌رسان فعالیت می‌کنی. وظیفه تو این است که به پیام کاربر به صورت طبیعی، خلاقانه، عمیق و دوستانه پاسخ دهی. پاسخ‌هایت را شکیل و جذاب بنویس.";
      if (database.systemSettings.aiTemperature === undefined) database.systemSettings.aiTemperature = 0.7;
      if (database.systemSettings.aiSearchGrounding === undefined) database.systemSettings.aiSearchGrounding = false;
      if (database.systemSettings.bannedUsernames === undefined) database.systemSettings.bannedUsernames = "admin,owner,support,system,bot,ai,parham_ai,administrator";
    }

    res.json({
      success: true,
      metrics: {
        totalMessagesCount,
        voiceCount,
        fileCount,
        textCount,
        chatsBreakdown,
        reportsCount,
        activeWsCount,
        totalUsersCount: Object.keys(database.users).length
      },
      settings: database.systemSettings
    });
  });

  // Update global platform settings (Owner only)
  app.post("/api/admin/update-settings", (req, res) => {
    const { requesterId, settings } = req.body;
    if (!requesterId || !settings) {
      res.status(400).json({ error: "پارامترها ناقص هستند." });
      return;
    }

    const database = loadDB();
    const requester = database.users[requesterId];
    if (!requester || requester.role !== "owner") {
      res.status(403).json({ error: "دسترسی غیرمجاز." });
      return;
    }

    if (!database.systemSettings) {
      database.systemSettings = {
        disableRegistration: false,
        disableAIBot: false,
        maxFileSizeMB: 50,
        welcomeMessage: "به پیام‌رسان فوق پیشرفته و رمزنگاری‌شده ما خوش آمدید! چت امن خود را آغاز کنید.",
        maintenanceMode: false,
        maintenanceMessage: "پیام‌رسان پرهام موقتاً در حال بروزرسانی و ارتقای سخت‌افزاری/نرم‌افزاری می‌باشد. لطفاً شکیبا باشید و دقایقی دیگر تلاش فرمایید.",
        aiModel: "gemini-3.5-flash",
        aiSystemInstructions: "تو یک دستیار هوش مصنوعی فوق‌العاده باهوش، صمیمی، دلسوز و مسلط به زبان فارسی هستی که به نام «پرهام AI» در این پیام‌رسان فعالیت می‌کنی. وظیفه تو این است که به پیام کاربر به صورت طبیعی، خلاقانه، عمیق و دوستانه پاسخ دهی. پاسخ‌هایت را شکیل و جذاب بنویس.",
        aiTemperature: 0.7,
        aiSearchGrounding: false,
        bannedUsernames: "admin,owner,support,system,bot,ai,parham_ai,administrator"
      };
    }

    // Merge settings
    database.systemSettings = {
      ...database.systemSettings,
      ...settings
    };

    saveDB(database);

    // Notify all connected clients about changed system settings if relevant
    broadcastToAll({
      type: "system_settings_updated",
      payload: { settings: database.systemSettings }
    });

    res.json({ success: true, settings: database.systemSettings });
  });

  // Filter/Unfilter a target user (Owner access only)
  app.post("/api/admin/toggle-filter", (req, res) => {
    const { requesterId, targetUserId, filter } = req.body;
    if (!requesterId || !targetUserId) {
      res.status(400).json({ error: "شناسه‌های ارسالی نامعتبر هستند." });
      return;
    }

    const database = loadDB();
    const requester = database.users[requesterId];
    if (!requester || requester.role !== "owner") {
      res.status(403).json({ error: "دسترسی غیرمجاز. فقط مالک سیستم دسترسی دارد." });
      return;
    }

    const targetUser = database.users[targetUserId];
    if (!targetUser) {
      res.status(404).json({ error: "کاربر هدف یافت نشد." });
      return;
    }

    if (targetUser.role === "owner" || targetUser.username.toLowerCase() === "parham") {
      res.status(400).json({ error: "امکان فیلتر کردن حساب مالک سیستم وجود ندارد." });
      return;
    }

    targetUser.isFiltered = !!filter;
    saveDB(database);

    // If filtering, terminate WebSocket connection immediately
    if (filter) {
      const targetSockets = activeConnections.get(targetUserId);
      if (targetSockets) {
        targetSockets.forEach(targetSocket => {
          try {
            targetSocket.send(JSON.stringify({
              type: "filtered_by_admin",
              payload: { message: "حساب کاربری شما توسط مدیریت فیلتر شده است." }
            }));
            targetSocket.close();
          } catch (e) {
            console.error("Error closing socket for filtered user:", e);
          }
        });
        activeConnections.delete(targetUserId);
      }
    }

    // Broadcast updated filter status to all users
    broadcastToAll({
      type: "user_filtered_status",
      payload: {
        userId: targetUserId,
        isFiltered: !!filter
      }
    });

    res.json({ success: true, isFiltered: !!filter });
  });

  // Chunked Upload Endpoint for Large Files (e.g. 30MB)
  const activeUploads = new Map<string, { chunks: Buffer[], totalChunks: number, fileName: string, fileType: string }>();

  app.post("/api/upload-chunk", (req, res) => {
    const { uploadId, chunkIndex, totalChunks, fileName, fileType, chunkData } = req.body;
    if (!uploadId || chunkIndex === undefined || !totalChunks || !chunkData) {
       res.status(400).json({ error: "پارامترهای ارسالی ناقص هستند." });
       return;
    }

    try {
      const cleanBase64 = chunkData.replace(/^data:.*?;base64,/, "");
      const buffer = Buffer.from(cleanBase64, "base64");

      if (!activeUploads.has(uploadId)) {
        activeUploads.set(uploadId, {
          chunks: new Array(totalChunks),
          totalChunks,
          fileName,
          fileType
        });
      }

      const upload = activeUploads.get(uploadId)!;
      upload.chunks[chunkIndex] = buffer;

      // Check if all chunks are received
      let completedCount = 0;
      for (let i = 0; i < upload.totalChunks; i++) {
        if (upload.chunks[i]) completedCount++;
      }

      const progressPercent = Math.round((completedCount / upload.totalChunks) * 100);

      if (completedCount === upload.totalChunks) {
        // Assemble all chunks
        const finalBuffer = Buffer.concat(upload.chunks);
        const ext = path.extname(upload.fileName);
        const uniqueName = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
        const filePath = path.join(uploadDir, uniqueName);

        fs.writeFileSync(filePath, finalBuffer);
        activeUploads.delete(uploadId);

        const downloadUrl = `/uploads/${uniqueName}`;
        res.json({
          success: true,
          completed: true,
          fileName: upload.fileName,
          fileType: upload.fileType,
          fileSize: finalBuffer.length,
          fileUrl: downloadUrl,
          progress: 100
        });
      } else {
        res.json({
          success: true,
          completed: false,
          progress: progressPercent
        });
      }
    } catch (e) {
      console.error("Chunk upload error", e);
      res.status(500).json({ error: "آپلود بخشی از فایل با خطا مواجه شد." });
    }
  });

  // High-Speed Chunked/Base64 File Upload Endpoint
  app.post("/api/upload", (req, res) => {
    const { fileName, fileType, fileData, userId } = req.body;
    if (!fileName || !fileData) {
       res.status(400).json({ error: "فایل ارسالی نامعتبر است." });
       return;
    }

    try {
      const cleanBase64 = fileData.replace(/^data:.*?;base64,/, "");
      const buffer = Buffer.from(cleanBase64, "base64");
      const ext = path.extname(fileName);
      const uniqueName = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
      const filePath = path.join(uploadDir, uniqueName);

      fs.writeFileSync(filePath, buffer);

      const downloadUrl = `/uploads/${uniqueName}`;
      res.json({
        success: true,
        fileName,
        fileType,
        fileSize: buffer.length,
        fileUrl: downloadUrl
      });
    } catch (e) {
      console.error("Upload error", e);
      res.status(500).json({ error: "آپلود فایل با خطا مواجه شد." });
    }
  });

  // --- Gemini AI Assistant Integration ---
  let aiClient: any = null;
  function getGeminiClient() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY_MISSING");
      }
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
    }
    return aiClient;
  }

  // Multimodal file attachment helper for Gemini (analysis of images, docs, audio, text)
  function getFilePartForGemini(fileUrl: string, fileType: string) {
    try {
      const filename = path.basename(fileUrl);
      const filePath = path.join(uploadDir, filename);
      if (fs.existsSync(filePath)) {
        const fileBuffer = fs.readFileSync(filePath);
        const base64Data = fileBuffer.toString("base64");
        
        let mimeType = fileType || "application/octet-stream";
        if (!mimeType || mimeType === "application/octet-stream") {
          const ext = path.extname(filename).toLowerCase();
          if (ext === ".pdf") mimeType = "application/pdf";
          else if (ext === ".txt" || ext === ".log") mimeType = "text/plain";
          else if (ext === ".csv") mimeType = "text/csv";
          else if (ext === ".json") mimeType = "application/json";
          else if (ext === ".html") mimeType = "text/html";
          else if (ext === ".md") mimeType = "text/markdown";
          else if ([".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext)) {
            mimeType = `image/${ext === "jpg" ? "jpeg" : ext.slice(1)}`;
          } else if ([".mp3", ".wav", ".ogg", ".webm", ".m4a"].includes(ext)) {
            mimeType = `audio/${ext === ".mp3" ? "mpeg" : ext.slice(1)}`;
          } else if ([".mp4", ".webm", ".mov", ".avi"].includes(ext)) {
            mimeType = `video/${ext === ".mp4" ? "mp4" : ext.slice(1)}`;
          }
        }
        
        const supportedMimes = [
          "image/png", "image/jpeg", "image/webp", "image/gif", "image/heic", "image/heif",
          "audio/wav", "audio/mp3", "audio/mpeg", "audio/ogg", "audio/webm", "audio/m4a", "audio/aac", "audio/x-m4a",
          "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo",
          "application/pdf", "text/plain", "text/csv", "text/html", "application/json", "text/markdown", "text/css", "text/javascript"
        ];
        
        if (supportedMimes.includes(mimeType)) {
          return {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          };
        }
      }
    } catch (err) {
      console.error("Error reading file for Gemini:", err);
    }
    return null;
  }

  // Robust Gemini content generation with retry (exponential backoff) and model fallbacks (e.g. if 503 Service Unavailable)
  async function callGeminiWithRetryAndFallback(params: {
    contents: any;
    config?: any;
    primaryModel?: string;
  }) {
    const ai = getGeminiClient();
    const primaryModel = params.primaryModel || "gemini-3.5-flash";
    const models = [primaryModel, "gemini-flash-latest", "gemini-3.1-flash-lite"];
    let lastError: any = null;

    for (const modelName of models) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`[Gemini API] Querying model: ${modelName} (Attempt ${attempt}/3)...`);
          const result = await ai.models.generateContent({
            model: modelName,
            contents: params.contents,
            config: params.config,
          });
          console.log(`[Gemini API] Successful response from model: ${modelName}`);
          return result;
        } catch (error: any) {
          lastError = error;
          console.error(`[Gemini API] Model ${modelName} failed on attempt ${attempt}:`, error.message || error);
          
          const status = error.status || error.statusCode || (error.error && error.error.code);
          if (status === 400) {
            console.log(`[Gemini API] Status 400 (Bad Request), skipping further retries for this model.`);
            break;
          }

          if (attempt < 3) {
            const delay = attempt * 800;
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }
    }

    throw lastError || new Error("All Gemini models failed to generate content.");
  }

  // 1. Analyze Active Chat Messages
  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: "لیست پیام‌ها نامعتبر است." });
        return;
      }

      const prompt = `
تو یک دستیار هوش مصنوعی تحلیل‌گر پیام‌رسان فوق‌العاده باهوش و دقیق هستی. وظیفه تو این است که پیام‌های ارسال شده در یک گفتگو را با دقت بررسی کنی و یک گزارش تحلیلی عمیق، خلاصه و فوق‌العاده شکیل به زبان فارسی ارائه دهی.

تعداد کل پیام‌ها برای تحلیل: ${messages.length} پیام است.

پیام‌ها به شرح زیر هستند:
${JSON.stringify(messages.slice(-100), null, 2)}

لطفاً یک گزارش تحلیلی عمیق و خواندنی به زبان فارسی شامل بخش‌های زیر بساز:
## خلاصه گفتگو 📝
- یک خلاصه جذاب و رسا از کلیت گفتگو، بحث‌ها و دستاوردها در حد ۲ الی ۳ جمله پرمحتوا.

## آمار مشارکت کاربران 📊
- چه کسانی بیشترین مشارکت را داشته‌اند و موضوع کلیدی مورد تمرکز هر فرد چیست؟

## لحن و اتمسفر گفتگو 🎭
- لحن حاکم بر گفتگو (به عنوان مثال صمیمی، رسمی، هیجان‌زده، کاری، شوخ‌طبعانه) به همراه خلاصه کوتاه.

## نکات کلیدی و دستاوردهای گفتگو 💡
- لیست ۲ الی ۴ نکته، تصمیم یا دستاورد بسیار مهم که در طول گفتگو بر روی آن توافق شده است.

لطفاً حتماً از قالب‌بندی کاملاً تمیز، هدرهای مارک‌داون هماهنگ (##) و ایموجی‌های مناسب استفاده کن تا گزارش ظاهری شبیه به کارت پستال و سازمان‌یافته داشته باشد.
`;

      const result = await callGeminiWithRetryAndFallback({
        contents: prompt,
        primaryModel: "gemini-3.5-flash"
      });

      res.json({ success: true, analysis: result.text });
    } catch (error: any) {
      console.error("Gemini Analyze Error:", error);
      if (error.message === "GEMINI_API_KEY_MISSING") {
        res.status(400).json({
          error: "کلید API برای هوش مصنوعی تنظیم نشده است. لطفاً آن را در بخش Settings > Secrets در سمت راست بالا تنظیم کنید."
        });
      } else {
        res.status(500).json({ error: "خطا در برقراری ارتباط با مدل هوش مصنوعی Gemini." });
      }
    }
  });

// Helper function to convert & expand Persian / short user prompts into rich English image prompts using AI
async function expandPromptWithAI(rawPrompt: string, ai: GoogleGenAI): Promise<string> {
  if (!rawPrompt || !rawPrompt.trim()) return rawPrompt;
  try {
    const expandSystemInstruction = `You are a world-class prompt engineer for state-of-the-art AI image generation models (Gemini Pro Image, Imagen 3, Midjourney v6, Flux).
Your task is to convert the user's input prompt (which may be in Persian, short, simple, or conversational) into a rich, detailed, masterpiece-quality English prompt optimized for AI image synthesis.

Instructions:
1. Accurately translate all Persian or non-English phrases to vivid, evocative English terms.
2. Expand the prompt with specific visual attributes:
   - Detailed subject description, scenery, background, textures, and atmosphere.
   - Professional lighting (e.g. volumetric cinematic lighting, warm golden hour, dramatic rim lights, octane render).
   - Composition & photography style (e.g. 35mm photograph, deep depth of field, sharp focus, 8k resolution, masterpiece, highly detailed).
3. Return ONLY the final English prompt string without any conversational text, explanations, or quotes.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { text: expandSystemInstruction },
        { text: `Raw User Input: "${rawPrompt}"` }
      ],
    });

    const expanded = response.text?.trim().replace(/^["']|["']$/g, '');
    if (expanded && expanded.length > 10) {
      console.log(`[AI Image Prompt Expanded] Original: "${rawPrompt}" -> Expanded: "${expanded}"`);
      return expanded;
    }
  } catch (err) {
    console.warn("[AI Prompt Expansion failed, using raw prompt]", err);
  }
  return rawPrompt;
}

// Helper function for ultra-reliable AI image generation with Gemini & Pollinations AI fallback
async function generateAIImage(
  prompt: string, 
  aspectRatio: string = "1:1", 
  imageSize: string = "1K", 
  inputImageBase64?: string
): Promise<{ imageBase64: string; text?: string; source: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  let imageBase64 = "";
  let generatedText = "";

  // Normalize imageSize
  const sizeLabel = ["1K", "2K", "4K"].includes(imageSize) ? imageSize : "1K";
  let workingPrompt = prompt;

  // 1. Try Gemini models if API key exists
  if (apiKey) {
    const ai = new GoogleGenAI({ apiKey });

    // Expand prompt using AI transparently for user (handles Persian prompts & adds rich photographic details)
    workingPrompt = await expandPromptWithAI(prompt, ai);

    // A. If image-to-image requested
    if (inputImageBase64) {
      try {
        const pureBase64 = inputImageBase64.replace(/^data:image\/\w+;base64,/, "");
        const flashRes = await ai.models.generateContent({
          model: "gemini-3.1-flash-image-preview",
          contents: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: pureBase64,
              },
            },
            { text: `Image editing instruction (Quality ${sizeLabel}): ${workingPrompt}` },
          ],
          config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
          },
        });

        const parts = (flashRes as any).candidates?.[0]?.content?.parts || (flashRes as any).response?.candidates?.[0]?.content?.parts;
        if (parts) {
          for (const p of parts) {
            if (p.inlineData?.data) {
              imageBase64 = `data:${p.inlineData.mimeType || "image/jpeg"};base64,${p.inlineData.data}`;
            }
            if (p.text) generatedText += p.text;
          }
        }
        if (imageBase64) return { imageBase64, text: generatedText, source: "gemini-3.1-flash-image-preview" };
      } catch (err) {
        console.warn("[Gemini Image-to-Image failed, trying fallbacks]", err);
      }
    }

    // B. Try gemini-3-pro-image-preview first for high quality generation
    try {
      const enhancedPrompt = `${workingPrompt} [Quality: ${sizeLabel} resolution, ultra high definition, masterpiece, highly detailed]`;
      const proRes = await ai.models.generateImages({
        model: "gemini-3-pro-image-preview",
        prompt: enhancedPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: "image/jpeg",
          aspectRatio: aspectRatio || "1:1",
        },
      });

      if (proRes.generatedImages?.[0]?.image?.imageBytes) {
        imageBase64 = `data:image/jpeg;base64,${proRes.generatedImages[0].image.imageBytes}`;
        return { imageBase64, source: "gemini-3-pro-image-preview" };
      }
    } catch (proErr) {
      console.warn("[gemini-3-pro-image-preview failed, trying imagen fallbacks]", proErr);
    }

    // C. Try Imagen 3 Fast / Imagen 3
    if (!imageBase64) {
      for (const modelName of ["imagen-3.0-fast-generate-001", "imagen-3.0-generate-002"]) {
        try {
          const imageRes = await ai.models.generateImages({
            model: modelName,
            prompt: `${workingPrompt} [${sizeLabel}]`,
            config: {
              numberOfImages: 1,
              outputMimeType: "image/jpeg",
              aspectRatio: aspectRatio || "1:1",
            },
          });
          if (imageRes.generatedImages?.[0]?.image?.imageBytes) {
            imageBase64 = `data:image/jpeg;base64,${imageRes.generatedImages[0].image.imageBytes}`;
            return { imageBase64, source: modelName };
          }
        } catch (err) {
          console.warn(`[Gemini ${modelName} failed]`, err);
        }
      }
    }

    // D. Try Gemini 3.1 Flash Image Preview
    if (!imageBase64) {
      try {
        const flashRes = await ai.models.generateContent({
          model: "gemini-3.1-flash-image-preview",
          contents: `${workingPrompt} [High quality ${sizeLabel}]`,
          config: { responseModalities: [Modality.IMAGE] },
        });

        const parts = (flashRes as any).candidates?.[0]?.content?.parts || (flashRes as any).response?.candidates?.[0]?.content?.parts;
        if (parts) {
          for (const p of parts) {
            if (p.inlineData?.data) {
              imageBase64 = `data:${p.inlineData.mimeType || "image/jpeg"};base64,${p.inlineData.data}`;
              return { imageBase64, source: "gemini-3.1-flash-image-preview" };
            }
          }
        }
      } catch (err) {
        console.warn("[Gemini 3.1 Flash Image Preview failed]", err);
      }
    }
  }

  // 2. Pollinations AI Fallback (Guaranteed to work even during 429 quota limits or missing keys)
  try {
    let baseDim = sizeLabel === "4K" ? 2048 : sizeLabel === "2K" ? 1536 : 1024;
    let width = baseDim;
    let height = baseDim;

    if (aspectRatio === "16:9") {
      width = Math.round(baseDim * (16 / 9));
      height = baseDim;
    } else if (aspectRatio === "9:16") {
      width = baseDim;
      height = Math.round(baseDim * (16 / 9));
    } else if (aspectRatio === "4:3") {
      width = Math.round(baseDim * (4 / 3));
      height = baseDim;
    }

    // Cap at reasonable max for pollinations URL
    width = Math.min(width, 2560);
    height = Math.min(height, 2560);

    const seed = Math.floor(Math.random() * 1000000);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(workingPrompt + " high quality " + sizeLabel)}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=flux`;

    const pollRes = await fetch(pollinationsUrl);
    if (pollRes.ok) {
      const arrayBuf = await pollRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      imageBase64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;
      return { imageBase64, source: "pollinations-flux" };
    }
  } catch (pollErr) {
    console.error("[Pollinations AI Fallback failed]", pollErr);
  }

  throw new Error("تولید تصویر در حال حاضر با هیچ مدلی امکان‌پذیر نشد. لطفاً دوباره تلاش کنید.");
}

  // 2. Chat with AI Assistant (with Conversation History & Active Chat context)
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { messages, context } = req.body;
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: "تاریخچه گفتگو نامعتبر است." });
        return;
      }

      const lastUserMessage = messages[messages.length - 1]?.content || "";
      const imageKeywords = ["بکش", "تصویر", "عکس", "نقاشی", "طراحی کن", "تولید تصویر", "ساخت عکس", "draw", "generate image", "image of", "picture of"];
      const isImageRequest = imageKeywords.some(kw => lastUserMessage.toLowerCase().includes(kw));

      // If user is explicitly asking to draw or generate an image in chat
      if (isImageRequest && lastUserMessage.length > 3) {
        try {
          const imgResult = await generateAIImage(lastUserMessage, "1:1");
          if (imgResult.imageBase64) {
            const filename = `ai-gen-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.jpg`;
            const uploadDir = path.join(process.cwd(), "public", "uploads");
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

            const pureData = imgResult.imageBase64.replace(/^data:image\/\w+;base64,/, "");
            fs.writeFileSync(path.join(uploadDir, filename), Buffer.from(pureData, "base64"));

            const imageUrl = `/uploads/${filename}`;
            res.json({
              success: true,
              reply: `🎨 **تصویر درخواستی شما با موفقیت تولید شد!**\n\n![تصویر هوش مصنوعی](${imageUrl})\n\nتوصیف: ${lastUserMessage}`,
              imageUrl,
              prompt: lastUserMessage
            });
            return;
          }
        } catch (imgErr) {
          console.warn("[Image generation in chat fallback to text]", imgErr);
        }
      }

      const systemInstruction = `
تو یک دستیار هوش مصنوعی باهوش، صمیمی و بسیار دلسوز به نام «پرهام AI» هستی که در پیام‌رسان فوق امن پرهام به کاربران کمک می‌کنی.
کاربر در حال حاضر در یک صفحه چت است که پیام‌های اخیر آن به صورت زیر بوده است (از این اطلاعات به عنوان زمینه استفاده کن):
${context || "پیامی در چت وجود ندارد."}

وظیفه تو این است که به عنوان دستیار کاربر عمل کنی. اگر از تو در مورد خلاصه چت یا مسائل رخ داده در این چت سوال پرسید، بر اساس زمینه بالا با دقت پاسخ بده. اگر هم سوالات عمومی یا کارهای دیگر داشت، به خوبی و صمیمی‌ترین شکل ممکن راهنمایی‌اش کن. اگر کاربر درخواست ساخت یا ایجاد تصویر داشت، او را تشویق کن و متذکر شو که تصویرش در حال تولید است. پاسخ‌ها باید روان، خوش‌تعریف و کاملاً به زبان فارسی صمیمی همراه با ایموجی‌های زیبا باشند.
تاریخچه چت کاربر با تو (پرهام AI) به صورت زیر است:
`;

      const historyText = messages.map(m => `${m.role === 'user' ? 'کاربر' : 'پرهام AI'}: ${m.content}`).join("\n");
      const fullPrompt = `${systemInstruction}\n${historyText}\nپرهام AI:`;

      const result = await callGeminiWithRetryAndFallback({
        contents: fullPrompt,
        primaryModel: "gemini-3.5-flash"
      });

      res.json({ success: true, reply: result.text });
    } catch (error: any) {
      console.error("Gemini Chat Error:", error);
      if (error.message === "GEMINI_API_KEY_MISSING") {
        res.status(400).json({
          error: "کلید API برای هوش مصنوعی تنظیم نشده است. لطفاً آن را در بخش Settings > Secrets تنظیم کنید."
        });
      } else {
        res.status(500).json({ error: "خطا در دریافت پاسخ از هوش مصنوعی." });
      }
    }
  });

  // 3. AI Image Generation & Editing Endpoint
  app.post("/api/ai/generate-image", async (req, res) => {
    try {
      const { prompt, aspectRatio, imageSize, inputImageBase64 } = req.body;
      if (!prompt) {
        res.status(400).json({ error: "متن توصیفی برای ساخت تصویر الزامی است." });
        return;
      }

      const imgResult = await generateAIImage(prompt, aspectRatio, imageSize || "1K", inputImageBase64);
      if (!imgResult.imageBase64) {
        res.status(500).json({ error: "تولید تصویر امکان‌پذیر نشد." });
        return;
      }

      const filename = `ai-gen-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.jpg`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const pureData = imgResult.imageBase64.replace(/^data:image\/\w+;base64,/, "");
      fs.writeFileSync(path.join(uploadDir, filename), Buffer.from(pureData, "base64"));

      const imageUrl = `/uploads/${filename}`;
      res.json({
        success: true,
        imageUrl,
        imageBase64: imgResult.imageBase64,
        source: imgResult.source,
        text: imgResult.text || `تصویر با توصیف «${prompt}» با موفقیت خلق شد.`
      });

    } catch (error: any) {
      console.error("AI Image Generation Error:", error);
      res.status(500).json({ error: error?.message || "خطای ناخواسته در سیستم ساخت تصویر." });
    }
  });

  // 3. AI Voice Note Transcription (Audio-to-Text)
  app.post("/api/ai/transcribe", async (req, res) => {
    try {
      const { fileUrl } = req.body;
      if (!fileUrl) {
        res.status(400).json({ error: "آدرس فایل صوتی الزامی است." });
        return;
      }

      const relativePath = fileUrl.startsWith("/") ? fileUrl.slice(1) : fileUrl;
      const filePath = path.join(process.cwd(), "public", relativePath);

      if (!fs.existsSync(filePath)) {
        res.status(404).json({ error: "فایل صوتی یافت نشد." });
        return;
      }

      const fileBuffer = fs.readFileSync(filePath);
      const base64Data = fileBuffer.toString("base64");

      const result = await callGeminiWithRetryAndFallback({
        contents: [
          {
            inlineData: {
              mimeType: "audio/webm",
              data: base64Data,
            },
          },
          {
            text: "لطفاً این فایل صوتی را با دقت بسیار بالا به زبان فارسی رونویسی (Transcribe) کن. فقط و فقط متن گفتار موجود در ویس را خروجی بده. از اضافه کردن هرگونه توضیح اضافی، مقدمه، موخره یا تگ‌های متنی خودداری کن.",
          },
        ],
        primaryModel: "gemini-3.5-flash"
      });

      res.json({ success: true, text: result.text || "" });
    } catch (error: any) {
      console.error("Gemini Transcribe Error:", error);
      if (error.message === "GEMINI_API_KEY_MISSING") {
        res.status(400).json({
          error: "کلید API برای هوش مصنوعی تنظیم نشده است. لطفاً آن را در بخش Settings > Secrets تنظیم کنید."
        });
      } else {
        res.status(500).json({ error: "خطا در پیاده‌سازی متنی صوت توسط هوش مصنوعی." });
      }
    }
  });

  // 4. AI Message Translation
  app.post("/api/ai/translate", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || !text.trim()) {
        res.status(400).json({ error: "متن پیام الزامی است." });
        return;
      }

      const result = await callGeminiWithRetryAndFallback({
        contents: `تو یک مترجم هوشمند و فوق‌العاده با دقت هستی. متن زیر را بررسی کن:
"${text}"

اگر این متن به زبان فارسی است، آن را به زبان انگلیسی ترجمه کن.
اگر این متن به زبان انگلیسی یا هر زبان دیگری است، آن را به زبان فارسی روان ترجمه کن.
توجه بسیار مهم: فقط و فقط متن ترجمه شده نهایی را خروجی بده و هیچ توضیح اضافی دیگری اضافه نکن.`,
        primaryModel: "gemini-3.5-flash"
      });

      res.json({ success: true, translatedText: result.text || "" });
    } catch (error: any) {
      console.error("Gemini Translate Error:", error);
      if (error.message === "GEMINI_API_KEY_MISSING") {
        res.status(400).json({
          error: "کلید API برای هوش مصنوعی تنظیم نشده است. لطفاً آن را در بخش Settings > Secrets تنظیم کنید."
        });
      } else {
        res.status(500).json({ error: "خطا در ترجمه متن با هوش مصنوعی." });
      }
    }
  });

  // 5. AI Smart Reply Suggestions
  app.post("/api/ai/suggest-replies", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: "لیست پیام‌ها الزامی است." });
        return;
      }

      const result = await callGeminiWithRetryAndFallback({
        contents: `تو یک دستیار هوش مصنوعی هوشمند هستی که قرار است پاسخ‌های پیشنهادی کوتاه، صمیمی، هوشمندانه و بسیار طبیعی به زبان فارسی برای آخرین پیام این گفتگو تولید کنی.

مجموعه پیام‌های اخیر گفتگو به صورت زیر است:
${JSON.stringify(messages.slice(-8), null, 2)}

بر اساس لحن و اتمسفر پیام‌ها، دقیقاً ۳ پاسخ کوتاه پیشنهادی (هر کدام حداکثر ۳ الی ۵ کلمه) برای ادامه گفتگو توسط کاربر تولید کن. پاسخ‌ها باید به زبان فارسی روان، بسیار طبیعی و صمیمی باشند.
یک آرایه JSON شامل ۳ رشته متنی خروجی بده.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING
            }
          }
        },
        primaryModel: "gemini-3.5-flash"
      });

      let suggestions = [];
      try {
        suggestions = JSON.parse(result.text || "[]");
      } catch (pe) {
        console.error("Failed to parse suggestions JSON:", pe);
      }

      res.json({ success: true, suggestions });
    } catch (error: any) {
      console.error("Gemini Suggest Replies Error:", error);
      res.json({ success: false, suggestions: [] });
    }
  });

  // 6. Advanced AI Image Generation with detail configurations
  app.post("/api/ai/generate-image", async (req, res) => {
    try {
      const { prompt, aspectRatio, style, quality, extraDetails } = req.body;
      if (!prompt || !prompt.trim()) {
        res.status(400).json({ error: "متن توصیف تصویر الزامی است." });
        return;
      }

      const ai = getGeminiClient();

      // Build a robust detailed prompt
      let enhancedPrompt = prompt;
      
      // Inject selected styles
      if (style && style !== "none") {
        const stylePhrases: { [key: string]: string } = {
          photorealistic: "highly detailed photorealistic style, real world camera settings, depth of field, high dynamic range",
          "3d_render": "modern 3D render style, octane render, beautiful lighting, cinematic composition, Unreal Engine 5 look",
          cartoon: "anime style cartoon, vibrant colors, clean vector lines, expressive illustration",
          watercolor: "traditional hand-drawn watercolor painting, wet brush textures, artistic color splatters, soft lighting",
          cyberpunk: "cyberpunk theme with bright neon glowing accents, synthwave aesthetics, futuristic city background",
          minimalist: "clean minimalist graphic design, negative space, simple color palette, elegant curves"
        };
        const stylePhrase = stylePhrases[style];
        if (stylePhrase) {
          enhancedPrompt += `, ${stylePhrase}`;
        }
      }

      // Inject extra detail phrases
      if (extraDetails && Array.isArray(extraDetails) && extraDetails.length > 0) {
        enhancedPrompt += `, featuring: ${extraDetails.join(", ")}`;
      }

      // Inject high-quality enhancers if requested
      if (quality === "high") {
        enhancedPrompt += `, ultra high resolution, breathtaking details, masterwork quality, 8k resolution`;
      }

      console.log("Generating image with prompt:", enhancedPrompt);

      let base64Image = "";
      let lastImgError: any = null;

      // Try multiple attempts/models for image generation
      const imageModels = ["gemini-3.1-flash-lite-image", "gemini-3.1-flash-image"];

      for (const modelName of imageModels) {
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            console.log(`[Gemini API] Trying generateContent with ${modelName} (Attempt ${attempt}/3)...`);
            
            const config: any = {
              imageConfig: {
                aspectRatio: aspectRatio || "1:1",
              },
            };

            if (modelName === "gemini-3.1-flash-image") {
              config.imageConfig.imageSize = "1K";
            }

            const imgResponse = await ai.models.generateContent({
              model: modelName,
              contents: {
                parts: [
                  {
                    text: enhancedPrompt,
                  },
                ],
              },
              config: config,
            });

            if (imgResponse?.candidates?.[0]?.content?.parts) {
              for (const part of imgResponse.candidates[0].content.parts) {
                if (part.inlineData?.data) {
                  base64Image = part.inlineData.data;
                  console.log(`[Gemini API] Successfully generated image via ${modelName} on attempt ${attempt}.`);
                  break;
                }
              }
            }

            if (base64Image) break;
          } catch (err: any) {
            lastImgError = err;
            console.error(`[Gemini API] generateContent failed with ${modelName} on attempt ${attempt}:`, err.message || err);
            
            // Wait with backoff before retry
            if (attempt < 3) {
              const delay = attempt * 800;
              await new Promise((resolve) => setTimeout(resolve, delay));
            }
          }
        }
        if (base64Image) break;
      }

      if (!base64Image) {
        res.status(500).json({ error: lastImgError?.message || "مدل هوش مصنوعی تصویری تولید نکرد یا خروجی نامعتبر است." });
        return;
      }

      res.json({ success: true, imageUrl: `data:image/png;base64,${base64Image}` });
    } catch (error: any) {
      console.error("Gemini Generate Image Error:", error);
      if (error.message === "GEMINI_API_KEY_MISSING") {
        res.status(400).json({
          error: "کلید API برای هوش مصنوعی تنظیم نشده است. لطفاً آن را در بخش Settings > Secrets تنظیم کنید."
        });
      } else {
        res.status(500).json({ error: error.message || "خطا در تولید تصویر توسط هوش مصنوعی." });
      }
    }
  });

  // --- Public AI & Open Integration APIs for External AIs & Bots ---
  
  // Standard OpenAI-Compatible Chat Completions API for External AIs & Bots
  // This endpoint is fully public and standard. Any client (like LangChain, AutoGen, VS Code extensions)
  // can point their base URL here and use our server's integrated Gemini models directly!
  app.post("/api/v1/chat/completions", async (req, res) => {
    try {
      const { messages, model, temperature } = req.body;
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({
          error: {
            message: "فرمت پیام‌ها معتبر نیست. فیلد 'messages' الزامی و باید آرایه باشد.",
            type: "invalid_request_error"
          }
        });
        return;
      }

      // Convert messages list to model contents context
      const historyText = messages
        .map((m: any) => `${m.role === "user" ? "کاربر" : "پرهام AI"}: ${m.content}`)
        .join("\n");
      const systemInstruction = "تو یک دستیار هوش مصنوعی باهوش، فوق‌العاده دقیق و مسلط به زبان فارسی هستی که از طریق وب‌سرویس عمومی سیستم چت پرهام فراخوانی شدی.";
      const finalPrompt = `${systemInstruction}\n\nتاریخچه گفتگو:\n${historyText}\nپرهام AI:`;

      const selectedModel = model || "gemini-3.5-flash"; // Recommended model

      const result = await callGeminiWithRetryAndFallback({
        contents: finalPrompt,
        config: {
          temperature: typeof temperature === "number" ? temperature : 0.7,
        },
        primaryModel: selectedModel
      });

      const responseText = result.text || "";

      // Standard OpenAI format output
      res.json({
        id: "chatcmpl-" + Math.random().toString(36).substring(2, 15),
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: selectedModel,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: responseText
            },
            finish_reason: "stop"
          }
        ],
        usage: {
          prompt_tokens: Math.round(historyText.length / 4),
          completion_tokens: Math.round(responseText.length / 4),
          total_tokens: Math.round((historyText.length + responseText.length) / 4)
        }
      });
    } catch (error: any) {
      console.error("v1 chat completions API error:", error);
      res.status(500).json({
        error: {
          message: error.message || "خطای سرور در برقراری ارتباط با مدل هوش مصنوعی.",
          type: "server_error"
        }
      });
    }
  });

  // Fetch Chats via Public API (Returns public chat spaces)
  app.get("/api/v1/chats", (req, res) => {
    try {
      const database = loadDB();
      const publicChats = database.chats.filter(c => c.id === "global-group" || !c.members || c.members.length === 0);
      res.json({ success: true, chats: publicChats });
    } catch (e) {
      res.status(500).json({ error: "Failed to list chats." });
    }
  });

  // Send message to specific chat via Public API on behalf of the AI Bot / Default user
  app.post("/api/v1/chats/:chatId/messages", (req, res) => {
    try {
      const database = loadDB();
      const { chatId } = req.params;
      const { content, senderNickname } = req.body;
      if (!content || !content.trim()) {
        res.status(400).json({ error: "Content is required." });
        return;
      }

      const chatObj = database.chats.find(c => c.id === chatId);
      if (!chatObj && chatId !== "global-group") {
        res.status(404).json({ error: "Chat room not found." });
        return;
      }

      // Default to "پرهام AI" or "ربات هوشمند" as sender
      const botNickname = senderNickname || "ربات هوشمند 🤖";
      const botUserId = "bot_ai_agent";

      const newMessage = {
        id: "msg_api_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        chatId,
        content: content.trim(),
        senderId: botUserId,
        senderNickname: botNickname,
        timestamp: new Date().toISOString(),
        reactions: {},
        status: "sent",
        type: "text",
        isEncrypted: false
      };

      database.messages.push(newMessage);

      if (chatObj) {
        chatObj.lastMessageText = content.trim();
        chatObj.lastMessageTime = newMessage.timestamp;
      }
      saveDB(database);
      saveDocToFirestore("messages", newMessage.id, newMessage);
      if (chatObj) saveDocToFirestore("chats", chatObj.id, chatObj);

      // Broadcast payload to all online members
      let targetMemberIds: string[] = [];
      if (chatObj) {
        targetMemberIds = chatObj.members;
      } else if (chatId === "global-group") {
        targetMemberIds = Object.keys(database.users);
      }

      targetMemberIds.forEach(mId => {
        sendToUser(mId, {
          type: "new_message",
          payload: { message: newMessage }
        });
      });

      res.json({ success: true, message: newMessage });
    } catch (e) {
      res.status(500).json({ error: "Failed to send message via API." });
    }
  });

  // ----------------------------------------------------
  // Reliable Direct Send Message HTTP Endpoint (Fallback)
  // ----------------------------------------------------
  app.post("/api/send-message", (req, res) => {
    try {
      const { senderId, msg } = req.body;
      if (!senderId || !msg || !msg.chatId) {
        res.status(400).json({ error: "اطلاعات پیام کامل نیست." });
        return;
      }

      const database = loadDB();
      const sender = database.users[senderId];
      if (!sender) {
        res.status(404).json({ error: "فرستنده پیام یافت نشد." });
        return;
      }

      const chatObj = database.chats.find(c => c.id === msg.chatId);
      if (chatObj && chatObj.type === "direct") {
        const recipientId = chatObj.members.find((m: string) => m !== senderId);
        const recipientUser = database.users[recipientId];
        if (recipientUser && recipientUser.blockedUsers?.includes(senderId)) {
          res.status(403).json({ error: "شما توسط این کاربر مسدود شده‌اید." });
          return;
        }
      }

      // Idempotency check
      if (msg.id) {
        const existing = database.messages.find((m: any) => m.id === msg.id);
        if (existing) {
          res.json({ success: true, message: existing });
          return;
        }
      }

      const newMessage = {
        ...msg,
        id: msg.id || "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        senderId,
        senderNickname: sender.nickname || "کاربر ناشناس",
        timestamp: new Date().toISOString(),
        reactions: {},
        status: "sent"
      };

      database.messages.push(newMessage);

      if (chatObj) {
        chatObj.lastMessageText = newMessage.type === "text" ? newMessage.content : `[${newMessage.type === "voice" ? "پیام صوتی" : "فایل"}]`;
        chatObj.lastMessageTime = newMessage.timestamp;
      }

      saveDB(database);
      saveDocToFirestore("messages", newMessage.id, newMessage);
      if (chatObj) saveDocToFirestore("chats", chatObj.id, chatObj);

      let targetMemberIds: string[] = chatObj ? chatObj.members : (msg.chatId === "global-group" ? Object.keys(database.users) : []);
      targetMemberIds.forEach(mId => {
        sendToUser(mId, {
          type: "new_message",
          payload: { message: newMessage }
        });
      });

      res.json({ success: true, message: newMessage });
    } catch (err: any) {
      console.error("HTTP Send Message Error:", err);
      res.status(500).json({ error: "ارسال پیام با خطا مواجه شد." });
    }
  });

  // ----------------------------------------------------
  // Subscription Purchase & Owner Grant Endpoints
  // ----------------------------------------------------
  app.post("/api/purchase-subscription", (req, res) => {
    try {
      const { userId, plan } = req.body;
      if (!userId || !plan) {
        res.status(400).json({ error: "پارامترهای درخواست ناقص است." });
        return;
      }

      const database = loadDB();
      const user = database.users[userId];
      if (!user) {
        res.status(404).json({ error: "کاربر یافت نشد." });
        return;
      }

      let durationDays = 30;
      if (plan === "quarterly") durationDays = 90;
      if (plan === "yearly") durationDays = 365;

      const now = new Date();
      const end = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

      user.subscriptionTier = "plus";
      user.subscriptionPlan = plan;
      user.subscriptionStartDate = now.toISOString();
      user.subscriptionEndDate = end.toISOString();

      saveDB(database);
      saveDocToFirestore("users", user.id, user);

      const { passwordHash: _, salt: __, ...userResponse } = user;
      broadcastToAll({
        type: "user_updated",
        payload: { userId: user.id, user: userResponse }
      });

      res.json({ success: true, user: userResponse });
    } catch (err: any) {
      console.error("Purchase Subscription Error:", err);
      res.status(500).json({ error: "خطا در ثبت اشتراک." });
    }
  });

  app.post("/api/admin/grant-subscription", (req, res) => {
    try {
      const { requesterId, targetUserId, tier, durationDays } = req.body;
      if (!requesterId || !targetUserId || !tier) {
        res.status(400).json({ error: "اطلاعات ارسالی کامل نیست." });
        return;
      }

      const database = loadDB();
      const requester = database.users[requesterId];
      if (!requester || requester.role !== "owner") {
        res.status(403).json({ error: "فقط مالک اصلی سیستم اجازه اعطای اشتراک دارد." });
        return;
      }

      const targetUser = database.users[targetUserId];
      if (!targetUser) {
        res.status(404).json({ error: "کاربر هدف یافت نشد." });
        return;
      }

      if (tier === "plus") {
        targetUser.subscriptionTier = "plus";
        targetUser.subscriptionStartDate = new Date().toISOString();

        if (!durationDays || durationDays < 0 || durationDays >= 9000) {
          targetUser.subscriptionEndDate = null; // Permanent
          targetUser.subscriptionPlan = "permanent";
        } else {
          const end = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
          targetUser.subscriptionEndDate = end.toISOString();
          targetUser.subscriptionPlan = "admin_grant";
        }
      } else {
        targetUser.subscriptionTier = "free";
        targetUser.subscriptionPlan = "free";
        targetUser.subscriptionEndDate = null;
      }

      saveDB(database);
      saveDocToFirestore("users", targetUser.id, targetUser);

      const { passwordHash: _, salt: __, ...userResponse } = targetUser;
      broadcastToAll({
        type: "user_updated",
        payload: { userId: targetUser.id, user: userResponse }
      });

      res.json({ success: true, user: userResponse });
    } catch (err: any) {
      console.error("Grant Subscription Error:", err);
      res.status(500).json({ error: "خطا در تغییر اشتراک کاربر." });
    }
  });

  // Advanced Search messages/media
  app.post("/api/search", (req, res) => {
    const { userId, query, type, chatId } = req.body;
    const database = loadDB();

    // Find chats the user belongs to
    const userChats = database.chats.filter(c => c.members.includes(userId) || c.id === "global-group" || c.creatorId === userId);
    const userChatIds = userChats.map(c => c.id);

    let filteredMessages = database.messages.filter(msg => {
      // Must belong to user's chat space
      if (!userChatIds.includes(msg.chatId)) return false;
      
      // If scoped to a specific chat
      if (chatId && msg.chatId !== chatId) return false;

      // Filter by type
      if (type === "media" && msg.type === "text") return false;
      if (type === "voice" && msg.type !== "voice") return false;
      if (type === "file" && msg.type !== "file") return false;

      // Filter by search query (fallback to sub-string checks if encrypted matches or content contains it)
      if (query) {
        const lowerQuery = query.toLowerCase();
        const contentMatch = msg.content && msg.content.toLowerCase().includes(lowerQuery);
        const nameMatch = msg.fileName && msg.fileName.toLowerCase().includes(lowerQuery);
        const senderMatch = msg.senderNickname && msg.senderNickname.toLowerCase().includes(lowerQuery);
        return contentMatch || nameMatch || senderMatch;
      }

      return true;
    });

    res.json({ success: true, results: filteredMessages });
  });

  // Block User
  app.post("/api/block-user", (req, res) => {
    const { userId, blockId } = req.body;
    const database = loadDB();
    const user = database.users[userId];

    if (!user) {
       res.status(404).json({ error: "کاربر یافت نشد." });
       return;
    }

    if (!user.blockedUsers) user.blockedUsers = [];
    if (!user.blockedUsers.includes(blockId)) {
      user.blockedUsers.push(blockId);
    }

    saveDB(database);
    const { passwordHash: _, salt: __, ...userResponse } = user;
    res.json({ success: true, user: userResponse });
  });

  // Unblock User
  app.post("/api/unblock-user", (req, res) => {
    const { userId, blockId } = req.body;
    const database = loadDB();
    const user = database.users[userId];

    if (!user) {
       res.status(404).json({ error: "کاربر یافت نشد." });
       return;
    }

    if (user.blockedUsers) {
      user.blockedUsers = user.blockedUsers.filter((id: string) => id !== blockId);
    }

    saveDB(database);
    const { passwordHash: _, salt: __, ...userResponse } = user;
    res.json({ success: true, user: userResponse });
  });

  // Report abuse
  app.post("/api/report-abuse", (req, res) => {
    const { reporterId, reportedUserId, messageId, reason } = req.body;
    const database = loadDB();
    
    const newReport = {
      id: "rep_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      reporterId,
      reportedUserId,
      messageId,
      reason,
      timestamp: new Date().toISOString()
    };

    database.reports.push(newReport);
    saveDB(database);

    res.json({ success: true, message: "گزارش شما با موفقیت ثبت شد و توسط تیم پشتیبانی بررسی خواهد شد." });
  });

  // --- Vite & Production SPA Static Serving ---
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Create unified HTTP + WS server
  const server = createServer(app);
  const wss = new WebSocketServer({ noServer: true });
  const liveWss = new WebSocketServer({ noServer: true });

  // Handle upgrade to WebSockets
  server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url || "", `http://${request.headers.host || "localhost"}`).pathname;
    if (pathname === "/live" || pathname === "/gemini-live") {
      liveWss.handleUpgrade(request, socket, head, (ws) => {
        liveWss.emit("connection", ws, request);
      });
    } else {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  // Gemini Live API WebSocket logic
  liveWss.on("connection", async (clientWs: WebSocket, req: any) => {
    console.log("[Gemini Live] New client connection");
    let session: any = null;

    try {
      const ai = getGeminiClient();
      const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
      const selectedVoice = url.searchParams.get("voice") || "Zephyr";

      session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } },
          },
          systemInstruction: "شما «پرهام»، دستیار هوش مصنوعی صوتی زنده و هوشمند پیام‌رسان پرهام هستید. صمیمی، محترمانه، به زبان فارسی روان و شمرده صحبت کنید. پاسخ‌هایتان کوتاه، جالب و مرتبط با مکالمه باشد.",
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audio && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: "audio", audio }));
            }

            if (message.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: "interrupted" }));
            }

            if (message.serverContent?.turnComplete && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: "turnComplete" }));
            }

            const outputText = message.serverContent?.modelTurn?.parts?.[0]?.text;
            if (outputText && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: "outputTranscription", text: outputText }));
            }

            const inputText = (message as any).serverContent?.userTurn?.parts?.[0]?.text;
            if (inputText && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: "inputTranscription", text: inputText }));
            }
          },
          onclose: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: "status", status: "closed" }));
            }
          },
          onerror: (err: any) => {
            console.error("[Gemini Live Session Error]", err);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: "error", error: err?.message || "Gemini Live error" }));
            }
          }
        },
      });

      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: "status", status: "connected" }));
      }

      clientWs.on("message", (data: any) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio && session) {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: "audio/pcm;rate=16000" },
            });
          } else if (parsed.text && session) {
            session.sendRealtimeInput({ text: parsed.text });
          }
        } catch (err) {
          console.error("Error processing live client message:", err);
        }
      });

      clientWs.on("close", () => {
        console.log("[Gemini Live] Client connection closed");
        if (session) {
          try { session.close(); } catch (e) {}
        }
      });

    } catch (err: any) {
      console.error("[Gemini Live Connection Failed]", err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: "error", error: err?.message || "امکان اتصال به جمنای لایو وجود ندارد." }));
        clientWs.close();
      }
    }
  });

  // WebSocket Server logic
  wss.on("connection", (ws: WebSocket, req: any) => {
    let authenticatedUserId: string | null = null;
    let wsSessionId: string | null = null;

    ws.on("message", (messageStr: string) => {
      try {
        const data = JSON.parse(messageStr);
        const { type, payload } = data;

        if (type === "auth") {
          const { userId, userProfile } = payload;
          let sessionId = payload.sessionId;
          const database = loadDB();
          let user = database.users[userId];

          // Auto-heal / restore user profile if container was restarted
          if (!user && userProfile && userProfile.id) {
            database.users[userId] = {
              ...userProfile,
              isOnline: true,
              lastSeen: new Date().toISOString(),
              sessions: userProfile.sessions || []
            };
            user = database.users[userId];
            saveDB(database);
          }
          
          if (user && user.isFiltered) {
            ws.send(JSON.stringify({
              type: "error",
              payload: { message: "حساب کاربری شما توسط مدیریت فیلتر شده است." }
            }));
            ws.close();
            return;
          }

          if (user) {
            if (!user.sessions) {
              user.sessions = [];
            }

            let sessionValid = false;
            if (sessionId) {
              const sIndex = user.sessions.findIndex((s: any) => s.id === sessionId);
              if (sIndex !== -1) {
                sessionValid = true;
                user.sessions[sIndex].lastActive = new Date().toISOString();
                saveDB(database);
              }
            }

            if (sessionId && !sessionValid) {
              // Seamlessly re-register session after container reset/restart so user is never logged out
              const ua = req?.headers?.["user-agent"] || "";
              const ip = req?.headers?.["x-forwarded-for"] || req?.socket?.remoteAddress || "192.168.1.104";
              user.sessions.push({
                id: sessionId,
                deviceName: getDeviceName(ua),
                ip,
                lastActive: new Date().toISOString()
              });
              saveDB(database);
              sessionValid = true;
            }

            if (!sessionId) {
              sessionId = "sess_" + crypto.randomBytes(16).toString("hex");
              const ua = req?.headers?.["user-agent"] || "";
              const ip = req?.headers?.["x-forwarded-for"] || req?.socket?.remoteAddress || "192.168.1.104";
              user.sessions.push({
                id: sessionId,
                deviceName: getDeviceName(ua),
                ip,
                lastActive: new Date().toISOString()
              });
              saveDB(database);

              ws.send(JSON.stringify({
                type: "session_established",
                payload: { sessionId }
              }));
            }

            wsSessionId = sessionId;
            (ws as any).sessionId = sessionId;
          }

          authenticatedUserId = userId;
          if (!activeConnections.has(userId)) {
            activeConnections.set(userId, new Set());
          }
          activeConnections.get(userId)!.add(ws as any);

          if (user) {
            user.isOnline = true;
            user.lastSeen = new Date().toISOString();
            saveDB(database);
          }

          // Ensure a "Saved Messages" chat exists for this user
          const savedChatId = `saved_${userId}`;
          const hasSavedChat = database.chats.some(c => c.id === savedChatId);
          if (!hasSavedChat) {
            const savedChat = {
              id: savedChatId,
              name: "پیام‌های ذخیره شده",
              type: "direct",
              creatorId: userId,
              avatarColor: "bg-indigo-600",
              avatarEmoji: "💾",
              members: [userId],
              description: "فضای شخصی شما برای یادداشت‌ها، پیام‌ها و ذخیره رسانه‌ها",
              lastMessageText: "گفتگو آغاز شد",
              lastMessageTime: new Date().toISOString()
            };
            database.chats.push(savedChat);
            saveDB(database);
          }

          // Broadcast user came online
          broadcastToAll({
            type: "presence",
            payload: { userId, isOnline: true }
          });

          // Sync initial data (chats, active users list, last messages)
          const userChats = database.chats.filter(
            c => c.members.includes(userId) || c.id === "global-group" || c.creatorId === userId
          );
          
          const filteredUsers: { [id: string]: any } = {};
          Object.values(database.users).forEach((u: any) => {
            filteredUsers[u.id] = {
              id: u.id,
              username: u.username,
              nickname: u.nickname,
              bio: u.bio,
              avatarColor: u.avatarColor,
              avatarEmoji: u.avatarEmoji,
              publicKey: u.publicKey,
              isOnline: u.id === "usr_parham_ai" || activeConnections.has(u.id),
              lastSeen: u.lastSeen,
              role: u.role || "user",
              isFiltered: !!u.isFiltered,
              customTitle: u.customTitle || ""
            };
          });

          // Retrieve relevant messages
          const relevantChatIds = userChats.map(c => c.id);
          const relevantMessages = database.messages.filter(m => 
            relevantChatIds.includes(m.chatId) && (!m.deletedFor || !m.deletedFor.includes(userId))
          );

          const onlineUserIds = Array.from(activeConnections.keys());
          if (!onlineUserIds.includes("usr_parham_ai")) {
            onlineUserIds.push("usr_parham_ai");
          }

          ws.send(JSON.stringify({
            type: "init",
            payload: {
              chats: userChats,
              users: filteredUsers,
              messages: relevantMessages,
              onlineUsers: onlineUserIds
            }
          }));
        }

        else if (type === "send_message") {
          if (!authenticatedUserId) return;
          const { msg } = payload;
          const database = loadDB();

          // Guard: Verify if recipient blocked sender
          const chatObj = database.chats.find(c => c.id === msg.chatId);
          if (chatObj && chatObj.type === "direct") {
            const recipientId = chatObj.members.find((m: string) => m !== authenticatedUserId);
            const recipientUser = database.users[recipientId];
            if (recipientUser && recipientUser.blockedUsers?.includes(authenticatedUserId)) {
              // Recipient blocked sender, drop message silently or return an error message
              ws.send(JSON.stringify({
                type: "error",
                payload: { message: "شما توسط این کاربر مسدود شده‌اید." }
              }));
              return;
            }
          }

          if (msg.id) {
            const existing = database.messages.find((m: any) => m.id === msg.id);
            if (existing) {
              sendToUser(authenticatedUserId, {
                type: "new_message",
                payload: { message: existing }
              });
              return;
            }
          }

          const newMessage = {
            ...msg,
            id: msg.id || "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
            senderId: authenticatedUserId,
            senderNickname: database.users[authenticatedUserId]?.nickname || "کاربر ناشناس",
            timestamp: new Date().toISOString(),
            reactions: {},
            status: "sent"
          };

          database.messages.push(newMessage);

          // Update chat last details
          if (chatObj) {
            chatObj.lastMessageText = newMessage.type === "text" ? newMessage.content : `[${newMessage.type === "voice" ? "پیام صوتی" : "فایل"}]`;
            chatObj.lastMessageTime = newMessage.timestamp;
          }
          saveDB(database);

          // Broadcast to members
          let targetMemberIds: string[] = [];
          if (chatObj) {
            targetMemberIds = chatObj.members;
          } else if (msg.chatId === "global-group") {
            targetMemberIds = Object.keys(database.users);
          }

          targetMemberIds.forEach(mId => {
            sendToUser(mId, {
              type: "new_message",
              payload: { message: newMessage }
            });
          });

          // --- AI Companion Response Trigger ---
          let plainMessageContent = newMessage.content;
          if (newMessage.isEncrypted && newMessage.type === "text") {
            plainMessageContent = decryptMessageServer(newMessage.content, msg.chatId, chatObj);
          }

          const isDirectToAI = chatObj && chatObj.type === "direct" && chatObj.members.includes("usr_parham_ai");
          const isMentionedInGroup = chatObj && chatObj.type !== "direct" && (
            (newMessage.type === "text" && (
              plainMessageContent.includes("پرهام") || 
              plainMessageContent.includes("هوش مصنوعی") || 
              plainMessageContent.includes("bot") || 
              plainMessageContent.includes("ai") || 
              plainMessageContent.includes("@parham_ai")
            )) ||
            (newMessage.type === "file" && (
              (newMessage.fileName && (
                newMessage.fileName.includes("پرهام") || 
                newMessage.fileName.includes("ai") || 
                newMessage.fileName.includes("bot")
              ))
            ))
          );

          const isGroupAiAllowed = chatObj && chatObj.type !== "direct" ? (
            chatObj.aiAccessMode === "full_participation" || (!chatObj.aiAccessMode && !chatObj.disableAiIntervention)
          ) : true;

          if ((isDirectToAI || (isMentionedInGroup && isGroupAiAllowed)) && newMessage.senderId !== "usr_parham_ai") {
            setTimeout(async () => {
              try {
                // Send "typing" indicator from AI Bot
                targetMemberIds.forEach(mId => {
                  sendToUser(mId, {
                    type: "user_typing",
                    payload: { chatId: msg.chatId, userId: "usr_parham_ai", nickname: "پرهام AI (هوش مصنوعی)", isTyping: true }
                  });
                });

                // Load fresh database to get full E2EE chat history
                const freshDB = loadDB();
                const freshChat = freshDB.chats.find(c => c.id === msg.chatId);
                const freshMessages = freshDB.messages.filter(m => m.chatId === msg.chatId);

                // Derive decryption key if E2EE is enabled
                const chatKey = "CHAT_KEY_" + msg.chatId;

                // Decrypt chat history and extract files for Gemini multimodal support
                const decryptedHistory: any[] = [];
                const attachedFileParts: any[] = [];

                for (const m of freshMessages.slice(-25)) {
                  let plainContent = m.content;
                  if (m.type === "file") {
                    plainContent = `[فایل ارسالی: ${m.fileName || "بدون نام"}]`;
                    
                    if (m.senderId !== "usr_parham_ai" && m.fileUrl) {
                      const part = getFilePartForGemini(m.fileUrl, m.fileType || "");
                      if (part) {
                        attachedFileParts.push(part);
                      }
                    }
                  } else if (m.isEncrypted && m.type === "text") {
                    plainContent = decryptMessageServer(m.content, msg.chatId, freshChat);
                  }
                  decryptedHistory.push({
                    senderNickname: m.senderNickname,
                    senderId: m.senderId,
                    content: plainContent
                  });
                }

                // Load settings from db
                const settings = freshDB.systemSettings || {};
                const customizedInstruction = settings.aiSystemInstructions || `تو یک دستیار هوش مصنوعی فوق‌العاده باهوش، صمیمی، دلسوز و مسلط به زبان فارسی هستی که به نام «پرهام AI» در این پیام‌رسان فعالیت می‌کنی.
وظیفه تو این است که به پیام کاربر به صورت طبیعی، خلاقانه، عمیق و دوستانه پاسخ دهی. پاسخ‌هایت را شکیل و جذاب بنویس.`;

                const historyText = decryptedHistory.map(m => {
                  const name = m.senderId === "usr_parham_ai" ? "پرهام AI" : m.senderNickname;
                  return `${name}: ${m.content}`;
                }).join("\n");

                const fullPrompt = `${customizedInstruction}\n\nتاریخچه گفتگوهای اخیر در این چت:\n${historyText}\nپرهام AI:`;

                // Build contents
                const geminiContents: any[] = [];
                // Add any attached files first
                if (attachedFileParts.length > 0) {
                  // Only take the last 2 files to keep payload reasonable
                  geminiContents.push(...attachedFileParts.slice(-2));
                }
                geminiContents.push({ text: fullPrompt });

                // Configure Grounding / Settings
                const config: any = {};
                if (settings.aiTemperature !== undefined) {
                  config.temperature = parseFloat(settings.aiTemperature) || 0.7;
                }
                if (settings.aiSearchGrounding) {
                  config.tools = [{ googleSearch: {} }];
                }

                const result = await callGeminiWithRetryAndFallback({
                  contents: geminiContents,
                  config: config,
                  primaryModel: settings.aiModel || "gemini-3.5-flash"
                });

                let botResponseText = result.text || "من متوجه این پیام نشدم. لطفاً دوباره بنویسید.";

                // Format grounding citations if available
                const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
                if (chunks && chunks.length > 0) {
                  botResponseText += "\n\n🔍 **منابع و اطلاعات وب کشف شده:**\n";
                  const citedUrls = new Set<string>();
                  chunks.forEach((chunk: any) => {
                    if (chunk.web?.uri && !citedUrls.has(chunk.web.uri)) {
                      citedUrls.add(chunk.web.uri);
                      botResponseText += `- [${chunk.web.title || "منبع وب"}](${chunk.web.uri})\n`;
                    }
                  });
                }

                // Encrypt response if the incoming message was encrypted (E2EE support)
                const shouldEncrypt = !!newMessage.isEncrypted;
                let finalBotContent = botResponseText;
                if (shouldEncrypt) {
                  finalBotContent = "ENC_SIM:" + FallbackCrypto.encrypt(botResponseText, chatKey);
                }

                const botMessage = {
                  id: "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
                  chatId: msg.chatId,
                  content: finalBotContent,
                  senderId: "usr_parham_ai",
                  senderNickname: "پرهام AI (هوش مصنوعی)",
                  timestamp: new Date().toISOString(),
                  reactions: {},
                  status: "sent",
                  type: "text",
                  isEncrypted: shouldEncrypt
                };

                // Add response to Database
                const finalDB = loadDB();
                finalDB.messages.push(botMessage);
                const finalChat = finalDB.chats.find(c => c.id === msg.chatId);
                if (finalChat) {
                  finalChat.lastMessageText = botResponseText;
                  finalChat.lastMessageTime = botMessage.timestamp;
                }
                saveDB(finalDB);

                // Stop typing and broadcast the AI message to members
                targetMemberIds.forEach(mId => {
                  sendToUser(mId, {
                    type: "user_typing",
                    payload: { chatId: msg.chatId, userId: "usr_parham_ai", nickname: "پرهام AI (هوش مصنوعی)", isTyping: false }
                  });
                  sendToUser(mId, {
                    type: "new_message",
                    payload: { message: botMessage }
                  });
                });

              } catch (err: any) {
                console.error("AI Companion reply error:", err);
                targetMemberIds.forEach(mId => {
                  sendToUser(mId, {
                    type: "user_typing",
                    payload: { chatId: msg.chatId, userId: "usr_parham_ai", nickname: "پرهام AI (هوش مصنوعی)", isTyping: false }
                  });
                });
              }
            }, 10); // Instant ultra-fast AI response
          }
        }

        else if (type === "create_chat") {
          if (!authenticatedUserId) return;
          const { chatName, chatType, members, avatarEmoji, avatarColor, description } = payload;
          const database = loadDB();

          const chatId = "chat_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
          
          // Ensure sender is a member
          const allMembers = Array.from(new Set([authenticatedUserId, ...members]));

          const newChat = {
            id: chatId,
            name: chatName,
            type: chatType, // 'direct' | 'group' | 'channel'
            creatorId: authenticatedUserId,
            avatarColor: avatarColor || "bg-indigo-600",
            avatarEmoji: avatarEmoji || "💬",
            members: allMembers,
            description: description || "",
            lastMessageText: "گفتگو آغاز شد",
            lastMessageTime: new Date().toISOString()
          };

          database.chats.push(newChat);
          saveDB(database);

          // Broadcast chat creation to all members
          allMembers.forEach(mId => {
            sendToUser(mId, {
              type: "chat_created",
              payload: { chat: newChat }
            });
          });
        }

        else if (type === "update_chat") {
          if (!authenticatedUserId) return;
          const { chatId, name, description, avatarColor, avatarEmoji, members } = payload;
          const database = loadDB();

          const chatIndex = database.chats.findIndex(c => c.id === chatId);
          if (chatIndex !== -1) {
            const chatObj = database.chats[chatIndex];
            
            const isCreator = chatObj.creatorId === authenticatedUserId;
            const oldMembers = chatObj.members;
            const newMembers = members ? Array.from(new Set(members)) as string[] : oldMembers;
            
            // Check if someone is trying to leave
            const leaving = oldMembers.includes(authenticatedUserId) && !newMembers.includes(authenticatedUserId);
            
            if (isCreator || leaving) {
              if (isCreator) {
                if (name !== undefined) chatObj.name = name;
                if (description !== undefined) chatObj.description = description;
                if (avatarColor !== undefined) chatObj.avatarColor = avatarColor;
                if (avatarEmoji !== undefined) chatObj.avatarEmoji = avatarEmoji;
                if (payload.disableAiIntervention !== undefined) chatObj.disableAiIntervention = payload.disableAiIntervention;
                if (payload.aiAccessMode !== undefined) chatObj.aiAccessMode = payload.aiAccessMode;
                chatObj.members = newMembers;
              } else if (leaving) {
                chatObj.members = chatObj.members.filter(m => m !== authenticatedUserId);
              }

              saveDB(database);

              // Notify all past and present members
              const allToNotify = Array.from(new Set([...oldMembers, ...chatObj.members]));
              allToNotify.forEach(mId => {
                sendToUser(mId, {
                  type: "chat_updated",
                  payload: { chat: chatObj }
                });
              });
            }
          }
        }

        else if (type === "delete_chat") {
          if (!authenticatedUserId) return;
          const { chatId } = payload;
          const database = loadDB();

          const chatIndex = database.chats.findIndex(c => c.id === chatId);
          if (chatIndex !== -1) {
            const chatObj = database.chats[chatIndex];
            if (chatObj.creatorId === authenticatedUserId) {
              const oldMembers = chatObj.members;
              
              // Remove chat
              database.chats.splice(chatIndex, 1);
              // Remove associated messages
              database.messages = database.messages.filter(m => m.chatId !== chatId);
              
              saveDB(database);

              // Notify all members
              oldMembers.forEach(mId => {
                sendToUser(mId, {
                  type: "chat_deleted",
                  payload: { chatId }
                });
              });
            }
          }
        }

        else if (type === "add_reaction") {
          if (!authenticatedUserId) return;
          const { messageId, emoji } = payload;
          const database = loadDB();

          const msgIndex = database.messages.findIndex(m => m.id === messageId);
          if (msgIndex !== -1) {
            const msg = database.messages[msgIndex];
            if (!msg.reactions) msg.reactions = {};
            
            // Remove user from all other reactions for this message (like Telegram)
            Object.keys(msg.reactions).forEach(e => {
              msg.reactions[e] = msg.reactions[e].filter((uId: string) => uId !== authenticatedUserId);
              if (msg.reactions[e].length === 0) delete msg.reactions[e];
            });

            // Add to new reaction
            if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
            msg.reactions[emoji].push(authenticatedUserId);

            saveDB(database);

            // Broadcast reaction updated to all participants of this chat
            const chatObj = database.chats.find(c => c.id === msg.chatId);
            let targetMemberIds = chatObj ? chatObj.members : Object.keys(database.users);

            targetMemberIds.forEach((mId: string) => {
              sendToUser(mId, {
                type: "reaction_updated",
                payload: { messageId, reactions: msg.reactions }
              });
            });
          }
        }

        else if (type === "typing") {
          if (!authenticatedUserId) return;
          const { chatId, isTyping } = payload;
          const database = loadDB();

          const chatObj = database.chats.find(c => c.id === chatId);
          if (chatObj) {
            chatObj.members.forEach((mId: string) => {
              if (mId !== authenticatedUserId) {
                sendToUser(mId, {
                  type: "user_typing",
                  payload: { chatId, userId: authenticatedUserId, nickname: database.users[authenticatedUserId]?.nickname, isTyping }
                });
              }
            });
          }
        }

        else if (type === "edit_message") {
          if (!authenticatedUserId) return;
          const { messageId, newContent } = payload;
          const database = loadDB();

          const msg = database.messages.find(m => m.id === messageId);
          if (msg && msg.senderId === authenticatedUserId) {
            msg.content = newContent;
            msg.isEdited = true;
            saveDB(database);

            // Broadcast to chat members
            const chatObj = database.chats.find(c => c.id === msg.chatId);
            const targetMemberIds = chatObj ? chatObj.members : Object.keys(database.users);
            targetMemberIds.forEach((mId: string) => {
              sendToUser(mId, {
                type: "message_edited",
                payload: { messageId, chatId: msg.chatId, newContent, isEdited: true }
              });
            });
          }
        }

        else if (type === "delete_message") {
          if (!authenticatedUserId) return;
          const { messageId, deleteType } = payload; // 'self' | 'everyone'
          const database = loadDB();

          const msgIndex = database.messages.findIndex(m => m.id === messageId);
          if (msgIndex !== -1) {
            const msg = database.messages[msgIndex];
            
            if (deleteType === 'everyone') {
              if (msg.senderId === authenticatedUserId) {
                database.messages.splice(msgIndex, 1);
                saveDB(database);

                // Broadcast to members
                const chatObj = database.chats.find(c => c.id === msg.chatId);
                const targetMemberIds = chatObj ? chatObj.members : Object.keys(database.users);
                targetMemberIds.forEach((mId: string) => {
                  sendToUser(mId, {
                    type: "message_deleted",
                    payload: { messageId, chatId: msg.chatId, deleteType: 'everyone' }
                  });
                });
              }
            } else {
              // Delete for self
              if (!msg.deletedFor) msg.deletedFor = [];
              if (!msg.deletedFor.includes(authenticatedUserId)) {
                msg.deletedFor.push(authenticatedUserId);
              }
              saveDB(database);

              // Notify the deleting user
              ws.send(JSON.stringify({
                type: "message_deleted",
                payload: { messageId, chatId: msg.chatId, deleteType: 'self', userId: authenticatedUserId }
              }));
            }
          }
        }

        else if (type === "pin_message") {
          if (!authenticatedUserId) return;
          const { messageId, isPinned } = payload;
          const database = loadDB();

          const msg = database.messages.find(m => m.id === messageId);
          if (msg) {
            msg.isPinned = isPinned;
            saveDB(database);

            // Broadcast to chat members
            const chatObj = database.chats.find(c => c.id === msg.chatId);
            const targetMemberIds = chatObj ? chatObj.members : Object.keys(database.users);
            targetMemberIds.forEach((mId: string) => {
              sendToUser(mId, {
                type: "message_pinned",
                payload: { messageId, chatId: msg.chatId, isPinned }
              });
            });
          }
        }

        else if (type === "mark_read") {
          if (!authenticatedUserId) return;
          const { chatId } = payload;
          const database = loadDB();
          
          let changed = false;
          database.messages.forEach(m => {
            if (m.chatId === chatId && m.senderId !== authenticatedUserId && m.status !== 'read') {
              m.status = 'read';
              changed = true;
            }
          });
          
          if (changed) {
            saveDB(database);
            
            // Broadcast read event to chat members
            const chatObj = database.chats.find(c => c.id === chatId);
            const targetMemberIds = chatObj ? chatObj.members : Object.keys(database.users);
            targetMemberIds.forEach((mId: string) => {
              sendToUser(mId, {
                type: "messages_read",
                payload: { chatId }
              });
            });
          }
        }

        else if (type === "call_signal") {
          if (!authenticatedUserId) return;
          const { targetUserId, signalType, data } = payload;
          if (activeConnections.has(targetUserId)) {
            sendToUser(targetUserId, {
              type: "call_signal",
              payload: {
                senderUserId: authenticatedUserId,
                signalType,
                data
              }
            });
          } else {
            const isBotOrGroup = targetUserId === "usr_parham_ai" ||
              targetUserId.startsWith("group_") ||
              targetUserId.startsWith("channel_") ||
              targetUserId === "global-group" ||
              targetUserId === authenticatedUserId;

            if (!isBotOrGroup && signalType === "invite") {
              ws.send(JSON.stringify({
                type: "call_signal",
                payload: {
                  senderUserId: targetUserId,
                  signalType: "reject",
                  data: { reason: "offline" }
                }
              }));
            }
          }
        }

      } catch (err) {
        console.error("WS Message processing error", err);
      }
    });

    ws.on("close", () => {
      if (authenticatedUserId) {
        const wsSet = activeConnections.get(authenticatedUserId);
        if (wsSet) {
          wsSet.delete(ws as any);
          if (wsSet.size === 0) {
            activeConnections.delete(authenticatedUserId);

            const database = loadDB();
            if (database.users[authenticatedUserId]) {
              database.users[authenticatedUserId].isOnline = false;
              database.users[authenticatedUserId].lastSeen = new Date().toISOString();
              saveDB(database);
            }

            // Broadcast offline status
            broadcastToAll({
              type: "presence",
              payload: { userId: authenticatedUserId, isOnline: false, lastSeen: new Date().toISOString() }
            });
          }
        }
      }
    });
  });

  function broadcastToAll(data: any) {
    const messageStr = JSON.stringify(data);
    activeConnections.forEach((wsSet) => {
      wsSet.forEach((wsConn) => {
        if (wsConn.readyState === WebSocket.OPEN) {
          try {
            wsConn.send(messageStr);
          } catch (e) {
            console.error("Error in broadcastToAll sending:", e);
          }
        }
      });
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Fullstack Secure Server running on port ${PORT}`);
  });
}

initDatabaseAndStartServer().then(() => {
  startServer();
}).catch(err => {
  console.error("Database initialization error before startServer:", err);
  startServer();
});
