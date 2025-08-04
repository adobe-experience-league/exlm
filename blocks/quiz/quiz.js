import { generateQuestionDOM } from '../question/question.js';

export default function decorate(block) {
  // Add quiz container class
  block.classList.add('quiz-container');
  
  // Create a form element to wrap all questions
  const form = document.createElement('form');
  form.classList.add('quiz-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // Form submission can be handled by external scripts
  });
  
  // Get all question blocks (children of the quiz block)
  const questions = [...block.children];
  
  // Create a container for all questions
  const questionsContainer = document.createElement('div');
  questionsContainer.classList.add('questions-container');
  
  // Loop through all question blocks
  questions.forEach((question) => {
    // Generate the question DOM
    const questionDOM = generateQuestionDOM(question);
    
    // Empty the content, keep root element with UE instrumentation
    question.textContent = '';
    
    // Add block classes
    question.classList.add('question', 'block');
    
    // Append the generated DOM to the question
    question.append(questionDOM);
    
    // Move the question to the questions container
    questionsContainer.append(question);
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
