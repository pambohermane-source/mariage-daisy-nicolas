/* ============================================================
   Serveur — Mariage Daisy-Helen & Nicolas
   ------------------------------------------------------------
   • Sert le site statique (dossier /public)
   • Reçoit les confirmations (POST /api/rsvp) -> SQLite
   • Back-office protégé par mot de passe (/admin)
       - liste des invités (GET /api/admin/rsvps)
       - export CSV         (GET /api/admin/export.csv)
       - suppression        (DELETE /api/admin/rsvps/:id)
   ============================================================ */

const path = require("path");
const fs = require("fs");
const express = require("express");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;

// Mot de passe du back-office (À DÉFINIR dans Railway > Variables).
// Valeur par défaut le temps des tests — CHANGEZ-LA en production.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "daisy2026";

// ── Base de données ────────────────────────────────────────
// Sur Railway, montez un volume sur /data pour que les réponses
// survivent aux redéploiements. En local, on retombe sur ./data.
const DATA_DIR = process.env.DATA_DIR || (fs.existsSync("/data") ? "/data" : path.join(__dirname, "data"));
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new Database(path.join(DATA_DIR, "rsvp.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS rsvps (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT,
    email        TEXT,
    phone        TEXT,
    language     TEXT,
    event        TEXT,
    guests       INTEGER,
    diet         TEXT,
    message      TEXT,
    submitted_at TEXT,
    created_at   TEXT DEFAULT (datetime('now'))
  );
`);

app.use(express.json({ limit: "1mb" }));

// ── API publique : réception des confirmations ─────────────
app.post("/api/rsvp", (req, res) => {
  const b = req.body || {};
  if (!b.name || !b.email) {
    return res.status(400).json({ ok: false, error: "Nom et email requis." });
  }
  try {
    const stmt = db.prepare(`
      INSERT INTO rsvps (name, email, phone, language, event, guests, diet, message, submitted_at)
      VALUES (@name, @email, @phone, @language, @event, @guests, @diet, @message, @submitted_at)
    `);
    const info = stmt.run({
      name: String(b.name).slice(0, 200),
      email: String(b.email).slice(0, 200),
      phone: String(b.phone || "").slice(0, 60),
      language: String(b.language || "").slice(0, 8),
      event: String(b.event || "").slice(0, 16),
      guests: Number.isFinite(+b.guests) ? Math.max(0, Math.min(50, +b.guests)) : 0,
      diet: String(b.diet || "").slice(0, 500),
      message: String(b.message || "").slice(0, 2000),
      submitted_at: String(b.submittedAt || new Date().toISOString()),
    });
    res.json({ ok: true, id: info.lastInsertRowid });
  } catch (err) {
    console.error("Erreur insertion RSVP:", err);
    res.status(500).json({ ok: false, error: "Erreur serveur." });
  }
});

// ── Authentification du back-office (HTTP Basic) ───────────
function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Basic ") ? header.slice(6) : "";
  let pass = "";
  try { pass = Buffer.from(token, "base64").toString().split(":").slice(1).join(":"); } catch (_) {}
  if (pass && pass === ADMIN_PASSWORD) return next();
  res.set("WWW-Authenticate", 'Basic realm="Back-office mariage"');
  res.status(401).send("Accès réservé.");
}

// ── API admin : liste JSON ─────────────────────────────────
app.get("/api/admin/rsvps", requireAdmin, (req, res) => {
  const rows = db.prepare("SELECT * FROM rsvps ORDER BY id DESC").all();
  const totalGuests = rows.reduce((n, r) => n + (r.guests || 0), 0);
  res.json({ ok: true, count: rows.length, totalGuests, rows });
});

// ── API admin : suppression ────────────────────────────────
app.delete("/api/admin/rsvps/:id", requireAdmin, (req, res) => {
  db.prepare("DELETE FROM rsvps WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// ── API admin : export CSV ─────────────────────────────────
app.get("/api/admin/export.csv", requireAdmin, (req, res) => {
  const rows = db.prepare("SELECT * FROM rsvps ORDER BY id DESC").all();
  const EVT = { cout: "Coutumier", civ: "Civil", both: "Les deux" };
  const head = ["ID", "Nom", "Email", "Téléphone", "Langue", "Événement", "Accompagnants", "Régime", "Message", "Envoyé le"];
  const esc = (v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
  const lines = [head.map(esc).join(",")];
  for (const r of rows) {
    lines.push([r.id, r.name, r.email, r.phone, r.language, EVT[r.event] || r.event, r.guests, r.diet, r.message, r.submitted_at].map(esc).join(","));
  }
  // BOM UTF-8 pour qu'Excel ouvre les accents correctement.
  const csv = "\uFEFF" + lines.join("\r\n");
  res.set("Content-Type", "text/csv; charset=utf-8");
  res.set("Content-Disposition", 'attachment; filename="confirmations-mariage.csv"');
  res.send(csv);
});

// ── Back-office (page protégée) ────────────────────────────
app.get("/admin", requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

// ── Site statique ──────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

// Toute autre route -> page d'accueil (le site est une SPA).
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`✓ Serveur démarré sur le port ${PORT}`);
  console.log(`  Site    : /`);
  console.log(`  Admin   : /admin`);
  console.log(`  Données : ${DATA_DIR}/rsvp.db`);
});
