import { htmlToElement, fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { generateQuestionDOM } from '../question/question.js';
import { hashAnswer } from '../../scripts/hash-utils.js';

/**
 * Checks if the selected answers for a question are correct
 * @param {number[]} selectedAnswerIndices Array of selected answer indices
 * @param {string[]} answerTexts Array of all answer texts
 * @param {string} pagePath The page path
 * @param {string} questionIndex The question index
 * @param {string[]} hashedCorrectAnswers Array of correct answer hashes
 * @param {boolean} isMultipleChoice Whether the question is multiple choice
 * @returns {boolean} Whether the selected answers are correct
 */
async function checkSelectedAnswers(
  selectedAnswerIndices,
  answerTexts,
  pagePath,
  questionIndex,
  hashedCorrectAnswers,
  isMultipleChoice,
) {
  // Check if the number of answers is correct for multiple choice
  // and if all selected indices are valid
  if (
    (isMultipleChoice && selectedAnswerIndices.length !== hashedCorrectAnswers.length) ||
    selectedAnswerIndices.some((answerIndex) => answerIndex <= 0 || answerIndex > answerTexts.length)
  ) {
    return false;
  }

  // Generate hash for all selected answers
  const answerHashes = await Promise.all(
    selectedAnswerIndices.map((answerIndex) => {
      const answerText = answerTexts[answerIndex - 1];
      return hashAnswer(pagePath, questionIndex, answerIndex.toString(), answerText);
    }),
  );

  // Check if all selected answers are correct
  return answerHashes.every((hash) => hashedCorrectAnswers.includes(hash));
}

async function checkQuestionAnswer(questionElement) {
  if (!questionElement) return false;

  // Get the hashed correct answers from property
  const hashedCorrectAnswers = questionElement.correctAnswers.split(',');
  const isMultipleChoice = questionElement.dataset.isMultipleChoice === 'true';

  const answerElements = questionElement.querySelectorAll('.answer-label');
  const answerTexts = Array.from(answerElements).map((el) => el.textContent.trim());

  const pagePath = window.location.pathname;
  const questionIndex = questionElement.questionIndex.toString();

  let selectedAnswerIndices = [];

  if (isMultipleChoice) {
    selectedAnswerIndices = Array.from(questionElement.querySelectorAll('input[type="checkbox"]:checked')).map(
      (input) => parseInt(input.value, 10),
    );
  } else {
    const selectedAnswer = questionElement.querySelector('input[type="radio"]:checked');
    if (!selectedAnswer) return false;

    selectedAnswerIndices = [parseInt(selectedAnswer.value, 10)];
  }

  // Check if the selected answers are correct
  return checkSelectedAnswers(
    selectedAnswerIndices,
    answerTexts,
    pagePath,
    questionIndex,
    hashedCorrectAnswers,
    isMultipleChoice,
  );
}

/**
 * Shows feedback for a question
 * @param {Element} questionElement The question element
 * @param {boolean} isCorrect Whether the answer is correct
 * @param {Object} placeholders Language placeholders
 */
function showQuestionFeedback(questionElement, isCorrect, placeholders = {}) {
  if (!questionElement) {
    return;
  }

  // Get custom feedback messages from properties
  const correctFeedback = questionElement.correctFeedbackText || placeholders?.correct || 'Correct!';
  const incorrectFeedback = questionElement.incorrectFeedbackText || placeholders?.incorrect || 'Incorrect';

  // Create feedback element using htmlToElement
  const feedbackElement = htmlToElement(`
    <div class="question-feedback ${isCorrect ? 'correct' : 'incorrect'}">
      ${isCorrect ? correctFeedback : incorrectFeedback}
    </div>
  `);

  // Find the question block DOM and append feedback
  const questionBlock = questionElement?.querySelector('.question-block');
  if (questionBlock) {
    questionBlock.appendChild(feedbackElement);
  }
}

/**
 * Submits the quiz and shows feedback for each question
 * @param {NodeList} questions The list of question elements
 * @param {Object} placeholders Language placeholders
 */
async function submitQuiz(questions, placeholders = {}) {
  // Check all questions and show feedback
  const questionsArray = Array.from(questions || []);

  // Process all questions in parallel
  const results = await Promise.all(questionsArray.map((question) => checkQuestionAnswer(question)));

  // Show feedback for each question
  questionsArray.forEach((question, index) => {
    showQuestionFeedback(question, results[index], placeholders);
  });
}

let quizHandlerFunction = null;

// Export a constant function that returns the current handler
export const submitQuizHandler = () => quizHandlerFunction;

/**
 * Shuffles the given array
 * @param {Array} array The array to shuffle
 * @returns {Array} The shuffled array
 */
function shuffleArray(array) {
  // Map array items with their original indices
  const indexedArray = array.map((item, index) => ({
    item,
    originalIndex: index,
  }));

  // Fisher-Yates shuffle algorithm
  for (let i = indexedArray.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexedArray[i], indexedArray[j]] = [indexedArray[j], indexedArray[i]];
  }

  return indexedArray;
}

