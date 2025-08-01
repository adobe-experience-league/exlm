/**
 * Quiz component that can contain multiple question components
 */
export default function decorate(block) {
  // Add quiz container class
  block.classList.add('quiz-container');
  
  // Create a form element to wrap all questions
  const form = document.createElement('form');
  form.classList.add('quiz-form');
  
  // Move all children to the form
  while (block.firstChild) {
    form.appendChild(block.firstChild);
  }
  
  // Add submit button
  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.classList.add('quiz-submit-button');
  submitButton.textContent = 'SUBMIT';
  form.appendChild(submitButton);
  
  // Add form to block
  block.appendChild(form);
  
  // Handle form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get all question blocks
    const questionBlocks = form.querySelectorAll('.question-container');
    let score = 0;
    let totalQuestions = questionBlocks.length;
    
    // Check each question
    questionBlocks.forEach((questionBlock) => {
      const isCorrect = checkAnswer(questionBlock);
      if (isCorrect) {
        score += 1;
        questionBlock.classList.add('correct');
      } else {
        questionBlock.classList.add('incorrect');
      }
    });
    
    // Show results
    const resultDiv = document.createElement('div');
    resultDiv.classList.add('quiz-result');
    resultDiv.innerHTML = `<p>Your score: ${score}/${totalQuestions}</p>`;
    
    // Check if results already exist
    const existingResult = block.querySelector('.quiz-result');
    if (existingResult) {
      block.replaceChild(resultDiv, existingResult);
    } else {
      block.appendChild(resultDiv);
    }
    
    // Disable form after submission
    submitButton.disabled = true;
    
    // Re-enable after 3 seconds
    setTimeout(() => {
      submitButton.disabled = false;
    }, 3000);
  });
  
  /**
   * Check if the answer for a question is correct
   * @param {HTMLElement} questionBlock - The question block element
   * @returns {boolean} - Whether the answer is correct
   */
  function checkAnswer(questionBlock) {
    const isMultipleChoice = questionBlock.classList.contains('multiple-choice');
    const correctAnswers = questionBlock.dataset.correctAnswers.split(',').map(num => parseInt(num.trim(), 10));
    
    if (isMultipleChoice) {
      // For multiple choice, all correct options must be selected and no incorrect options
      const checkboxes = questionBlock.querySelectorAll('input[type="checkbox"]');
      let allCorrect = true;
      
      checkboxes.forEach((checkbox, index) => {
        const isCorrectOption = correctAnswers.includes(index + 1);
        if ((checkbox.checked && !isCorrectOption) || (!checkbox.checked && isCorrectOption)) {
          allCorrect = false;
        }
      });
      
      return allCorrect;
    } else {
      // For single choice, only one option can be selected
      const radioButtons = questionBlock.querySelectorAll('input[type="radio"]');
      let selectedIndex = -1;
      
      radioButtons.forEach((radio, index) => {
        if (radio.checked) {
          selectedIndex = index + 1;
        }
      });
      
      return correctAnswers.includes(selectedIndex);
    }
  }
}
