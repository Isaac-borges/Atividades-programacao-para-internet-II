/**
 * ============================================================
 * TODO 3 -- Service de Patient
 * ============================================================
 * O Service e onde mora a regra de negocio de verdade: o SQL
 * (db.prepare), a checagem de CNS duplicado (409), a traducao
 * snake_case -> camelCase (toPatientJson).
 *
 * O Service NUNCA:
 *   - conhece req/res (nao sabe que existe HTTP)
 *   - formata resposta HTTP
 *
 * Quando algo da errado (paciente nao encontrado, CNS
 * duplicado), por enquanto o Service pode continuar devolvendo
 * um valor especial (ex.: null) OU lancando um Error comum --
 * a hierarquia HttpError chega no TODO 8 (Encontro 2). Combine
 * com a dupla como vao sinalizar "nao encontrado" antes disso
 * existir.
 *
 * Migre para ca: a query de list, a query de getById, a
 * checagem de duplicata + insert de create, e a funcao
 * toPatientJson (que hoje esta em server.ts).
 *
 * Dica de assinatura:
 *   export const patientsService = {
 *     list() { ... },
 *     getById(id: string) { ... },
 *     create(data: { name: string; birthDate: string; nationalId: string }) { ... },
 *   };
 * ============================================================
 */

import { db } from '../db/database.ts'
import { ConflictError, NotFoundError } from '../errors/HttpError.ts';
type PatientRow = {
  id: number;
  name: string;
  birth_date: string;
  national_id: string;
  active: number;
  photo_path: string | null;
};

function toPatientJson(row: PatientRow) {
  return {
    id: row.id,
    name: row.name,
    birthDate: row.birth_date,
    nationalId: row.national_id,
    active: row.active === 1,
    photoUrl: row.photo_path,
  };
}


export class PatientService {

  async listAll() {
    const rows = db
      .prepare("SELECT id, name, birth_date, national_id, active, photo_path FROM patients ORDER BY name")
      .all() as PatientRow[];

    return rows.map(toPatientJson)
  }

  async getById(id: number) {
    const row = db
      .prepare("SELECT id, name, birth_date, national_id, active, photo_path FROM patients WHERE id = ?")
      .get(id) as PatientRow | undefined;

    if (!row) {
      throw new NotFoundError("Paciente não encontrado.");
    }

    return toPatientJson(row);
  }

  async create(name: string, birthDate: string, nationalId: string) {
    const duplicate = db
      .prepare("SELECT id FROM patients WHERE national_id = ?")
      .get(nationalId.trim());

    if (duplicate) {
      throw new ConflictError("Ja existe um paciente com este CNS.");
    }

    const result = db
      .prepare(
        `INSERT INTO patients (name, birth_date, national_id, active)
         VALUES (?, ?, ?, 1)`
      )
      .run(name.trim(), birthDate, nationalId.trim());

    const created = db
      .prepare("SELECT id, name, birth_date, national_id, active, photo_path FROM patients WHERE id = ?")
      .get(result.lastInsertRowid) as PatientRow;

    return toPatientJson(created);
  }
}


/**
 * ============================================================
 * TODO 13 (Encontro 2, continuacao) -- Service de upload
 * ============================================================
 * setPhoto(id, filename):
 *   - busca o paciente (senao existir -> throw NotFoundError)
 *   - UPDATE patients SET photo_path = ? WHERE id = ?
 *     (salve como `/uploads/${filename}`)
 *   - devolve o paciente atualizado (toPatientJson)
 * ============================================================
 */
