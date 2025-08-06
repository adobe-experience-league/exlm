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

  // Find the question block DOM and append feedback
  const questionBlock = questionElement.querySelector('.question-block');
  questionBlock.appendChild(feedbackElement);
}

/**
 * Submits the quiz and shows feedback for each question
 * @param {NodeList} questions The list of question elements
 */
function submitQuiz(questions) {
  // Check each question and show feedback
  questions.forEach((question) => {
    const isCorrect = checkQuestionAnswer(question);
    showQuestionFeedback(question, isCorrect);
  });
}

export default function decorate(block) {
  const questionsContainer = document.createElement('div');
  questionsContainer.classList.add('questions-container');

  const questions = [...block.children];

  // Set total questions count
  const totalQuestions = questions.length;

  questions.forEach((question, index) => {
    // Set question index and total questions
    question.dataset.questionIndex = index.toString();
    question.dataset.totalQuestions = totalQuestions.toString();

    // Generate the question DOM
    const questionDOM = generateQuestionDOM(question);

    question.textContent = '';

    // Add block classes
    question.classList.add('question', 'block');

    // Append the generated DOM to the question
    question.append(questionDOM);
    questionsContainer.append(question);
  });

  // Create a single submit button for the entire quiz
  const submitButton = document.createElement('button');
  submitButton.type = 'button';
  submitButton.classList.add('quiz-submit-button');
  submitButton.textContent = 'SUBMIT';
  submitButton.addEventListener('click', () => {
    submitQuiz(questions);
    submitButton.disabled = true;
  });

  // Clear the block and build the quiz structure
  block.textContent = '';
  block.appendChild(questionsContainer);
  block.appendChild(submitButton);
}
