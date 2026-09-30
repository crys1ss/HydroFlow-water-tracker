import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initialDb = {
      users: [],
      userData: {},
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
  }
}

function readDb() {
  ensureDb();
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading db.json:', err);
    return { users: [], userData: {} };
  }
}

function writeDb(db) {
  ensureDb();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing db.json:', err);
  }
}

export function handleApiRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // Set CORS headers for seamless cross-device mobile/desktop access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true;
  }

  if (!pathname.startsWith('/api/')) {
    return false;
  }

  // Parse JSON body for POST/PUT requests
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });

  req.on('end', () => {
    let json = {};
    if (body) {
      try {
        json = JSON.parse(body);
      } catch {
        json = {};
      }
    }

    res.setHeader('Content-Type', 'application/json');

    const db = readDb();

    // 1. SIGN UP (Email & Password)
    if (pathname === '/api/auth/signup' && req.method === 'POST') {
      const { email, password } = json;
      if (!email || !email.includes('@')) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Valid email is required.' }));
        return;
      }
      if (!password || password.length < 6) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Password must be at least 6 characters.' }));
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const existing = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (existing) {
        res.statusCode = 409;
        res.end(JSON.stringify({ error: 'Account already exists with this email. Please sign in.' }));
        return;
      }

      const newUser = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        email: normalizedEmail,
        password: password, // In production hash with bcrypt
        nickname: '',
        avatar: '💧',
        authProvider: 'email',
        createdAt: Date.now(),
      };

      db.users.push(newUser);
      writeDb(db);

      const { password: _, ...safeUser } = newUser;
      res.statusCode = 201;
      res.end(JSON.stringify({ user: safeUser, isNew: true }));
      return;
    }

    // 2. SIGN IN (Email & Password)
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const { email, password } = json;
      if (!email || !password) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Email and password are required.' }));
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (!user) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'No account found with this email. Please create an account.' }));
        return;
      }

      if (user.password && user.password !== password) {
        res.statusCode = 401;
        res.end(JSON.stringify({ error: 'Incorrect password. Please check and try again.' }));
        return;
      }

      const { password: _, ...safeUser } = user;
      const userData = db.userData[user.id] || {};

      res.statusCode = 200;
      res.end(JSON.stringify({ user: safeUser, data: userData }));
      return;
    }

    // 3. GOOGLE AUTH (Real Google OAuth / GIS)
    if (pathname === '/api/auth/google' && req.method === 'POST') {
      const { email, name, picture, sub } = json;
      if (!email || !email.includes('@')) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Valid Google email is required.' }));
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      let user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
      let isNew = false;

      if (!user) {
        isNew = true;
        user = {
          id: sub ? `g_${sub}` : `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          email: normalizedEmail,
          nickname: name || normalizedEmail.split('@')[0],
          avatar: picture || '💧',
          authProvider: 'google',
          createdAt: Date.now(),
        };
        db.users.push(user);
        writeDb(db);
      } else {
        // Update avatar if provided
        if (picture && !user.avatar) {
          user.avatar = picture;
          writeDb(db);
        }
      }

      const { password: _, ...safeUser } = user;
      const userData = db.userData[user.id] || {};

      res.statusCode = 200;
      res.end(JSON.stringify({ user: safeUser, isNew: isNew || !user.nickname, data: userData }));
      return;
    }

    // 4. UPDATE PROFILE (Nickname & Avatar)
    if (pathname === '/api/auth/profile' && req.method === 'POST') {
      const { userId, nickname, avatar } = json;
      if (!userId || !nickname) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'User ID and nickname are required.' }));
        return;
      }

      const user = db.users.find((u) => u.id === userId);
      if (!user) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'User not found.' }));
        return;
      }

      user.nickname = nickname.trim();
      if (avatar) user.avatar = avatar;
      writeDb(db);

      const { password: _, ...safeUser } = user;
      res.statusCode = 200;
      res.end(JSON.stringify({ user: safeUser }));
      return;
    }

    // 5. SYNC USER DATA (Hydration History & Settings)
    if (pathname === '/api/sync' && req.method === 'POST') {
      const { userId, settings, history } = json;
      if (!userId) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'User ID is required.' }));
        return;
      }

      if (!db.userData) db.userData = {};
      db.userData[userId] = {
        settings: settings || db.userData[userId]?.settings,
        history: history || db.userData[userId]?.history,
        lastSynced: Date.now(),
      };
      writeDb(db);

      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, lastSynced: Date.now() }));
      return;
    }

    // 6. GET USER DATA
    if (pathname.startsWith('/api/sync/') && req.method === 'GET') {
      const userId = pathname.replace('/api/sync/', '');
      const userData = db.userData?.[userId] || null;
      res.statusCode = 200;
      res.end(JSON.stringify({ data: userData }));
      return;
    }

    // 404 for unknown endpoints
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'API endpoint not found.' }));
  });

  return true;
}
