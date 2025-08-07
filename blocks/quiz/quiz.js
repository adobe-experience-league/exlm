import { htmlToElement, fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { generateQuestionDOM } from '../question/question.js';

/**
 * Checks if the selected answers for a question are correct
 * @param {Element} questionElement The question element
 * @returns {boolean} Whether the selected answers are correct
 */

function checkQuestionAnswer(questionElement) {
  if (!questionElement) return;

  const correctAnswers = questionElement.dataset.correctAnswers.split(',').map(Number);
  const isMultipleChoice = questionElement.dataset.isMultipleChoice === 'true';

  if (isMultipleChoice) {
    const selectedAnswers = Array.from(questionElement.querySelectorAll('input[type="checkbox"]:checked')).map(
      (input) => parseInt(input.value, 10),
    );

    // Check if selected answers match correct answers
    return (
      selectedAnswers.length === correctAnswers.length &&
      selectedAnswers.every((answer) => correctAnswers.includes(answer))
    );
  }

  // For single choice questions
  const selectedAnswer = questionElement.querySelector('input[type="radio"]:checked');
  return selectedAnswer && correctAnswers.includes(parseInt(selectedAnswer?.value || '0', 10));
}

/**
 * Shows feedback for a question
 * @param {Element} questionElement The question element
 * @param {boolean} isCorrect Whether the answer is correct
 */
function showQuestionFeedback(questionElement, isCorrect) {
  if (!questionElement) return;

  // Get custom feedback messages from data attributes
  const correctFeedback = questionElement.dataset.correctFeedback || placeholders?.correct || 'Correct!';
  const incorrectFeedback = questionElement.dataset.incorrectFeedback || placeholders?.incorrect || 'Incorrect';

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
 */
function submitQuiz(questions) {
  // Check each question and show feedback
  questions?.forEach((question) => {
    const isCorrect = checkQuestionAnswer(question);
    showQuestionFeedback(question, isCorrect);
  });
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

  const questions = [...block.children];

  // Set total questions count
  const totalQuestions = questions.length;

  questions?.forEach((question, index) => {
    // Set question index and total questions
    question.dataset.questionIndex = index.toString();
    question.dataset.totalQuestions = totalQuestions.toString();

    // Generate the question DOM
    const questionDOM = generateQuestionDOM(question);

    question.textContent = '';

    // Add block classes
    question.classList.add('question', 'block');

    // Append the generated DOM to the question
    question.append(questionDOM);
    questionsContainer.append(question);
  });

  // Create a single submit button for the entire quiz using htmlToElement
  const submitButton = htmlToElement(`
    <button type="button" class="quiz-submit-button">${placeholders?.submit || 'SUBMIT'}</button>
  `);
  submitButton.addEventListener('click', () => {
    submitQuiz(questions);
    submitButton.disabled = true;
  });

  // Clear the block and build the quiz structure
  block.textContent = '';
  block.appendChild(questionsContainer);
  block.appendChild(submitButton);
}