export default async function decorate(block) {
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }
  const questionsContainer = document.createElement('div');
  questionsContainer.classList.add('questions-container');

  // Get title, text, and questions from block children using destructuring
  const [titleElement, textElement, ...questionsOriginal] = [...block.children];

  const UEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');

  // Only shuffle questions if not in authoring mode
  const orderedQuestions = UEAuthorMode
    ? questionsOriginal.map((item, index) => ({ item, originalIndex: index }))
    : shuffleArray(questionsOriginal);

  // Set total questions count
  const totalQuestions = orderedQuestions.length;

  // Initialize display index
  let displayIndex = 1;

  // Process each question
  orderedQuestions?.forEach(({ item: question, originalIndex }) => {
    // Set original index for answer validation
    question.questionIndex = originalIndex;

    // Set display index for UI numbering
    const currentDisplayIndex = displayIndex;
    displayIndex += 1;

    // Generate the question DOM
    const questionDOM = generateQuestionDOM(question, currentDisplayIndex, totalQuestions, originalIndex, placeholders);

    question.textContent = '';

    // Add block classes
    question.classList.add('question', 'block');

    // Append the generated DOM to the question
    question.append(questionDOM);
    questionsContainer.append(question);
  });

  // Create a function to handle quiz submission that can be called externally
  quizHandlerFunction = async () => {
    // Check if all questions are answered
    let allQuestionsAnswered = true;

    // Remove any existing error message
    const existingError = block.querySelector('.quiz-error-message');
    if (existingError) {
      existingError.remove();
    }

    // Get all question elements
    const questionElements = Array.from(questionsContainer.querySelectorAll('.question'));

    // Check if all questions are answered using Array methods
    allQuestionsAnswered = questionElements.every((question) => {
      const isMultipleChoice = question.dataset.isMultipleChoice === 'true';
      return isMultipleChoice
        ? question.querySelectorAll('input[type="checkbox"]:checked').length > 0
        : question.querySelector('input[type="radio"]:checked') !== null;
    });

    if (!allQuestionsAnswered) {
      const errorMessage = htmlToElement(`
        <div class="question-feedback incorrect quiz-error-message">
          ${placeholders?.answerAllQuestions || 'Please answer all the questions'}
        </div>
      `);

      // Insert at the end of the questions container
      questionsContainer.appendChild(errorMessage);
      return false;
    }

    // Remove any existing question feedback before showing new feedback
    const existingFeedback = block.querySelectorAll('.question-feedback');
    existingFeedback.forEach((feedback) => feedback.remove());

    await submitQuiz(questionElements, placeholders);
    return true;
  };

  // Create quiz description section using htmlToElement
  const quizDescriptionContainer = htmlToElement(`
    <div class="quiz-description-container">
      <div class="quiz-title">
        ${titleElement?.innerHTML || ''}
      </div>
      <ul class="quiz-description">${textElement?.querySelector('div')?.innerHTML || ''}</ul>
    </div>
  `);

  // Clear the block and build the quiz structure
  block.textContent = '';
  block.appendChild(quizDescriptionContainer);
  block.appendChild(questionsContainer);
}
