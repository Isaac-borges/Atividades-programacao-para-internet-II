/**
 * ============================================================
 * Painel de Medicacao - Servidor HTTP
 * ============================================================
 * Isto e um "Hello World": so a rota de saude e o servidor
 * estatico. As quatro rotas da atividade (listar, criar, obter
 * um, remover) ainda nao existem — sao o que voce vai construir.
 */
import express, { request } from "express";
import { db } from "./database";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

type MedicationRow = {
  id: number;
  patient_name: string;
  medication_name: string;
  dosage: string;
  route: string;
  scheduled_at: string;
  notes: string;
};

function toMedicationJson(row: MedicationRow) {
  return {
    id: row.id,
    patientName: row.patient_name,
    medicationName: row.medication_name,
    dosage: row.dosage,
    route: row.route,
    scheduledAt: row.scheduled_at,
    notes: row.notes
  }
}

function isBlank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim() === '';
}

function validateMedicationInput(body: any) {
  const requiredKeys = ['patientName', 'medicationName', 'dosage', 'route', 'scheduledAt'];

  for (const key of requiredKeys) {
    if (isBlank(body[key])) {
      return "Um campo obrigatório não foi preenchido";
    }
  }

  return null;
}

// ============================================================
// PASSO 1 — GET /api/medications
//   db.prepare("SELECT ... FROM medication_orders").all()
//   Nao esqueca de traduzir snake_case -> camelCase antes de responder.
// ============================================================
app.get('/api/medications', (_request, response) => {
  const rows = db
    .prepare(
      `SELECT id, patient_name, medication_name, dosage,
              route, scheduled_at, notes
          FROM medication_orders
          ORDER BY scheduled_at ASC`
    ).all() as MedicationRow[];

  response.status(200).json(rows.map(toMedicationJson));
})
// ============================================================
// PASSO 3 — POST /api/medications
//   valide patientName, medicationName, dosage, route, scheduledAt
//   INSERT parametrizado -> responda 201 com o registro criado
// ============================================================

app.post('/api/medications', (request, response) => {
  const problem = validateMedicationInput(request.body);
  if (problem) {
    response.status(400).json({ error: problem });
    return;
  }

  const { patientName, medicationName, dosage, route, scheduledAt, notes } = request.body;
  const result = db.prepare(
    `INSERT INTO medication_orders
    (patient_name, medication_name, dosage, route, scheduled_at, notes)
    VALUES (?, ?, ?, ?, ?, ?)`
  ).run(patientName, medicationName, dosage, route, scheduledAt, isBlank(notes) ? null : notes.trim());

  const created = db
    .prepare(
      `SELECT id, patient_name, medication_name, dosage, route, scheduled_at, notes
        FROM medication_orders WHERE id = ?`
    )
    .get(result.lastInsertRowid) as MedicationRow;

  response.status(201).json(toMedicationJson(created));
})

// ============================================================
// PASSO 4 — GET /api/medications/:id
//   db.prepare("SELECT ... WHERE id = ?").get(id)
//   undefined -> 404
// ============================================================

app.get('/api/medications/:id', (request, response) => {
  const row = db
    .prepare(
      `SELECT id, patient_name, medication_name, dosage, route, scheduled_at, notes
        FROM medication_orders WHERE id = ?`
    ).get(request.params.id) as MedicationRow;

  if (!row) {
    response.status(404).json({ error: 'Prescrição não encontrada' });
    return;
  }

  response.status(200).json(toMedicationJson(row))
});

// ============================================================
// PASSO 5 — DELETE /api/medications/:id
//   db.prepare("DELETE FROM medication_orders WHERE id = ?").run(id)
//   responda 204, sem corpo
// ============================================================

app.delete('/api/medications/:id', (request, response) => {
  const existing = db
    .prepare('SELECT id FROM medication_orders WHERE id = ?')
    .get(request.params.id);

  if (!existing) {
    response.status(404).json({ error: 'Prescrição não encontrada.' });
    return;
  }

  db.prepare('DELETE FROM medication_orders WHERE id = ?')
    .run(request.params.id);

  response.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Painel de Medicacao no ar em http://localhost:${PORT}`);
});
