/**
 * Generates the DOM for a question
 * This function is also called by quiz.js
 * @param {Element} block The question block element
 * @returns {Element} The generated question DOM
 */
export function generateQuestionDOM(block) {
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
    answers = [...answersList.querySelectorAll('li')].map((li) => li.textContent.trim());
  }

  // Extract correct answers
  let correctAnswers = [];
  if (correctAnswersDiv) {
    correctAnswers = correctAnswersDiv.textContent
      .trim()
      .split(',')
      .map((num) => parseInt(num.trim(), 10));
  }

  // Extract feedback messages
  const correctFeedback = correctFeedbackDiv?.textContent?.trim() || 'Correct!';
  const incorrectFeedback = incorrectFeedbackDiv?.textContent?.trim() || 'Incorrect';

  // Store values as data attributes
  block.dataset.correctAnswers = correctAnswers.join(',');
  block.dataset.isMultipleChoice = isMultipleChoice.toString();
  block.dataset.correctFeedback = correctFeedback;
  block.dataset.incorrectFeedback = incorrectFeedback;

  // Create question text
  const questionTextElement = document.createElement('p');
  questionTextElement.classList.add('question-text');
  questionTextElement.textContent = questionText;
  questionContainer.appendChild(questionTextElement);

  // Create divider
  const divider = document.createElement('hr');
  divider.classList.add('question-divider');
  questionContainer.appendChild(divider);

  // Create answers container
  const answersContainer = document.createElement('div');
  answersContainer.classList.add('answers-container');
  questionContainer.appendChild(answersContainer);

  // Create answer options
  answers.forEach((answer, answerIndex) => {
    const answerOption = document.createElement('div');
    answerOption.classList.add('answer-option');
    answerOption.style.display = 'flex';
    answerOption.style.alignItems = 'center';
    answerOption.style.marginBottom = '2rem';
    answerOption.style.position = 'relative';
    answerOption.style.textAlign = 'left';

    // Create input element
    const input = document.createElement('input');
    input.type = isMultipleChoice ? 'checkbox' : 'radio';
    input.name = `question-${block.dataset.questionIndex || 0}`;
    input.id = `question-${block.dataset.questionIndex || 0}-answer-${answerIndex}`;
    input.value = answerIndex + 1; // 1-based index for answers
    input.classList.add('answer-input');
    input.style.margin = '0';
    input.style.width = '15px';
    input.style.height = '15px';
    input.style.marginRight = '0.75rem';
    input.style.display = 'inline-block';
    input.style.verticalAlign = 'middle';
    input.style.position = 'static';
    input.style.opacity = '1';
    answerOption.appendChild(input);

    // Create label element
    const label = document.createElement('label');
    label.htmlFor = input.id;
    label.textContent = answer;
    label.style.display = 'inline-block';
    label.style.verticalAlign = 'middle';
    answerOption.appendChild(label);

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
export default function decorate(block) {
  // Generate the question DOM
  const dom = generateQuestionDOM(block);

  // Clear the block and append the DOM
  block.textContent = '';
  block.append(dom);
}
