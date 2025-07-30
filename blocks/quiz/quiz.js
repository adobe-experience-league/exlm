/**
 * Quiz component that contains multiple questions
 */
export default function decorate(block) {
  // Add quiz container class
  block.classList.add('quiz-container');
  
  // Add a title to the quiz if provided
  const rows = [...block.children];
  if (rows.length > 0) {
    const titleRow = rows[0];
    if (titleRow.children.length > 0) {
      const titleText = titleRow.children[0].textContent.trim();
      if (titleText) {
        const titleElement = document.createElement('h2');
        titleElement.classList.add('quiz-title');
        titleElement.textContent = titleText;
        
        // Insert the title at the beginning of the block
        block.insertBefore(titleElement, block.firstChild);
        
        // Remove the title row as it's now displayed as a proper heading
        titleRow.remove();
      }
    }
  }
  
  // Add a submit quiz button
  const submitQuizButton = document.createElement('button');
  submitQuizButton.classList.add('quiz-submit-btn');
  submitQuizButton.textContent = 'Submit Quiz';
  submitQuizButton.style.display = 'none'; // Initially hidden
  
  // Add a score display container that will be updated when all questions are answered
  const scoreContainer = document.createElement('div');
  scoreContainer.classList.add('quiz-score-container');
  scoreContainer.style.display = 'none'; // Initially hidden
  
  // Create score display
  const scoreDisplay = document.createElement('div');
  scoreDisplay.classList.add('quiz-score');
  scoreContainer.appendChild(scoreDisplay);
  
  // Add event listener to update score when questions are answered
  block.addEventListener('question-answered', () => {
    // Check if all questions have been answered
    const questionBlocks = block.querySelectorAll('.question-container');
    const answeredQuestions = block.querySelectorAll('.question-container.correct, .question-container.incorrect');
    
    if (questionBlocks.length === answeredQuestions.length) {
      // All questions have been answered, show the score
      const correctAnswers = block.querySelectorAll('.question-container.correct').length;
      const totalQuestions = questionBlocks.length;
      
      scoreDisplay.textContent = `Your Score: ${correctAnswers} / ${totalQuestions}`;
      scoreContainer.style.display = 'block';
      
      // Show a message based on the score
      const scorePercentage = (correctAnswers / totalQuestions) * 100;
      const scoreMessage = document.createElement('div');
      scoreMessage.classList.add('quiz-score-message');
      
      if (scorePercentage === 100) {
        scoreMessage.textContent = 'Perfect! You got all questions correct!';
        scoreMessage.classList.add('perfect-score');
      } else if (scorePercentage >= 80) {
        scoreMessage.textContent = 'Great job! You did very well!';
        scoreMessage.classList.add('great-score');
      } else if (scorePercentage >= 60) {
        scoreMessage.textContent = 'Good effort! Keep learning!';
        scoreMessage.classList.add('good-score');
      } else {
        scoreMessage.textContent = 'Keep practicing! You\'ll get better!';
        scoreMessage.classList.add('needs-improvement');
      }
      
      scoreContainer.appendChild(scoreMessage);
      
      // Add a retry button
      const retryButton = document.createElement('button');
      retryButton.classList.add('quiz-retry-btn');
      retryButton.textContent = 'Retry Quiz';
      retryButton.addEventListener('click', () => {
        // Reset all questions
        questionBlocks.forEach(questionBlock => {
          questionBlock.classList.remove('correct', 'incorrect');
          const inputs = questionBlock.querySelectorAll('input');
          inputs.forEach(input => {
            input.checked = false;
            input.disabled = false;
          });
          
          const submitBtn = questionBlock.querySelector('.question-submit-btn');
          if (submitBtn) {
            submitBtn.disabled = false;
          }
          
          const feedback = questionBlock.querySelector('.question-feedback');
          if (feedback) {
            feedback.style.display = 'none';
          }
        });
        
        // Hide score container
        scoreContainer.style.display = 'none';
        
        // Remove score message and retry button
        if (scoreMessage.parentNode) {
          scoreMessage.remove();
        }
        if (retryButton.parentNode) {
          retryButton.remove();
        }
      });
      
      scoreContainer.appendChild(retryButton);
    }
  });
  
  // Append the score container to the quiz block
  block.appendChild(scoreContainer);
}
