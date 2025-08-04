import { generateQuestionDOM } from '../question/question.js';

/**
 * Decorates the quiz block
 * @param {Element} block The quiz block element
 */
export default function decorate(block) {
  // Add quiz container class
  block.classList.add('quiz-container');
  
  // Check for any specific classes that might be applied to the quiz
  const hasCustomStyle = block.classList.contains('custom-style');
  const quizTheme = [...block.classList].find(cls => cls.startsWith('theme-'));
  const isCompactQuiz = block.classList.contains('compact');
  
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
  
  // Create a container for all questions
  const questionsContainer = document.createElement('div');
  questionsContainer.classList.add('questions-container');
  
  // Get all question blocks (children of the quiz block)
  const questions = [...block.children];
  
  // Process each question
  questions.forEach((question, index) => {
    // Generate the question DOM
    const questionDOM = generateQuestionDOM(question, index);
    
    // Add the question to the questions container
    questionsContainer.appendChild(questionDOM);
  });
  
  // Create submit button
  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.classList.add('quiz-submit-button');
  submitButton.textContent = 'SUBMIT';
  
  // Append all elements to the form
  form.appendChild(questionsContainer);
  form.appendChild(submitButton);
  
  // Clear the block and append the form
  block.textContent = '';
  block.appendChild(form);
}
