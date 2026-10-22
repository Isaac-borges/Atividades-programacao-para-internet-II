/**
 * ============================================================
 * ORQUESTRAÇÃO
 * ------------------------------------------------------------
 * Este arquivo é o maestro. Ele não guarda estado e não desenha
 * nada sozinho. Ele apenas:
 *
 *   1. liga eventos do usuário às AÇÕES do estado
 *   2. manda a tela ser redesenhada quando o estado muda
 *   3. dispara a carga inicial dos dados
 *
 * O fluxo é sempre o mesmo, e sempre em um sentido só:
 *
 *   evento  ->  ação  ->  estado  ->  render  ->  tela
 *
 * Nunca o contrário. A tela nunca é a fonte da verdade.
 * ============================================================
 */
import { listPatients, createPatient } from "./api.js";
import { subscribe, getState, setPatients, setSearchTerm, setOnlyActive, setError, addPatient } from "./state.js";
import { renderPatientList, renderCounter, renderLoading, renderError } from "./render.js";

/* --- Os elementos que existem na página. Buscamos UMA vez. --- */
const searchInput = document.querySelector("#search-input");
const onlyActiveInput = document.querySelector("#only-active-input");
const patientListElement = document.querySelector("#patient-list");
const resultCounterElement = document.querySelector("#result-counter");

const saveButton = document.querySelector("#save-button");
const patientNameInput = document.querySelector("#patient-name-input");
const birthDateInput = document.querySelector("#patient-birth-date-input");
const nationalIdInput = document.querySelector("#patient-national-id-input");
const formFeedbackElement = document.querySelector("#form-feedback");

/**
 * A ÚNICA função que desenha a tela inteira.
 * Ela é chamada toda vez que o estado muda — e apenas por isso.
 */
function renderApp(state) {
  if (state.errorMessage) {
    renderError(state.errorMessage, patientListElement);
    resultCounterElement.textContent = "";
    return;
  }

  if (state.isLoading) {
    renderLoading(patientListElement);
    resultCounterElement.textContent = "";
    return;
  }

  renderPatientList(state.visiblePatients, state.searchTerm, patientListElement);
  renderCounter(state.visiblePatients.length, state.patients.length, resultCounterElement);
}

/* --- Eventos do usuário viram AÇÕES, nunca alterações de DOM --- */
searchInput.addEventListener("input", (event) => {
  setSearchTerm(event.target.value);
});

onlyActiveInput.addEventListener("change", (event) => {
  setOnlyActive(event.target.checked);
});

/* --- Sempre que o estado mudar, a tela é redesenhada --- */
subscribe(renderApp);

/* --- Carga inicial --- */
async function start() {
  renderApp(getState());

  try {
    const patients = await listPatients();
    setPatients(patients);
  } catch (error) {
    setError(error.message);
  }
}

function setFormFeedback(message, kind) {
  formFeedbackElement.textContent = message;
  formFeedbackElement.className = kind
    ? `patient-form__feedback patient-form__feedback--${kind}`
    : "patient-form__feedback";
}

saveButton.addEventListener("click", async () => {
  saveButton.disabled = true;
  setFormFeedback("Enviando…", null);
  try {
    const created = await createPatient({
      patientName: patientNameInput.value,
      birthDate: birthDateInput.value,
      nationalId: nationalIdInput.value,
    });

    addPatient(created);
    setFormFeedback(`Paciente #${created.id} cadastrado(a).`, "success");
    patientNameInput.value = '';

  } catch (error) {
    setFormFeedback(error.message, 'error');
  } finally {
    saveButton.disabled = false;
  }
})


start();
