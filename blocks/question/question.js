/**
 * Generates the DOM for a question
 * @param {Element} block The question block element
 * @param {number} index The index of the question
 * @returns {Element} The generated question DOM
 */
export function generateQuestionDOM(block, index) {
  // Create question container
  const questionContainer = document.createElement('div');
  questionContainer.classList.add('question-block');
  
  // Extract all divs from the block
  const rows = [...block.children];
  
  // Extract question data from rows
  const questionRow = rows[0];
  const typeRow = rows[1];
  const answersRow = rows[2];
  const correctAnswersRow = rows[3];
  
  // Get question text
  const questionText = questionRow?.querySelector('div')?.textContent?.trim() || '';
  
  // Get question type (single or multiple choice)
  const isMultipleChoice = typeRow?.querySelector('div')?.textContent?.trim()?.toLowerCase() === 'true';
  
  // Get answers from ordered list
  const answersList = answersRow?.querySelector('div ol');
  const answers = answersList 
    ? [...answersList.querySelectorAll('li')].map(li => li.textContent.trim())
    : [];
  
  // Get correct answers
  const correctAnswersText = correctAnswersRow?.querySelector('div')?.textContent?.trim() || '';
  const correctAnswers = correctAnswersText 
    ? correctAnswersText.split(',').map(num => parseInt(num.trim(), 10))
    : [];
  
  // Check for any specific classes that might be applied to the question
  const isRequiredQuestion = block.classList.contains('required');
  const hasCustomStyle = block.classList.contains('custom-style');
  const questionTheme = [...block.classList].find(cls => cls.startsWith('theme-'));
  
  // Add any additional classes from the block
  if (isRequiredQuestion) questionContainer.classList.add('required');
  if (hasCustomStyle) questionContainer.classList.add('custom-style');
  if (questionTheme) questionContainer.classList.add(questionTheme);
  
  // Store correct answers as a data attribute for potential future use
  questionContainer.dataset.correctAnswers = correctAnswers.join(',');
  questionContainer.dataset.isMultipleChoice = isMultipleChoice.toString();
  questionContainer.dataset.questionIndex = index.toString();
  
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
    input.name = `question-${index}`;
    input.id = `question-${index}-answer-${answerIndex}`;
    input.value = answerIndex + 1; // 1-based index for answers
    
    const label = document.createElement('label');
    label.htmlFor = `question-${index}-answer-${answerIndex}`;
    label.textContent = answer;
    
    inputContainer.appendChild(input);
    answerOption.appendChild(inputContainer);
    answerOption.appendChild(label);
    answersContainer.appendChild(answerOption);
  });
  
  // Add submit button if standalone
  if (index === 0 && block.classList.contains('question')) {
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.classList.add('question-submit-button');
    submitButton.textContent = 'SUBMIT';
    questionContainer.appendChild(submitButton);
  }
  
  return questionContainer;
}

/**
 * Decorates the question block
 * @param {Element} block The question block element
 */
export default function decorate(block) {
  // This function is only used when the question is used standalone
  // In most cases, questions will be used within a quiz block
  const questionDOM = generateQuestionDOM(block, 0);
  block.textContent = '';
  block.appendChild(questionDOM);
}
