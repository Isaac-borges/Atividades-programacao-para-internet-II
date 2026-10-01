/**
 * ============================================================
 * ORQUESTRAÇÃO
 * ------------------------------------------------------------
 * evento -> ação -> estado -> render -> tela. Sempre nesse sentido.
 * ============================================================
 */
import { listMedications, createMedication, getMedication, removeMedication } from "./api.js";
import { subscribe, getState, setMedications, addMedication, selectMedication, setError, setDetailError, clearSelection, removeMedicationFromState } from "./state.js";
import { renderCounter, renderLoading, renderError, renderMedicationList, renderDetail } from "./render.js";

const medicationListElement = document.querySelector("#medication-list");
const resultCounterElement = document.querySelector("#result-counter");
const detailPanelElement = document.querySelector("#detail-panel");

const patientNameInput = document.querySelector("#patient-name-input");
const medicationNameInput = document.querySelector("#medication-name-input");
const dosageInput = document.querySelector("#dosage-input");
const routeInput = document.querySelector("#route-input");
const scheduledAtInput = document.querySelector("#scheduled-at-input");
const notesInput = document.querySelector("#notes-input");
const saveButton = document.querySelector("#save-button");
const formFeedbackElement = document.querySelector("#form-feedback");

/** A única função que desenha a tela inteira. */
function renderApp(state) {
  if (state.errorMessage) {
    renderError(state.errorMessage, medicationListElement);
    resultCounterElement.textContent = "";
    return;
  }
  if (state.isLoading) {
    renderLoading(medicationListElement);
    resultCounterElement.textContent = "";
    return;
  }

  // PASSO 2: chame renderMedicationList aqui
  // PASSO 4: chame renderDetail(state, detailPanelElement) aqui
  renderMedicationList(state.medications, medicationListElement);
  renderCounter(state.medications.length, resultCounterElement);
  renderDetail(state, detailPanelElement);
}

subscribe(renderApp);

// ============================================================
// PASSO 2 — carga inicial
//   async function start() {
//     renderApp(getState());
//     try {
//       const medications = await listMedications();
//       setMedications(medications);
//     } catch (error) {
//       setError(error.message);
//     }
//   }
//   start();
// ============================================================
async function start() {
  renderApp(getState());
  try {
    const medications = await listMedications();
    setMedications(medications);
  } catch (error) {
    setError(error.message);
  }
}

// ============================================================
// PASSO 3 — clique em "Cadastrar prescrição"
//   ler os inputs, chamar createMedication(), addMedication(),
//   limpar o formulário, mostrar feedback de sucesso/erro
// ============================================================

function setFormFeedback(message, kind) {
  formFeedbackElement.textContent = message;
  formFeedbackElement.className = kind
    ? `med-form__feedback med-form__feedback--${kind}`
    : "med-form__feedback";
}

saveButton.addEventListener('click', async () => {
  saveButton.disabled = true;
  setFormFeedback("Enviando…", null);
  try {
    const created = await createMedication({
      patientName: patientNameInput.value,
      medicationName: medicationNameInput.value,
      dosage: dosageInput.value,
      route: routeInput.value,
      scheduledAt: scheduledAtInput.value,
      notes: notesInput.value,
    });

    addMedication(created);
    setFormFeedback(`Prescrição #${created.id} cadastrada.`, "success");
    patientNameInput.value = '';
    medicationNameInput.value = '';
    dosageInput.value = '';
    scheduledAtInput.value = '';
    notesInput.value = '';

  } catch (error) {
    setFormFeedback(error.message, 'error');
  } finally {
    saveButton.disabled = false;
  }
})

// ============================================================
// PASSO 4 — clique num cartão da lista (delegação de evento no <ul>)
//   event.target.closest('[data-medication-id]') -> selectMedication(id)
//   -> buscar o detalhe com getMedication(id) -> tratar 404
// ============================================================

medicationListElement.addEventListener('click', (event) => {
  const card = event.target.closest('[data-medication-id]');
  if (card) openDetail(Number(card.dataset.medicationId));
});

async function openDetail(id) {
  selectMedication(id);

  try {
    await getMedication(id);
  } catch (error) {
    setDetailError(error.message);
  }
};

detailPanelElement.addEventListener('click', async (event) => {
  if (event.target.id === "close-detail-button") {
    clearSelection();
    return;
  }

  if (event.target.id === "remove-button") {
    const state = getState();

    try {
      await removeMedication(state.selectedId);
      removeMedicationFromState(state.selectedId);
    } catch (error) {
      setDetailError(error.message);
    }
  }
})

// ============================================================
// PASSO 5 — clique em "Suspender" dentro do painel de detalhe
//   (delegação de evento no #detail-panel, já que ele é redesenhado)
//   removeMedication(id) -> removeMedicationFromState(id)
// ============================================================

start();
