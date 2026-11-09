/**
 * ============================================================
 * TODO 10 (Encontro 2) -- Schema Zod de Patient
 * ============================================================
 * export const createPatientSchema = z.object({ ... });
 *
 * Campos: name (string, min 1), birthDate (string, formato
 * AAAA-MM-DD), nationalId (string).
 *
 * Depois de escrever o schema, use-o no TODO 11 (middleware
 * validate) e monte na rota de criar paciente:
 *   patientsRouter.post("/", validate(createPatientSchema), patientsController.create);
 * ============================================================
 */

import { z } from 'zod';

export const createPatientSchema = z.object({
  name: z.string().trim().min(1, 'nome é obrigatório'),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'data de nascimento deve estar no formato AAAA-MM-DD'),
  nationalId: z.string().trim().min(1, 'nationalId (CNS) é obrigatório'),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
