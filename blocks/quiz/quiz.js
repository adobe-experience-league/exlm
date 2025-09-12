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

// This function has been removed as per requirements

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
  
  // Default pass criteria is 65% of total questions
  const passCriteriaValue = Math.ceil(questionsArray.length * 0.65);
  
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
    failPageUrl: failPageUrl || ''
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
const fetchPageContent = async (url, block) => {
  // Show loading state
  const loadingMessage = htmlToElement('<div class="quiz-loading">Loading results...</div>');
  block.appendChild(loadingMessage);
  
  // Fetch the content
  const response = await fetch(`${url}.plain.html`);
  if (response.ok) {
    const pageContent = await response.text();
    
    // Clear the block content
    block.textContent = '';
    
    // Create a container for the fetched content
    const resultContainer = document.createElement('div');
    resultContainer.classList.add('quiz-result-container');
    resultContainer.innerHTML = pageContent;
    
    // Add the result container to the block
    block.appendChild(resultContainer);
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
  const redirectUrl = quizResults.isPassed 
    ? quizResults.passPageUrl 
    : quizResults.failPageUrl;
  
  // Load the appropriate page content as a fragment
  if (redirectUrl) {
    await fetchPageContent(redirectUrl, block);
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
