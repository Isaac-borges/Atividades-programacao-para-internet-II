/**
 * ============================================================
 * TODO 6 -- Service de Encounter
 * ============================================================
 * Migre para ca: a verificacao patientExists, a query de list
 * (ordenada por started_at DESC), a validacao + insert de
 * create, e a funcao toEncounterJson.
 *
 *   export const encountersService = {
 *     list(patientId: string) { ... },
 *     create(patientId: string, data: { startedAt: string; chiefComplaint: string; notes?: string }) { ... },
 *   };
 * ============================================================
 */

/**
 * TODO 6 - Service de Encounter.
 * Regras de negocio, SQL e conversao dos dados ficam aqui, sem req/res.
 */
import { db } from "../db/database.ts";

type EncounterRow = {
  id: number;
  patient_id: number;
  started_at: string;
  chief_complaint: string;
  notes: string | null;
};

type CreateEncounterInput = {
  startedAt?: unknown;
  chiefComplaint?: unknown;
  notes?: unknown;
};

function toEncounterJson(row: EncounterRow) {
  return {
    id: row.id,
    patientId: row.patient_id,
    startedAt: row.started_at,
    chiefComplaint: row.chief_complaint,
    notes: row.notes,
  };
}

const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function isNonBlankString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function patientExists(patientId: string): boolean {
  return db.prepare("SELECT 1 FROM patients WHERE id = ?").get(patientId) !== undefined;
}

export class EncounterService {
  async list(patientId: string) {
    if (!patientExists(patientId)) {
      return null;
    }

    const rows = db
      .prepare(
        `SELECT id, patient_id, started_at, chief_complaint, notes
           FROM encounters
          WHERE patient_id = ?
          ORDER BY started_at DESC`
      )
      .all(patientId) as EncounterRow[];

    return rows.map(toEncounterJson);
  }

  async create(patientId: string, data: CreateEncounterInput) {
    if (!patientExists(patientId)) {
      return { kind: "patientNotFound" as const };
    }

    const { startedAt, chiefComplaint, notes } = data;

    if (!isNonBlankString(chiefComplaint)) {
      return {
        kind: "invalidInput" as const,
        message: "O campo 'chiefComplaint' e obrigatorio.",
      };
    }

    if (!isNonBlankString(startedAt) || !ISO_DATE_TIME.test(startedAt)) {
      return {
        kind: "invalidInput" as const,
        message: "O campo 'startedAt' e obrigatorio no formato AAAA-MM-DDTHH:MM.",
      };
    }

    const result = db
      .prepare(
        `INSERT INTO encounters (patient_id, started_at, chief_complaint, notes)
         VALUES (?, ?, ?, ?)`
      )
      .run(
        patientId,
        startedAt,
        chiefComplaint.trim(),
        isNonBlankString(notes) ? notes.trim() : null
      );

    const created = db
      .prepare(
        `SELECT id, patient_id, started_at, chief_complaint, notes
           FROM encounters WHERE id = ?`
      )
      .get(result.lastInsertRowid) as EncounterRow;

    return { kind: "created" as const, encounter: toEncounterJson(created) };
  }
}
