import { htmlToElement, fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { generateQuestionDOM } from '../question/question.js';
import { hashAnswer } from '../../scripts/hash-utils.js';

/**
 * Checks if the selected answers for a question are correct
 * @param {Element} questionElement The question element
 * @returns {Promise<boolean>} Whether the selected answers are correct
 */
async function checkQuestionAnswer(questionElement) {
  if (!questionElement) return false;

  // Get the hashed correct answers from the dataset
  const hashedCorrectAnswers = questionElement.dataset.correctAnswers.split(',');
  const isMultipleChoice = questionElement.dataset.isMultipleChoice === 'true';

  // Get all answer texts
  const answerElements = questionElement.querySelectorAll('.answer-label');
  const answerTexts = Array.from(answerElements).map(el => el.textContent.trim());

  if (isMultipleChoice) {
    const selectedAnswers = Array.from(questionElement.querySelectorAll('input[type="checkbox"]:checked')).map(
      (input) => parseInt(input.value, 10),
    );

    // For multiple choice, all selected answers must be correct and all correct answers must be selected
    if (selectedAnswers.length !== hashedCorrectAnswers.length) {
      return false;
    }
    
    // Check each selected answer against the hashed values
    for (const selectedAnswer of selectedAnswers) {
      // Convert from 1-based to 0-based index
      const answerIndex = selectedAnswer - 1;
      if (answerIndex >= 0 && answerIndex < answerTexts.length) {
        const answerText = answerTexts[answerIndex];
        
        // Generate hash for the selected answer
        const pagePath = window.location.pathname;
        const questionIndex = questionElement.dataset?.questionIndex || '0';
        const answerHash = await hashAnswer(pagePath, questionIndex, answerIndex.toString(), answerText);
        
        // Check if the hash is in the list of correct answer hashes
        if (!hashedCorrectAnswers.includes(answerHash)) {
          return false;
        }
      } else {
        return false;
      }
    }
    
    return true;
  } else {
    // For single choice questions
    const selectedAnswer = questionElement.querySelector('input[type="radio"]:checked');
    if (!selectedAnswer) return false;
    
    const selectedIndex = parseInt(selectedAnswer.value, 10) - 1; // Convert to 0-based
    if (selectedIndex >= 0 && selectedIndex < answerTexts.length) {
      const answerText = answerTexts[selectedIndex];
      
      // Generate hash for the selected answer
      const pagePath = window.location.pathname;
      const questionIndex = questionElement.dataset?.questionIndex || '0';
      const answerHash = await hashAnswer(pagePath, questionIndex, selectedIndex.toString(), answerText);
      
      // Check if the hash is in the list of correct answer hashes
      return hashedCorrectAnswers.includes(answerHash);
    }
    
    return false;
  }
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
