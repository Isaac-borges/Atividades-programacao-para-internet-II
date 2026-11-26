/**
 * Estado central da aplicacao -- PRONTO.
 * Nada no projeto manipula o DOM direto: tudo passa por aqui,
 * e render.js le esse estado para desenhar a tela de novo.
 */
export const state = {
  patients: [],
  formError: null,
  fieldErrors: {},
  previewUrl: null,
};

export function setPatients(patients) {
  state.patients = patients;
}

export function addPatient(patient) {
  state.patients = [...state.patients, patient].sort((a, b) => a.name.localeCompare(b.name));
}

export function setFormError(message, fieldErrors = {}) {
  state.formError = message;
  state.fieldErrors = fieldErrors;
}

export function clearFormError() {
  state.formError = null;
  state.fieldErrors = {};
}

export function setPreviewUrl(url) {
  if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
  state.previewUrl = url;
}
