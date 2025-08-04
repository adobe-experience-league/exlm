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
  
  // Extract all rows from the block
  const rows = [...block.children];
  
  // Process the question content
  let questionText = '';
  let isMultipleChoice = false;
  let answers = [];
  let correctAnswers = [];
  
  // Extract data from rows
  rows.forEach((row, rowIndex) => {
    if (rowIndex === 0) {
      // First row contains the question text
      questionText = row.textContent.trim();
    } else if (rowIndex === 1) {
      // Second row contains the question type (single or multiple choice)
      isMultipleChoice = row.textContent.trim().toLowerCase() === 'true';
    } else if (rowIndex === 2) {
      // Third row contains the answers as an ordered list
      const answersList = row.querySelector('ol');
      if (answersList) {
        answers = [...answersList.querySelectorAll('li')].map(li => li.textContent.trim());
      }
    } else if (rowIndex === 3) {
      // Fourth row contains the correct answers as comma-delimited values
      correctAnswers = row.textContent.trim().split(',').map(num => parseInt(num.trim(), 10));
    }
  });
  
  // Store correct answers as a data attribute for potential future use
  questionContainer.dataset.correctAnswers = correctAnswers.join(',');
  questionContainer.dataset.isMultipleChoice = isMultipleChoice.toString();
  
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
    
    const inputContainer = document.createElement('div');
    inputContainer.classList.add('input-container');
    
    const input = document.createElement('input');
    input.type = isMultipleChoice ? 'checkbox' : 'radio';
    input.name = `question-${block.dataset.questionIndex || 0}`;
    input.id = `question-${block.dataset.questionIndex || 0}-answer-${answerIndex}`;
    input.value = answerIndex + 1; // 1-based index for answers
    
    const label = document.createElement('label');
    label.htmlFor = input.id;
    label.textContent = answer;
    
    inputContainer.appendChild(input);
    answerOption.appendChild(inputContainer);
    answerOption.appendChild(label);
    answersContainer.appendChild(answerOption);
  });
  
  return questionContainer;
}

/**
 * Decorates the question block
 * @param {Element} block The question block element
 */
export default function decorate(block) {
  // Set a question index for standalone questions
  block.dataset.questionIndex = '0';
  
  // Generate the question DOM
  const dom = generateQuestionDOM(block);
  
  // Clear the block and append the DOM
  block.textContent = '';
  block.append(dom);
  
  // Add submit button if standalone
  if (block.classList.contains('question')) {
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.classList.add('question-submit-button');
    submitButton.textContent = 'SUBMIT';
    block.appendChild(submitButton);
  }
}
