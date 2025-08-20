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
  // For multiple choice, all selected answers must be correct and all correct answers must be selected
  if (isMultipleChoice && selectedAnswerIndices.length !== hashedCorrectAnswers.length) {
    return false;
  }

  // Check if any answer index is invalid
  const hasInvalidIndex = selectedAnswerIndices.some(
    (answerIndex) => answerIndex <= 0 || answerIndex > answerTexts.length,
  );

  if (hasInvalidIndex) {
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

  // Get the hashed correct answers
  const hashedCorrectAnswers = questionElement.dataset.correctAnswers.split(',');
  const isMultipleChoice = questionElement.dataset.isMultipleChoice === 'true';

  const answerElements = questionElement.querySelectorAll('.answer-label');
  const answerTexts = Array.from(answerElements).map((el) => el.textContent.trim());

  const pagePath = window.location.pathname;
  const questionIndex = questionElement.dataset?.questionIndex || '0';

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
  // Check all questions and show feedback
  const questionsArray = Array.from(questions || []);

  // Process all questions in parallel
  const results = await Promise.all(questionsArray.map((question) => checkQuestionAnswer(question)));

  // Show feedback for each question
  questionsArray.forEach((question, index) => {
    showQuestionFeedback(question, results[index], placeholders);
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
    const questionDOM = generateQuestionDOM(question, placeholders);

    question.textContent = '';

    // Add block classes
    question.classList.add('question', 'block');

    // Append the generated DOM to the question
    question.append(questionDOM);
    questionsContainer.append(question);
  });

  // Create a function to handle quiz submission that can be called externally
  window.submitQuizHandler = async () => {
    // Check if all questions are answered
    let allQuestionsAnswered = true;

    // Remove any existing error message
    const existingError = block.querySelector('.quiz-error-message');
    if (existingError) {
      existingError.remove();
    }

    // Check if all questions are answered using Array methods
    allQuestionsAnswered = Array.from(questions).every((question) => {
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

    await submitQuiz(questions, placeholders);
    return true;
  };

  // Create quiz description section
  const quizDescriptionContainer = document.createElement('div');
  quizDescriptionContainer.classList.add('quiz-description-container');

  const quizDescriptionTitle = document.createElement('h2');
  quizDescriptionTitle.classList.add('quiz-description-title');
  quizDescriptionTitle.textContent = placeholders?.quizTitle || 'Skill Track Quiz';

  const quizDescriptionText = document.createElement('ul');
  quizDescriptionText.classList.add('quiz-description-text');

  const descriptionItems = [
    placeholders?.quizDesc1 || 'End of Skill Track quizzes are pass/fail',
    placeholders?.quizDesc2 || 'A "passing" grade is based on a total score of 80%',
    placeholders?.quizDesc3 || 'Quizzes are not timed',
    placeholders?.quizDesc4 || 'You can retake quizzes as many times as necessary',
    placeholders?.quizDesc5 ||
      'Questions may be in the form of multiple choice, multi select, and ordering in bullet points',
  ];

  descriptionItems.forEach((item) => {
    const listItem = document.createElement('li');
    listItem.textContent = item;
    quizDescriptionText.appendChild(listItem);
  });

  quizDescriptionContainer.appendChild(quizDescriptionTitle);
  quizDescriptionContainer.appendChild(quizDescriptionText);

  // Clear the block and build the quiz structure
  block.textContent = '';
  block.appendChild(quizDescriptionContainer);
  block.appendChild(questionsContainer);
}
