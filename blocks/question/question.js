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
  let correctFeedback = 'Correct!';
  let incorrectFeedback = 'Incorrect';
  
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
    } else if (rowIndex === 4) {
      // Fifth row contains the correct feedback message
      correctFeedback = row.textContent.trim() || 'Correct!';
    } else if (rowIndex === 5) {
      // Sixth row contains the incorrect feedback message
      incorrectFeedback = row.textContent.trim() || 'Incorrect';
    }
  });
  
  // Store values as data attributes for potential future use
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
    
    // Create input element
    const input = document.createElement('input');
    input.type = isMultipleChoice ? 'checkbox' : 'radio';
    input.name = `question-${block.dataset.questionIndex || 0}`;
    input.id = `question-${block.dataset.questionIndex || 0}-answer-${answerIndex}`;
    input.value = answerIndex + 1; // 1-based index for answers
    answerOption.appendChild(input);
    
    // Create label element
    const label = document.createElement('label');
    label.htmlFor = input.id;
    label.textContent = answer;
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
  // Set a question index for standalone questions
  block.dataset.questionIndex = '0';
  
  // Generate the question DOM
  const dom = generateQuestionDOM(block);
  
  // Clear the block and append the DOM
  block.textContent = '';
  block.append(dom);
  
  // Add submit button if standalone
  if (block.classList.contains('question')) {
    const form = document.createElement('form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Check if the answer is correct
      const correctAnswers = block.dataset.correctAnswers.split(',').map(Number);
      const isMultipleChoice = block.dataset.isMultipleChoice === 'true';
      let isCorrect = false;
      
      if (isMultipleChoice) {
        // For multiple choice questions
        const selectedAnswers = Array.from(block.querySelectorAll('input[type="checkbox"]:checked'))
          .map(input => parseInt(input.value, 10));
        
        // Check if selected answers match correct answers
        isCorrect = selectedAnswers.length === correctAnswers.length && 
          selectedAnswers.every(answer => correctAnswers.includes(answer));
      } else {
        // For single choice questions
        const selectedAnswer = block.querySelector('input[type="radio"]:checked');
        isCorrect = selectedAnswer && correctAnswers.includes(parseInt(selectedAnswer.value, 10));
      }
      
      // Show feedback
      const feedbackElement = block.querySelector('.question-feedback');
      feedbackElement.textContent = isCorrect ? block.dataset.correctFeedback : block.dataset.incorrectFeedback;
      feedbackElement.classList.add(isCorrect ? 'correct' : 'incorrect');
      feedbackElement.style.display = 'block';
      
      // Disable submit button
      const submitButton = block.querySelector('.question-submit-button');
      submitButton.disabled = true;
    });
    
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.classList.add('question-submit-button');
    submitButton.textContent = 'SUBMIT';
    
    form.appendChild(submitButton);
    block.appendChild(form);
  }
}
