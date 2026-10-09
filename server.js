const express = require("express");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

const PUBLIC_DIR = path.join(__dirname, "public");
const UPLOAD_DIR = path.join(PUBLIC_DIR, "uploads");
const DATA_FILE = path.join(__dirname, "data", "posts.json");

const ADMIN_USER = process.env.ADMIN_USER || "admim";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "tkd123";

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([
    {
      "id": crypto.randomUUID(),
      "title": "Bem-vindo ao nosso espaço de Taekwondo",
      "category": "Novidades",
      "content": "Aqui você pode divulgar treinos, campeonatos, graduações, eventos e conteúdos sobre Taekwondo.",
      "image": "",
      "createdAt": new Date().toISOString()
    }
  ], null, 2));
}

function readPosts() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function savePosts(posts) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2));
}

function removeImageIfLocal(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith("/uploads/")) return;
  const filename = path.basename(imageUrl);
  const fullPath = path.join(UPLOAD_DIR, filename);
  if (fs.existsSync(fullPath)) {
    try { fs.unlinkSync(fullPath); } catch {}
  }
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Formato de imagem não permitido."));
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || "troque-esta-chave-em-producao",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 1000 * 60 * 60 * 8
  }
}));
app.use(express.static(PUBLIC_DIR));

app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/style.css", (_, res) => {
  res.sendFile(path.join(__dirname, "style.css"));
});

app.get("/script.js", (_, res) => {
  res.sendFile(path.join(__dirname, "script.js"));
});

function requireAuth(req, res, next) {
  if (req.session && req.session.loggedIn) return next();
  res.status(401).json({ error: "Não autorizado" });
}

app.get("/api/posts", (req, res) => {
  const posts = readPosts().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(posts);
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
    req.session.loggedIn = true;
    req.session.username = username;
    return res.json({ ok: true, username });
  }
  res.status(401).json({ error: "Usuário ou senha inválidos" });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/me", (req, res) => {
  res.json({
    loggedIn: Boolean(req.session && req.session.loggedIn),
    username: req.session?.username || null
  });
});

app.post("/api/posts", requireAuth, upload.single("image"), (req, res) => {
  const { title, category, content } = req.body;

  if (!title || !content) {
    if (req.file) removeImageIfLocal(`/uploads/${req.file.filename}`);
    return res.status(400).json({ error: "Título e conteúdo são obrigatórios." });
  }

  const posts = readPosts();
  const post = {
    id: crypto.randomUUID(),
    title: title.trim(),
    category: (category || "Geral").trim(),
    content: content.trim(),
    image: req.file ? `/uploads/${req.file.filename}` : "",
    createdAt: new Date().toISOString()
  };

  posts.push(post);
  savePosts(posts);
  res.status(201).json(post);
});

app.put("/api/posts/:id", requireAuth, upload.single("image"), (req, res) => {
  const posts = readPosts();
  const index = posts.findIndex(p => p.id === req.params.id);

  if (index === -1) {
    if (req.file) removeImageIfLocal(`/uploads/${req.file.filename}`);
    return res.status(404).json({ error: "Post não encontrado." });
  }

  const oldPost = posts[index];
  const updated = {
    ...oldPost,
    title: (req.body.title || oldPost.title).trim(),
    category: (req.body.category || oldPost.category || "Geral").trim(),
    content: (req.body.content || oldPost.content).trim()
  };

  if (req.file) {
    removeImageIfLocal(oldPost.image);
    updated.image = `/uploads/${req.file.filename}`;
  }

  if (req.body.removeImage === "true") {
    removeImageIfLocal(updated.image);
    updated.image = "";
  }

  posts[index] = updated;
  savePosts(posts);
  res.json(updated);
});

app.delete("/api/posts/:id", requireAuth, (req, res) => {
  const posts = readPosts();
  const index = posts.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Post não encontrado." });

  const [deleted] = posts.splice(index, 1);
  removeImageIfLocal(deleted.image);
  savePosts(posts);
  res.json({ ok: true });
});

app.get("/admin", (_, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "admin.html"));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({ error: err.message || "Ocorreu um erro." });
});

app.listen(PORT, () => {
  console.log(`Site rodando em http://localhost:${PORT}`);
  console.log(`Painel: http://localhost:${PORT}/admin`);
});
