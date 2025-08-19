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
async function checkSelectedAnswers(selectedAnswerIndices, answerTexts, pagePath, questionIndex, hashedCorrectAnswers, isMultipleChoice) {
  // For multiple choice, all selected answers must be correct and all correct answers must be selected
  if (isMultipleChoice && selectedAnswerIndices.length !== hashedCorrectAnswers.length) {
    return false;
  }
  
  // Check each selected answer
  for (const answerIndex of selectedAnswerIndices) {
    if (answerIndex > 0 && answerIndex <= answerTexts.length) {
      const answerText = answerTexts[answerIndex - 1];
      
      // Log input values
      console.log("Input values:", {
        pagePath,
        questionIndex,
        answerIndex: answerIndex.toString(),
        answerText
      });
      
      // Generate hash for the selected answer
      const answerHash = await hashAnswer(pagePath, questionIndex, answerIndex.toString(), answerText);
      
      // Log hash values
      console.log("Correct answer hashes:", hashedCorrectAnswers);
      console.log("Generated hash:", answerHash);
      
      // Check if this answer is correct
      if (!hashedCorrectAnswers.includes(answerHash)) {
        return false;
      }
    } else {
      return false;
    }
  }
  
  // All selected answers are correct
  return true;
}

async function checkQuestionAnswer(questionElement) {
  if (!questionElement) return false;

  // Get the hashed correct answers 
  const hashedCorrectAnswers = questionElement.dataset.correctAnswers.split(',');
  const isMultipleChoice = questionElement.dataset.isMultipleChoice === 'true';

  // Get all answer texts
  const answerElements = questionElement.querySelectorAll('.answer-label');
  const answerTexts = Array.from(answerElements).map(el => el.textContent.trim());

  const pagePath = window.location.pathname;
  const questionIndex = questionElement.dataset?.questionIndex || '0';

  let selectedAnswerIndices = [];
  
  if (isMultipleChoice) {
    selectedAnswerIndices = Array.from(questionElement.querySelectorAll('input[type="checkbox"]:checked')).map(
      (input) => parseInt(input.value, 10)
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
    isMultipleChoice
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
 * @param {Object} placeholders Language placeholders
 */
async function submitQuiz(questions, placeholders = {}) {
  // Check each question and show feedback
  for (const question of questions || []) {
    const isCorrect = await checkQuestionAnswer(question);
    showQuestionFeedback(question, isCorrect, placeholders);
  }
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
    const questionDOM = generateQuestionDOM(question, placeholders);

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
  submitButton.addEventListener('click', async () => {
    submitButton.disabled = true;
    await submitQuiz(questions, placeholders);
  });

  // Clear the block and build the quiz structure
  block.textContent = '';
  block.appendChild(questionsContainer);
  block.appendChild(submitButton);
}
