/**
 * Orquestracao -- PRONTA. Liga os elementos do DOM as acoes de
 * estado + api. Nenhuma logica de negocio mora aqui.
 */
import { listPatients, createPatient, uploadPatientPhoto } from "./api.js";
import { setPatients, addPatient, clearFormError, setPreviewUrl } from "./state.js";
import { render } from "./render.js";
import { renderApiError } from "./errors.js";

async function init() {
  try {
    const patients = await listPatients();
    setPatients(patients);
  } catch (err) {
    renderApiError(err.apiError);
  }
  render();
}

const form = document.getElementById("patient-form");
const photoInput = form.elements.photo;

// Preview local: nenhuma requisicao ao servidor acontece aqui.
photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];
  setPreviewUrl(file ? URL.createObjectURL(file) : null);
  render();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearFormError();

  const file = photoInput.files[0];
  const payload = {
    name: form.name.value,
    birthDate: form.birthDate.value,
    nationalId: form.nationalId.value,
  };

  try {
    const created = await createPatient(payload);
    const patient = file ? await uploadPatientPhoto(created.id, file) : created;
    addPatient(patient);
    form.reset();
    setPreviewUrl(null);
  } catch (err) {
    renderApiError(err.apiError);
  }
  render();
});

init();
