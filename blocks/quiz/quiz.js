import { generateQuestionDOM } from '../question/question.js';

/**
 * Decorates the quiz block
 * @param {Element} block The quiz block element
 */
export default function decorate(block) {
  // Extract all divs from the block
  const allDivs = [...block.querySelectorAll(':scope > div')];
  
  // Check for any specific classes that might be applied to the quiz
  const hasCustomStyle = block.classList.contains('custom-style');
  const quizTheme = [...block.classList].find(cls => cls.startsWith('theme-'));
  const isCompactQuiz = block.classList.contains('compact');
  
  // Add quiz container class
  block.classList.add('quiz-container');
  
  // Create a form element to wrap all questions
  const form = document.createElement('form');
  form.classList.add('quiz-form');
  
  // Add any additional classes from the block
  if (hasCustomStyle) form.classList.add('custom-style');
  if (quizTheme) form.classList.add(quizTheme);
  if (isCompactQuiz) form.classList.add('compact');
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // Form submission can be handled by external scripts
  });
  
  // Create quiz DOM structure
  const quizDOM = document.createRange().createContextualFragment(`
    <div class="questions-container"></div>
    <button type="submit" class="quiz-submit-button">SUBMIT</button>
  `);
  
  // Process each question
  const questionsContainer = quizDOM.querySelector('.questions-container');
  allDivs.forEach((question, index) => {
    // Generate the question DOM
    const questionDOM = generateQuestionDOM(question, index);
    
    // Add the question to the questions container
    questionsContainer.appendChild(questionDOM);
  });
  
  // Append all elements to the form
  form.appendChild(quizDOM);
  
  // Clear the block and append the form
  block.textContent = '';
  block.appendChild(form);
}
