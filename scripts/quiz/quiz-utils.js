export const QUIZ_ANSWERS_STORAGE_KEY = 'exlm.quiz.answers';

/** @type {{ moduleId: string, sessionAnswers: Record<string, number[]> } | null} */
let activeQuizSession = null;

function clearQuizSession(moduleId) {
  if (!activeQuizSession || activeQuizSession.moduleId !== moduleId) return;
  activeQuizSession.sessionAnswers = {};
}

function readQuizAnswersStore() {
  try {
    const raw = localStorage.getItem(QUIZ_ANSWERS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error reading quiz answers from localStorage:', err);
    return {};
  }
}

function writeQuizAnswersStore(store) {
  try {
    if (!store || Object.keys(store).length === 0) {
      localStorage.removeItem(QUIZ_ANSWERS_STORAGE_KEY);
      return;
    }
    localStorage.setItem(QUIZ_ANSWERS_STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error writing quiz answers to localStorage:', err);
  }
}

function sanitizeSelectedIndices(indices, maxAnswers) {
  if (!Array.isArray(indices) || maxAnswers <= 0) return [];
  return [
    ...new Set(
      indices
        .map((value) => parseInt(value, 10))
        .filter((value) => Number.isInteger(value) && value >= 1 && value <= maxAnswers),
    ),
  ];
}

export function getStoredModuleAnswers(moduleId) {
  if (!moduleId) return {};
  try {
    const store = readQuizAnswersStore();
    const moduleAnswers = store[moduleId];
    return moduleAnswers && typeof moduleAnswers === 'object' ? moduleAnswers : {};
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error reading module quiz answers from localStorage:', err);
    return {};
  }
}

export function startQuizAnswerSession(moduleId) {
  const sessionAnswers = {};
  activeQuizSession = { moduleId, sessionAnswers };
  return sessionAnswers;
}

export function clearStoredModuleQuizAnswers(moduleId) {
  if (!moduleId) return;
  clearQuizSession(moduleId);
  try {
    const store = readQuizAnswersStore();
    if (!(moduleId in store)) return;
    delete store[moduleId];
    writeQuizAnswersStore(store);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error clearing module quiz answers from localStorage:', err);
  }
}

export function persistModuleQuizAnswers(moduleId) {
  if (!moduleId || !activeQuizSession || activeQuizSession.moduleId !== moduleId) return;
  const { sessionAnswers } = activeQuizSession;
  if (!sessionAnswers || Object.keys(sessionAnswers).length === 0) return;
  try {
    const store = readQuizAnswersStore();
    store[moduleId] = { ...sessionAnswers };
    writeQuizAnswersStore(store);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error persisting module quiz answers to localStorage:', err);
  }
}

function getSelectedAnswerIndices(answersContainer) {
  const checkedInputs = answersContainer.querySelectorAll('input.answer-input:checked');
  return Array.from(checkedInputs).map((input) => parseInt(input.value, 10));
}

function applyStoredQuestionAnswers(answersContainer, moduleAnswers, questionIndex, sessionAnswers) {
  const maxAnswers = answersContainer.querySelectorAll('input.answer-input').length;
  const key = String(questionIndex);
  const fromLS = Array.isArray(moduleAnswers[key]) ? moduleAnswers[key] : [];
  if (fromLS.length && !sessionAnswers[key]) {
    sessionAnswers[key] = fromLS;
  }
  const saved = sanitizeSelectedIndices(sessionAnswers[key] ?? [], maxAnswers);
  saved.forEach((answerIndex) => {
    const input = answersContainer.querySelector(`input.answer-input[value="${answerIndex}"]`);
    if (input) input.checked = true;
  });
}

function wireQuestionAnswerPersistence(answersContainer, questionIndex, sessionAnswers) {
  const maxAnswers = answersContainer.querySelectorAll('input.answer-input').length;
  answersContainer.addEventListener('change', (event) => {
    if (!event.target.matches('input.answer-input')) return;
    sessionAnswers[String(questionIndex)] = sanitizeSelectedIndices(
      getSelectedAnswerIndices(answersContainer),
      maxAnswers,
    );
  });
}

export function initQuestionAnswerPersistence(questionDOM, moduleAnswers, questionIndex, sessionAnswers) {
  const answersContainer = questionDOM.querySelector('.answers-container');
  if (!answersContainer) return;
  applyStoredQuestionAnswers(answersContainer, moduleAnswers, questionIndex, sessionAnswers);
  wireQuestionAnswerPersistence(answersContainer, questionIndex, sessionAnswers);
}
