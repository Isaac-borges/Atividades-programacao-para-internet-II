/**
 * Camada de comunicacao com a API -- PRONTA para list/create.
 * Todo `fetch` do projeto mora aqui dentro (acoplamento baixo:
 * o resto do frontend nunca chama fetch diretamente).
 */
const PATIENTS_URL = "/api/patients";

export async function listPatients() {
  const response = await fetch(PATIENTS_URL);
  const body = await response.json();
  if (!response.ok) throw { apiError: body };
  return body;
}

export async function createPatient(patient) {
  const response = await fetch(PATIENTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patient),
  });
  const body = await response.json();
  if (!response.ok) throw { apiError: body };
  return body;
}

/**
 * ============================================================
 * TODO 14 (Encontro 2) -- upload de foto
 * ============================================================
 * Envia a foto via multipart/form-data. O Content-Type NAO e
 * definido manualmente: o navegador precisa gerar o boundary.
 * ============================================================
 */
export async function uploadPatientPhoto(patientId, file) {
  const formData = new FormData();
  formData.append("photo", file);

  const response = await fetch(`${PATIENTS_URL}/${patientId}/photo`, {
    method: "POST",
    body: formData,
  });
  const body = await response.json();
  if (!response.ok) throw { apiError: body };
  return body;
}
