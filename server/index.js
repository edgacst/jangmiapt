

import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import cors from 'cors';
import bodyParser from 'body-parser';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';


const app = express();
const PORT = process.env.PORT || 4000;

// 정적 파일 서비스 (server/public)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));


app.use(cors({
  origin: true,
  credentials: true
}));
app.use(bodyParser.json());
app.use(session({
  secret: 'rose-apartment-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 1000*60*60 }
}));
// 관리자 인증 미들웨어
function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.status(401).json({ error: '관리자 인증 필요' });
}

// 관리자 로그인
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === 'admin1234') {
    req.session.admin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: '비밀번호가 틀렸습니다.' });
  }
});

// 관리자 로그아웃
app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

let db;

// DB 초기화
async function initDB() {
  db = await open({
    filename: './board.db',
    driver: sqlite3.Database
  });
  await db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    writer TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`);
  await db.run(`CREATE TABLE IF NOT EXISTS info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    writer TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`);
}

// 글 목록 조회
app.get('/api/posts', async (req, res) => {
  const posts = await db.all('SELECT * FROM posts ORDER BY id DESC');
  res.json(posts);
});

// 글 삭제
app.delete('/api/posts/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  await db.run('DELETE FROM posts WHERE id = ?', [id]);
  res.json({ success: true });
});

// 사전정보등록 글 목록
app.get('/api/info', async (req, res) => {
  const infos = await db.all('SELECT * FROM info ORDER BY id DESC');
  res.json(infos);
});

// 사전정보등록 글 등록
app.post('/api/info', async (req, res) => {
  const { writer, content } = req.body;
  if (!content || !writer) return res.status(400).json({ error: '작성자와 내용을 입력하세요.' });
  const created_at = new Date().toISOString().slice(0, 10);
  const result = await db.run('INSERT INTO info (writer, content, created_at) VALUES (?, ?, ?)', [writer, content, created_at]);
  res.json({ id: result.lastID, writer, content, created_at });
});

// 사전정보등록 글 삭제
app.delete('/api/info/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  await db.run('DELETE FROM info WHERE id = ?', [id]);
  res.json({ success: true });
});

// 글 등록
app.post('/api/posts', async (req, res) => {
  const { writer, content } = req.body;
  if (!content || !writer) return res.status(400).json({ error: '작성자와 내용을 입력하세요.' });
  const created_at = new Date().toISOString().slice(0, 10);
  const result = await db.run('INSERT INTO posts (writer, content, created_at) VALUES (?, ?, ?)', [writer, content, created_at]);
  res.json({ id: result.lastID, writer, content, created_at });
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
