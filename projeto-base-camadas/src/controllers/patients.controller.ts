/**
 * ============================================================
 * TODO 2 -- Controller de Patient
 * ============================================================
 * O controller traduz HTTP <-> dominio. Ele:
 *   - le req.params / req.body
 *   - chama o Service (que ainda nao existe -- e o TODO 3)
 *   - formata a resposta (res.status().json())
 *
 * O controller NUNCA:
 *   - chama db.prepare diretamente
 *   - contem "if" de regra de negocio (ex.: "CNS ja existe?")
 *
 * Migre a LOGICA DE TRADUCAO HTTP das 3 rotas de patients que
 * estao em server.ts (list, getById, create) para ca. A
 * validacao de formato e a checagem de duplicidade vao para o
 * Service, no TODO 3.
 *
 * Dica de assinatura:
 *   import { patientsService } from "../services/patients.service.ts";
 *
 *   export const patientsController = {
 *     list(req, res) { ... },
 *     getById(req, res) { ... },
 *     create(req, res) { ... },
 *   };
 * ============================================================
 */
import { Request, Response } from 'express'
import { PatientService } from "../services/patients.service.ts"
import { BadRequestError, ConflictError, NotFoundError } from '../errors/HttpError.ts';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isBlank(value: unknown): boolean {
  return typeof value !== "string" || value.trim() === "";
}

function validatePatientInput(body: any): string | null {
  if (isBlank(body?.name)) {
    return "O campo 'name' e obrigatorio e nao pode ser vazio.";
  }
  if (isBlank(body?.birthDate) || !ISO_DATE.test(body.birthDate)) {
    return "O campo 'birthDate' e obrigatorio e deve estar no formato AAAA-MM-DD.";
  }
  if (isBlank(body?.nationalId)) {
    return "O campo 'nationalId' e obrigatorio.";
  }
  return null;
}

export class PatientController {
  private patientService: PatientService;

  constructor() {
    this.patientService = new PatientService();
  }

  public list = async (_request: Request, response: Response) => {
    const rows = await this.patientService.listAll();

    response.status(200).json(rows);
  }

  public getById = async (request: Request, response: Response) => {
    const id = Number(request.params.id);

    if (isNaN(id)) {
      throw new BadRequestError("ID Inválido.");
    }

    const row = await this.patientService.getById(id);

    if (!row) {
      throw new NotFoundError("Paciente não encontrado.")
    }

    response.status(200).json(row);
  }

  public create = async (request: Request, response: Response) => {
    const { name, birthDate, nationalId } = request.body;

    const created = await this.patientService.create(name, birthDate, nationalId);

    response.status(201).json(created);
  }
}


/**
 * ============================================================
 * TODO 13 (Encontro 2, continuacao) -- Controller de upload
 * ============================================================
 * uploadPhoto(req, res):
 *   - se !req.file -> throw new UnprocessableEntityError()
 *   - chama patientsService.setPhoto(req.params.id, req.file.filename)
 *   - responde 200 com o paciente atualizado
 * ============================================================
 */
