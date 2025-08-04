/**
 * Generates the DOM for a question
 * @param {Element} block The question block element
 * @param {number} index The index of the question
 * @returns {Element} The generated question DOM
 */
export function generateQuestionDOM(block, index) {
  // Extract all divs from the block
  const allDivs = [...block.querySelectorAll(':scope div > div')];
  
  // Extract properties from the divs
  let questionText;
  let questionType;
  let answersContent;
  let correctAnswersText;
  
  // Assign divs to variables based on their position
  [questionText, questionType, answersContent, correctAnswersText] = allDivs;
  
  // Extract values from the properties
  const questionTextValue = questionText?.textContent?.trim() || '';
  const isMultipleChoice = questionType?.textContent?.trim()?.toLowerCase() === 'true';
  
  // Get answers from ordered list
  const answersList = answersContent?.querySelector('ol');
  const answers = answersList 
    ? [...answersList.querySelectorAll('li')].map(li => li.textContent.trim())
    : [];
  
  // Get correct answers
  const correctAnswers = correctAnswersText?.textContent?.trim()
    ? correctAnswersText.textContent.trim().split(',').map(num => parseInt(num.trim(), 10))
    : [];
  
  // Check for any specific classes that might be applied to the question
  const isRequiredQuestion = block.classList.contains('required');
  const hasCustomStyle = block.classList.contains('custom-style');
  const questionTheme = [...block.classList].find(cls => cls.startsWith('theme-'));
  
  // Create question container
  const questionContainer = document.createElement('div');
  questionContainer.classList.add('question-block');
  
  // Add any additional classes from the block
  if (isRequiredQuestion) questionContainer.classList.add('required');
  if (hasCustomStyle) questionContainer.classList.add('custom-style');
  if (questionTheme) questionContainer.classList.add(questionTheme);
  
  // Store correct answers as a data attribute for potential future use
  questionContainer.dataset.correctAnswers = correctAnswers.join(',');
  questionContainer.dataset.isMultipleChoice = isMultipleChoice.toString();
  questionContainer.dataset.questionIndex = index.toString();
  
  // Create question DOM structure
  const questionDOM = document.createRange().createContextualFragment(`
    <p class="question-text">${questionTextValue}</p>
    <hr class="question-divider">
    <div class="answers-container"></div>
  `);
  
  // Add answers to the container
  const answersContainer = questionDOM.querySelector('.answers-container');
  answers.forEach((answer, answerIndex) => {
    const answerOption = document.createElement('div');
    answerOption.classList.add('answer-option');
    
    const inputType = isMultipleChoice ? 'checkbox' : 'radio';
    const inputName = `question-${index}`;
    const inputId = `question-${index}-answer-${answerIndex}`;
    const inputValue = answerIndex + 1; // 1-based index for answers
    
    answerOption.innerHTML = `
      <div class="input-container">
        <input type="${inputType}" name="${inputName}" id="${inputId}" value="${inputValue}">
      </div>
      <label for="${inputId}">${answer}</label>
    `;
    
    answersContainer.appendChild(answerOption);
  });
  
  // Add submit button if standalone
  if (index === 0 && block.classList.contains('question')) {
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.classList.add('question-submit-button');
    submitButton.textContent = 'SUBMIT';
    questionDOM.appendChild(submitButton);
  }
  
  questionContainer.appendChild(questionDOM);
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
