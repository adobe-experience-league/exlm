import { htmlToElement, fetchLanguagePlaceholders, decorateExternalLinks, getConfig } from '../../scripts/scripts.js';
import { generateQuestionDOM } from '../question/question.js';
import { hashAnswer } from '../../scripts/hash-utils.js';
import { moveInstrumentation } from '../../scripts/utils/ue-utils.js';
import { loadBlocks, decorateSections, decorateBlocks } from '../../scripts/lib-franklin.js';

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
 * Submits the quiz and evaluates the results
 * @param {NodeList} questions The list of question elements
 * @param {Object} placeholders Language placeholders
 * @param {Element} passPageUrlElement The pass page URL element
 * @param {Element} failPageUrlElement The fail page URL element
 * @returns {Object} The quiz results including correct answers count and whether the quiz was passed
 */
async function submitQuiz(questions, placeholders = {}, passPageUrlElement, failPageUrlElement) {
  // Check all questions
  const questionsArray = Array.from(questions || []);

  // Process all questions in parallel
  const results = await Promise.all(questionsArray.map((question) => checkQuestionAnswer(question)));

  // Count correct answers
  const correctAnswersCount = results.filter(Boolean).length;

  // Get pass criteria from config (default to 65% if not available)
  const { quizPassingCriteria = 0.65 } = getConfig();
  const passCriteriaValue = Math.ceil(questionsArray.length * quizPassingCriteria);

  // Determine if quiz was passed
  const isPassed = correctAnswersCount >= passCriteriaValue;

  // Extract URLs from anchor elements in the elements
  const passPageUrl = passPageUrlElement?.querySelector('a')?.href;
  const failPageUrl = failPageUrlElement?.querySelector('a')?.href;

  return {
    correctAnswersCount,
    totalQuestions: questionsArray.length,
    isPassed,
    passCriteriaValue,
    passPageUrl: passPageUrl || '',
    failPageUrl: failPageUrl || '',
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

// Fetch page content and insert it into the current page
const fetchPageContent = async (url, block, isPassed = false, placeholders = {}) => {
  // Show loading state with placeholder
  const loadingMessage = htmlToElement(
    `<div class="quiz-loading">${placeholders?.loadingResults || 'Loading results...'}</div>`,
  );
  block.appendChild(loadingMessage);

  try {
    // Fetch the content
    const response = await fetch(`${url}.plain.html`);
    if (response.ok) {
      const pageContent = await response.text();

      // Clear the block content (dataset attributes are preserved automatically)
      block.textContent = '';

      // Create a container for the fetched content
      const resultContainer = document.createElement('div');
      resultContainer.classList.add('quiz-result-container');
      resultContainer.innerHTML = pageContent;

      // Use the imported decoration functions

      // Decorate the content properly
      decorateSections(resultContainer);
      decorateBlocks(resultContainer);
      decorateExternalLinks(resultContainer);

      // Find the quiz-scorecard block and pass the quiz results data
      const quizScorecard = resultContainer.querySelector('.quiz-scorecard');
      if (quizScorecard && block.dataset.correctAnswers && block.dataset.totalQuestions) {
        quizScorecard.dataset.correctAnswers = block.dataset.correctAnswers;
        quizScorecard.dataset.totalQuestions = block.dataset.totalQuestions;
      }

      await loadBlocks(resultContainer);

      // Special handling for AEM root mode
      if (window.hlx.aemRoot) {
        moveInstrumentation(block, resultContainer);
      }

      // Add the result container to the block
      block.appendChild(resultContainer);

      // Hide module-info-section when quiz results are displayed
      const moduleInfoSection = document.querySelector('body.courses .module-info-section');
      if (moduleInfoSection) {
        moduleInfoSection.style.display = 'none';
      }

      // Scroll to the top of the page to show the results
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Update navigation buttons
      const backButton = document.querySelector('.module-nav-button.module-nav-back.secondary');
      const nextButton = document.querySelector('.module-nav-button.module-nav-submit.disabled');

      if (backButton) {
        backButton.textContent = 'Back to Course Overview';
      }

      if (nextButton) {
        nextButton.textContent = 'Next';

        // Enable or disable the Next button based on quiz result
        if (isPassed) {
          nextButton.classList.remove('disabled');
        } else {
          nextButton.classList.add('disabled');
        }
      }
    }
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.error('Error fetching quiz result content:', err);
  }
};

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

  // Get title, text, pass page URL, fail page URL, and questions from block children
  const [titleElement, textElement, passPageUrlElement, failPageUrlElement, ...questionsOriginal] = [...block.children];

  // Extract URLs from anchor elements
  const passPageUrl = passPageUrlElement?.querySelector('a')?.href;
  const failPageUrl = failPageUrlElement?.querySelector('a')?.href;

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

    // Submit quiz and get results
    const quizResults = await submitQuiz(questionElements, placeholders, passPageUrlElement, failPageUrlElement);

    // Get the appropriate URL based on quiz result
    const redirectUrl = quizResults.isPassed ? quizResults.passPageUrl : quizResults.failPageUrl;

    // Load the appropriate page content as a fragment
    if (redirectUrl) {
      // Save quiz results data directly to the block's dataset attributes
      // These will be used by the quiz-scorecard block and preserved during fetchPageContent
      block.dataset.correctAnswers = quizResults.correctAnswersCount;
      block.dataset.totalQuestions = quizResults.totalQuestions;

      await fetchPageContent(redirectUrl, block, quizResults.isPassed, placeholders);
    }
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
