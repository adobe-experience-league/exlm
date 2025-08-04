import { generateQuestionDOM } from '../question/question.js';

/**
 * Checks if the selected answers for a question are correct
 * @param {Element} questionElement The question element
 * @returns {boolean} Whether the selected answers are correct
 */
function checkQuestionAnswer(questionElement) {
  const correctAnswers = questionElement.dataset.correctAnswers.split(',').map(Number);
  const isMultipleChoice = questionElement.dataset.isMultipleChoice === 'true';
  
  if (isMultipleChoice) {
    // For multiple choice questions
    const selectedAnswers = Array.from(questionElement.querySelectorAll('input[type="checkbox"]:checked'))
      .map(input => parseInt(input.value, 10));
    
    // Check if selected answers match correct answers
    return selectedAnswers.length === correctAnswers.length && 
      selectedAnswers.every(answer => correctAnswers.includes(answer));
  } else {
    // For single choice questions
    const selectedAnswer = questionElement.querySelector('input[type="radio"]:checked');
    return selectedAnswer && correctAnswers.includes(parseInt(selectedAnswer.value, 10));
  }
}

/**
 * Shows feedback for a question
 * @param {Element} questionElement The question element
 * @param {boolean} isCorrect Whether the answer is correct
 */
function showQuestionFeedback(questionElement, isCorrect) {
  // Get or create feedback element
  let feedbackElement = questionElement.querySelector('.question-feedback');
  if (!feedbackElement) {
    feedbackElement = document.createElement('div');
    feedbackElement.classList.add('question-feedback');
    questionElement.querySelector('.question-block').appendChild(feedbackElement);
  }
  
  // Get custom feedback messages from data attributes
  const correctFeedback = questionElement.dataset.correctFeedback || 'Correct!';
  const incorrectFeedback = questionElement.dataset.incorrectFeedback || 'Incorrect';
  
  // Set feedback text and class
  feedbackElement.textContent = isCorrect ? correctFeedback : incorrectFeedback;
  feedbackElement.classList.add(isCorrect ? 'correct' : 'incorrect');
  feedbackElement.style.display = 'block';
}

export default function decorate(block) {
  // Add quiz container class
  block.classList.add('quiz-container');
  
  // Create a form element to wrap all questions
  const form = document.createElement('form');
  form.classList.add('quiz-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Check answers for each question
    const questions = form.querySelectorAll('.question');
    let correctCount = 0;
    let totalQuestions = questions.length;
    
    questions.forEach((question) => {
      const isCorrect = checkQuestionAnswer(question);
      showQuestionFeedback(question, isCorrect);
      
      if (isCorrect) {
        correctCount++;
      }
    });
    
    // Display overall results
    let resultsContainer = form.querySelector('.quiz-results');
    if (!resultsContainer) {
      resultsContainer = document.createElement('div');
      resultsContainer.classList.add('quiz-results');
      form.appendChild(resultsContainer);
    }
    
    resultsContainer.textContent = `You got ${correctCount} out of ${totalQuestions} questions correct.`;
    resultsContainer.style.display = 'block';
    
    // Disable submit button
    const submitButton = form.querySelector('.quiz-submit-button');
    submitButton.disabled = true;
    
    // Add reset button if it doesn't exist
    if (!form.querySelector('.quiz-reset-button')) {
      const resetButton = document.createElement('button');
      resetButton.type = 'button';
      resetButton.classList.add('quiz-reset-button');
      resetButton.textContent = 'Try Again';
      resetButton.addEventListener('click', () => {
        // Reset all inputs
        form.querySelectorAll('input').forEach(input => {
          input.checked = false;
        });
        
        // Hide all feedback
        form.querySelectorAll('.question-feedback').forEach(feedback => {
          feedback.textContent = '';
          feedback.style.display = 'none';
          feedback.classList.remove('correct', 'incorrect');
        });
        
        // Hide results
        resultsContainer.style.display = 'none';
        
        // Enable submit button
        submitButton.disabled = false;
        
        // Remove reset button
        resetButton.remove();
      });
      
      form.appendChild(resetButton);
    }
  });
  
  // Get all question blocks (children of the quiz block)
  const questions = [...block.children];
  
  // Create a container for all questions
  const questionsContainer = document.createElement('div');
  questionsContainer.classList.add('questions-container');
  
  // Loop through all question blocks
  questions.forEach((question, index) => {
    // Set question index
    question.dataset.questionIndex = index.toString();
    
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
