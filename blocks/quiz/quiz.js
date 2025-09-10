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

  // Debug info
  console.log(`Question ${questionIndex} - Selected indices:`, selectedAnswerIndices);
  console.log(`Question ${questionIndex} - Answer texts:`, answerTexts);
  console.log(`Question ${questionIndex} - Hashed correct answers:`, hashedCorrectAnswers);

  // Check if the selected answers are correct
  const isCorrect = await checkSelectedAnswers(
    selectedAnswerIndices,
    answerTexts,
    pagePath,
    questionIndex,
    hashedCorrectAnswers,
    isMultipleChoice,
  );
  
  console.log(`Question ${questionIndex} answer check: ${isCorrect ? 'Correct' : 'Incorrect'}`);
  return isCorrect;
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
 * @param {number} passingCriteria The number of questions that must be answered correctly to pass
 * @returns {Object} The quiz results including correct answers count and pass/fail status
 */
async function submitQuiz(questions, placeholders = {}, passingCriteria = 0) {
  // Check all questions and show feedback
  const questionsArray = Array.from(questions || []);

  // Process all questions in parallel
  const results = await Promise.all(questionsArray.map((question) => checkQuestionAnswer(question)));

  // Show feedback for each question
  questionsArray.forEach((question, index) => {
    showQuestionFeedback(question, results[index], placeholders);
  });

  // Count correct answers
  const correctAnswersCount = results.filter(Boolean).length;

  // Ensure passing criteria is a valid number
  const validPassingCriteria = typeof passingCriteria === 'number' && !isNaN(passingCriteria) ? passingCriteria : 0;

  // Determine if the quiz is passed based on passing criteria
  // If passing criteria is set, check if correct answers meet or exceed it
  // If passing criteria is not set, default to false
  const isPassed = validPassingCriteria > 0 ? correctAnswersCount >= validPassingCriteria : false;

  // Log for debugging
  console.log(`Quiz Results: ${correctAnswersCount} correct out of ${questionsArray.length}, passing criteria: ${validPassingCriteria}, isPassed: ${isPassed}`);

  return {
    correctAnswersCount,
    totalQuestions: questionsArray.length,
    isPassed,
  };
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
  
  // Get passing criteria from block properties
  const passingCriteriaAttr = block.querySelector(':scope > div > div').getAttribute('data-passing-criteria');
  if (passingCriteriaAttr) {
    block.dataset.passingCriteria = passingCriteriaAttr;
    console.log(`Setting passing criteria from attribute: ${passingCriteriaAttr}`);
  }
  
  // Get quiz pass/fail messages from block properties
  const quizPassMessageAttr = block.querySelector(':scope > div > div').getAttribute('data-quiz-pass-message');
  if (quizPassMessageAttr) {
    block.dataset.quizPassMessage = quizPassMessageAttr;
  }
  
  const quizFailMessageAttr = block.querySelector(':scope > div > div').getAttribute('data-quiz-fail-message');
  if (quizFailMessageAttr) {
    block.dataset.quizFailMessage = quizFailMessageAttr;
  }

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

  // Parse passing criteria from block dataset
  const passingCriteria = parseInt(block.dataset.passingCriteria || '0', 10);
  console.log(`Parsed passing criteria: ${passingCriteria}, from dataset: ${block.dataset.passingCriteria}`);

  // Create a function to handle quiz submission that can be called externally
  quizHandlerFunction = async () => {
    // Check if all questions are answered
    let allQuestionsAnswered = true;

    // Remove any existing error message
    const existingError = block.querySelector('.quiz-error-message');
    if (existingError) {
      existingError.remove();
    }

    // Remove any existing result message
    const existingResultMessage = block.querySelector('.quiz-result-message');
    if (existingResultMessage) {
      existingResultMessage.remove();
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

    // Check if passing criteria is set
    if (passingCriteria > 0) {
      // Get quiz pass/fail messages from block properties
      const quizPassMessage = block.dataset.quizPassMessage || '<p>Congratulations! You have passed the quiz.</p>';
      const quizFailMessage =
        block.dataset.quizFailMessage || '<p>Sorry, you did not pass the quiz. Please try again.</p>';

      // Log the passing criteria for debugging
      console.log(`Passing criteria: ${passingCriteria}`);
      
      // Process the quiz and get results
      const quizResults = await submitQuiz(questionElements, placeholders, passingCriteria);
      
      // Log the quiz results
      console.log(`Quiz results:`, quizResults);
      console.log(`Is passed: ${quizResults.isPassed}, Correct answers: ${quizResults.correctAnswersCount}, Total questions: ${quizResults.totalQuestions}`);

      // Clear the block content
      block.textContent = '';

      // Create and show the result message
      const resultMessage = quizResults.isPassed ? quizPassMessage : quizFailMessage;
      console.log(`Showing ${quizResults.isPassed ? 'pass' : 'fail'} message: ${resultMessage}`);
      
      const resultMessageElement = htmlToElement(`
        <div class="quiz-result-message ${quizResults.isPassed ? 'pass' : 'fail'}">
          ${resultMessage}
        </div>
      `);

      // Add the result message to the block
      block.appendChild(resultMessageElement);

      return quizResults;
    } else {
      // If no passing criteria is set, just show the feedback for each question (original behavior)
      // Remove any existing question feedback before showing new feedback
      const existingFeedback = block.querySelectorAll('.question-feedback');
      existingFeedback.forEach((feedback) => feedback.remove());

      // Process the quiz without changing the display
      return await submitQuiz(questionElements, placeholders, 0);
    }
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

  // Make quizDescriptionContainer accessible in the outer scope
  window.quizDescriptionContainer = quizDescriptionContainer;

  // Clear the block and build the quiz structure
  block.textContent = '';
  block.appendChild(quizDescriptionContainer);
  block.appendChild(questionsContainer);
}
