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
    const selectedAnswers = Array.from(questionElement.querySelectorAll('input[type="checkbox"]:checked')).map(
      (input) => parseInt(input.value, 10),
    );

    // Check if selected answers match correct answers
    return (
      selectedAnswers.length === correctAnswers.length &&
      selectedAnswers.every((answer) => correctAnswers.includes(answer))
    );
  }
  
  // For single choice questions
  const selectedAnswer = questionElement.querySelector('input[type="radio"]:checked');
  return selectedAnswer && correctAnswers.includes(parseInt(selectedAnswer.value, 10));
}

/**
 * Shows feedback for a question
 * @param {Element} questionElement The question element
 * @param {boolean} isCorrect Whether the answer is correct
 */
function showQuestionFeedback(questionElement, isCorrect) {
  // Create feedback element
  const feedbackElement = document.createElement('div');
  feedbackElement.classList.add('question-feedback');

  // Get custom feedback messages from data attributes
  const correctFeedback = questionElement.dataset.correctFeedback || 'Correct!';
  const incorrectFeedback = questionElement.dataset.incorrectFeedback || 'Incorrect';

  // Set feedback text and class
  feedbackElement.textContent = isCorrect ? correctFeedback : incorrectFeedback;
  feedbackElement.classList.add(isCorrect ? 'correct' : 'incorrect');

  // Append feedback after the form
  const form = questionElement.querySelector('.question-form');
  form.after(feedbackElement);
}

export default function decorate(block) {
  block.classList.add('quiz-container');
  const questionsContainer = document.createElement('div');
  questionsContainer.classList.add('questions-container');

  const questions = [...block.children];

  questions.forEach((question, index) => {
    // Set question index
    question.dataset.questionIndex = index.toString();

    // Generate the question DOM
    const questionDOM = generateQuestionDOM(question);

    // Create a form for each question
    const form = document.createElement('form');
    form.classList.add('question-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Check if the answer is correct
      const isCorrect = checkQuestionAnswer(question);

      // Show feedback
      showQuestionFeedback(question, isCorrect);

      // Disable submit button
      const submitButton = form.querySelector('.question-submit-button');
      submitButton.disabled = true;
    });

    // Create submit button for this question
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.classList.add('question-submit-button');
    submitButton.textContent = 'SUBMIT';

    question.textContent = '';

    // Add block classes
    question.classList.add('question', 'block');

    // Append the generated DOM to the question
    question.append(questionDOM);

    // Append the submit button to the form
    form.appendChild(submitButton);

    // Append the form to the question
    question.appendChild(form);

    // Move the question to the questions container
    questionsContainer.append(question);
  });

  // Clear the block and append the questions container
  block.textContent = '';
  block.appendChild(questionsContainer);
}
