import pool from './db.js'
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 4000;

// 정적 파일 서비스
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

// ====== 게시글/사전정보 API (PostgreSQL) ======

// 글 목록 조회 (posts)
app.get('/api/posts', async (req, res) => {
  const result = await pool.query(
    "SELECT id, writer, content, TO_CHAR(created_at, 'YYYY-MM-DD') as created_at FROM posts ORDER BY id DESC"
  );
  console.log(result.rows); // ← 여기 콘솔로 값 실제 확인!
  res.json(result.rows);
});

// 글 등록 (posts)
app.post('/api/posts', async (req, res) => {
  const { writer, content } = req.body;
  if (!content || !writer)
    return res.status(400).json({ error: '작성자와 내용을 입력하세요.' });
  const created_at = new Date().toISOString().slice(0, 10);
  try {
    const result = await pool.query(
      'INSERT INTO posts (writer, content, created_at) VALUES ($1, $2, $3) RETURNING id',
      [writer, content, created_at]
    );
    res.json({ id: result.rows[0].id, writer, content, created_at });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 글 삭제 (posts)
app.delete('/api/posts/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM posts WHERE id=$1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 사전정보등록 글 목록 (info)
app.get('/api/info', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM info ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 사전정보등록 글 등록 (info)
app.post('/api/info', async (req, res) => {
  const { name, phone, email } = req.body;
  try {
    await pool.query(
      'INSERT INTO info (name, phone, email) VALUES ($1, $2, $3)',
      [name, phone, email]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 사전정보등록 글 삭제 (info)
app.delete('/api/info/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM info WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('장미APT 백엔드 서버가 정상 구동 중입니다.');
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});