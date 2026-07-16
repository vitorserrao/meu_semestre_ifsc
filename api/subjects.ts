// Vercel Serverless Function — GET /api/subjects
//
// Por que este arquivo existe:
// O server.ts (Express) só roda localmente via `npm run dev`/`npm start`.
// Na Vercel, sem essa função, a rota "/api/subjects" não existe (404),
// o front-end não recebe nenhuma disciplina, e por isso TODOS os semestres
// (2026.1 e 2026.2) acabavam caindo na mensagem de "horário ainda não
// divulgado" — mesmo o 2026.1 já tendo dados reais no db.json.
//
// Qualquer arquivo dentro de /api é publicado automaticamente pela Vercel
// como Serverless Function, sem precisar de vercel.json.

import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "db.json");

function loadSubjects() {
  const raw = readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw).subjects;
}

export default function handler(req, res) {
  const subjects = loadSubjects();
  const calendarSemester = req.query?.calendarSemester
    ? String(req.query.calendarSemester)
    : "";
  const q = req.query?.q ? String(req.query.q).toLowerCase().trim() : "";

  let result = subjects;

  if (calendarSemester) {
    result = result.filter((sub) => (sub.calendarSemester || "2026.2") === calendarSemester);
  }

  if (q) {
    const fuzzyMatch = (text, search) => {
      let searchIdx = 0;
      for (let i = 0; i < text.length; i++) {
        if (text[i] === search[searchIdx]) searchIdx++;
        if (searchIdx === search.length) return true;
      }
      return false;
    };

    result = result.filter((sub) => {
      const name = sub.name.toLowerCase();
      const code = sub.code.toLowerCase();
      const course = sub.course.toLowerCase();
      return (
        name.includes(q) ||
        code.includes(q) ||
        course.includes(q) ||
        fuzzyMatch(name, q) ||
        fuzzyMatch(code, q)
      );
    });
  }

  res.setHeader("Content-Type", "application/json");
  res.status(200).json(result);
}
