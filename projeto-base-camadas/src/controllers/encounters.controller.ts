/**
 * ============================================================
 * TODO 5 -- Controller de Encounter
 * ============================================================
 * Mesma regra do TODO 2: traduz HTTP <-> dominio, chama o
 * Service (TODO 6), nunca acessa o banco diretamente.
 *
 * Repare que aqui o id do paciente vem de req.params.id (por
 * causa do mergeParams no TODO 4) -- e nao de um :patientId
 * separado.
 *
 *   import { encountersService } from "../services/encounters.service.ts";
 *
 *   export const encountersController = {
 *     list(req, res) { ... },
 *     create(req, res) { ... },
 *   };
 * ============================================================
 */

import type { Request, Response } from "express";
import { EncounterService } from "../services/encounters.service.ts";

export class EncounterController {
  private encounterService = new EncounterService();

  public list = async (request: Request, response: Response) => {
    const patientId = String(request.params.id);

    const encounters = await this.encounterService.list(patientId);

    if (encounters === null) {
      response.status(404).json({
        error: "Paciente nao encontrado.",
      });
      return;
    }

    response.status(200).json(encounters);
  };

  public create = async (request: Request, response: Response) => {
    const patientId = String(request.params.id);

    const result = await this.encounterService.create(
      patientId,
      request.body ?? {}
    );

    if (result.kind === "patientNotFound") {
      response.status(404).json({
        error: "Paciente nao encontrado.",
      });
      return;
    }

    if (result.kind === "invalidInput") {
      response.status(400).json({
        error: result.message,
      });
      return;
    }

    response.status(201).json(result.encounter);
  };
}
