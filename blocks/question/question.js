import { fetchLanguagePlaceholders, htmlToElement } from '../../scripts/scripts.js';

/**
 * Generates the DOM for a question
 * This function is also called by quiz.js
 * @param {Element} block The question block element
 * @param {number} displayIndex The display index for visual numbering
 * @param {number} totalQuestions The total number of questions
 * @param {Object} placeholders Language placeholders
 * @returns {Element} The generated question DOM
 */

export function generateQuestionDOM(block, displayIndex, totalQuestions, questionIndex, placeholders = {}) {
  // Create question container
  const questionContainer = document.createElement('div');
  questionContainer.classList.add('question-block');

  // Extract all divs from the block using destructuring
  const [
    questionTextDiv,
    isMultipleChoiceDiv,
    answersDiv,
    correctAnswersDiv,
    correctFeedbackDiv,
    incorrectFeedbackDiv,
  ] = [...block.children];

  // Process the question content
  const questionText = questionTextDiv?.textContent?.trim();
  const isMultipleChoice = isMultipleChoiceDiv?.textContent?.trim().toLowerCase() === 'true';

  // Extract answers from ordered list
  let answers = [];
  const answersList = answersDiv?.querySelector('ol');
  if (answersList) {
    answers = [...(answersList.querySelectorAll('li') || [])].map((li) => li?.textContent?.trim() || '');
  }

  // Store the hashed correct answers as a property
  block.correctAnswers = correctAnswersDiv?.textContent?.trim() || '';
  block.dataset.isMultipleChoice = isMultipleChoice.toString();
  block.correctFeedbackText = correctFeedbackDiv?.textContent?.trim() || '';
  block.incorrectFeedbackText = incorrectFeedbackDiv?.textContent?.trim() || '';
  block.questionIndex = questionIndex;

  const displayIndexValue = displayIndex || (parseInt(questionIndex, 10) + 1).toString();
  const totalQuestionsValue = totalQuestions || '1';
  const questionNumberElement = htmlToElement(`
    <p class="question-number">${placeholders?.question || 'Question'} ${displayIndexValue} ${
      placeholders?.of || 'of'
    } ${totalQuestionsValue}</p>
  `);
  questionContainer.appendChild(questionNumberElement);

  // Create question text using htmlToElement
  const questionTextElement = htmlToElement(`
    <p class="question-text">${questionText}</p>
  `);
  questionContainer.appendChild(questionTextElement);

  // Create answers container
  const answersContainer = document.createElement('div');
  answersContainer.classList.add('answers-container');
  questionContainer.appendChild(answersContainer);

  answers.forEach((answer, answerIndex) => {
    const answerOption = document.createElement('div');
    answerOption.classList.add('answer-option');

    // Create input and label elements
    const inputId = `question-${questionIndex}-answer-${answerIndex}`;
    const inputType = isMultipleChoice ? 'checkbox' : 'radio';
    const inputName = `question-${questionIndex}`;
    const inputValue = answerIndex + 1; // 1-based index for answers

    const inputWithLabel = htmlToElement(`
        <input type="${inputType}" name="${inputName}" id="${inputId}" value="${inputValue}" class="answer-input">
        <label for="${inputId}" class="answer-label">${answer}</label>
    `);

    // Move the elements to the answerOption div
    while (inputWithLabel.firstChild) {
      answerOption.appendChild(inputWithLabel.firstChild);
    }

    // Add to answers container
    answersContainer.appendChild(answerOption);
  });

  // Create feedback element (hidden initially)
  const feedbackElement = document.createElement('div');
  feedbackElement.classList.add('question-feedback');
  feedbackElement.style.display = 'none';
  questionContainer.appendChild(feedbackElement);

  return questionContainer;
}

/**
 * Decorates the question block
 * @param {Element} block The question block element
 */
export default async function decorate(block) {
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }
  // Generate the question DOM
  const dom = generateQuestionDOM(block, null, null, 0, placeholders);

  // Clear the block and append the DOM
  block.textContent = '';
  block.append(dom);
}
