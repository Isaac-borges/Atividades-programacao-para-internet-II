/**
 * ============================================================
 * Mini-Prontuario - Servidor HTTP
 * ============================================================
 * Esta semana o servidor e PROPOSITALMENTE simples:
 * um unico arquivo, sem camadas, sem arquitetura.
 * O objetivo e enxergar o HTTP acontecendo.
 *
 * A separacao em camadas chega na Semana 03. Ate la, o que
 * queremos e que voce saiba exatamente o que cada linha faz.
 */
import express, { request } from "express";
import { db } from "./database";

const app = express();
const PORT = 3000;

// ------------------------------------------------------------
// MIDDLEWARES - executam ANTES das rotas, em ordem
// ------------------------------------------------------------

// Le o corpo da requisicao quando o Content-Type e application/json
// e coloca o resultado em req.body.
// SEM ESTA LINHA, req.body vem `undefined`. Erro numero 1 da turma.
app.use(express.json());

// Serve os arquivos de public/ como conteudo estatico.
// Por isso o frontend e a API vivem na MESMA origem (localhost:3000)
// e nao precisamos falar de CORS ainda.
app.use(express.static("public"));

// ------------------------------------------------------------
// ROTAS
// ------------------------------------------------------------

/** Rota de saude: serve para saber se o servidor esta de pe. */
app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

// ============================================================
// TODO 1 (Encontro 2, Pratica 1)
// GET /api/patients  ->  200 com um ARRAY de pacientes.
// Comece devolvendo um array fixo, escrito na mao. Sem banco ainda.
// ============================================================

// ============================================================
// TODO 2 (Encontro 2, Pratica 2)
// POST /api/patients
//   - leia req.body
//   - valide: name obrigatorio (texto nao vazio)
//              birthDate obrigatorio no formato AAAA-MM-DD
//              nationalId obrigatorio
//   - se invalido:  400  { "error": "mensagem util" }
//   - se valido:    201  com o paciente criado
// ============================================================

// ============================================================
// TODO 3 (Encontro 2, Pratica 3)
// Troque o array em memoria pelo banco:
//   import { db } from "./database";
//   const rows = db.prepare("SELECT ... FROM patients ORDER BY name").all();
// E crie GET /api/patients/:id devolvendo 404 quando nao existir.
// ============================================================
type PatientRow = {
  id: number;
  name: string;
  birth_date: string;
  national_id: string;
  active: number;
};

type EncounterRow = {
  id: number;
  patient_id: number;
  started_at: string;
  chief_complaint: string;
  notes: string | null;
};
// -----------------------------------

function toPatientJson(row: PatientRow) {
  return {
    id: row.id,
    name: row.name,
    birthDate: row.birth_date,
    nationalId: row.national_id,
    active: row.active,
  }
}

function toEncounterJson(row: EncounterRow) {
  return {
    id: row.id,
    patientId: row.patient_id,
    startedAt: row.started_at,
    chiefComplaint: row.chief_complaint,
    notes: row.notes
  };
}
//

function isBlank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim() === '';
}

function validatePatientInput(body: any) {
  const requiredKeys = ['name', 'birthDate', 'nationalId'];

  for (const key of requiredKeys) {
    if (isBlank(body[key])) {
      return "Um campo obrigatório não foi preenchido";
    }
  }

  return null;
}

app.get("/api/patients", (_request, response) => {
  const rows = db.prepare("SELECT id, name, birth_date, national_id, active FROM patients ORDER BY name").all() as PatientRow[];

  response.status(200).json(rows.map(toPatientJson));
});

app.post("/api/patients", (request, response) => {
  const problem = validatePatientInput(request.body);
  if (problem) {
    response.status(400).json({ error: problem });
    return;
  }

  const { name, birthDate, nationalId } = request.body;
  const result = db
    .prepare(`INSERT INTO patients (name, birth_date, national_id, active) VALUES (?, ?, ?, ?)`)
    .run(name, birthDate, nationalId, 1);

  const created = db
    .prepare(`SELECT id, name, birth_date, national_id, active FROM patients WHERE id = ?`)
    .get(result.lastInsertRowid) as PatientRow;

  response.status(201).json(toPatientJson(created));
});

// -----------------------------------
app.get("/api/patients/:id/encounters", (request, response) => {
  const row = db.prepare("SELECT id, name, birth_date, national_id, active FROM patients WHERE id = ?")
    .get(request.params.id) as PatientRow | undefined;

  if (!row) {
    return response.status(404).json({ error: "Paciente não encontrado" });
  }

  const encounterRows = db.prepare("SELECT id, patient_id, started_at, chief_complaint, notes FROM encounters WHERE patient_id = ?")
    .all(request.params.id) as EncounterRow[];
  const encounters = encounterRows.map(r => toEncounterJson(r));
  return response.json(encounters);
});

// ------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Mini-Prontuario no ar em http://localhost:${PORT}`);
});
