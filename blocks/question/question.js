import { fetchLanguagePlaceholders, htmlToElement } from '../../scripts/scripts.js';

/**
 * Generates the DOM for a question
 * This function is also called by quiz.js
 * @param {Element} block The question block element
 * @param {Object} placeholders Language placeholders
 * @returns {Element} The generated question DOM
 */

export function generateQuestionDOM(block, placeholders = {}) {
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

  // Store the hashed correct answers as metadata
  block.setAttribute('data-correctAnswers', correctAnswersDiv?.textContent?.trim() || '');

  block.dataset.isMultipleChoice = isMultipleChoice.toString();
  block.dataset.correctFeedback = correctFeedbackDiv?.textContent?.trim() || '';
  block.dataset.incorrectFeedback = incorrectFeedbackDiv?.textContent?.trim() || '';

  // Create question number label (e.g., "Question 1 of 3") using htmlToElement
  const questionIndex = parseInt(block.dataset?.questionIndex || '0', 10) + 1;
  const totalQuestions = block.dataset?.totalQuestions || '1';
  const questionNumberElement = htmlToElement(`
    <p class="question-number">${placeholders?.question || 'Question'} ${questionIndex} ${
      placeholders?.of || 'of'
    } ${totalQuestions}</p>
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
    const inputId = `question-${block.dataset?.questionIndex || 0}-answer-${answerIndex}`;
    const inputType = isMultipleChoice ? 'checkbox' : 'radio';
    const inputName = `question-${block.dataset?.questionIndex || 0}`;
    const inputValue = answerIndex + 1; // 1-based index for answers

    const inputWithLabel = htmlToElement(`
      <div>
        <input type="${inputType}" name="${inputName}" id="${inputId}" value="${inputValue}" class="answer-input">
        <label for="${inputId}" class="answer-label">${answer}</label>
      </div>
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
  const dom = generateQuestionDOM(block, placeholders);

  // Clear the block and append the DOM
  block.textContent = '';
  block.append(dom);
}
