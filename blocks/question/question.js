/**
 * Question component for quizzes
 */
export default function decorate(block) {
  // Add question container class
  block.classList.add('question-container');
  
  // Hide the 4th div (correctAnswers) in every question
  const divs = block.querySelectorAll(':scope > div');
  if (divs.length >= 4) {
    divs[3].style.display = 'none';
  }
  
  // Get the question data from the block
  const questionText = block.querySelector('[name="question"]').textContent.trim();
  const isMultipleChoice = block.querySelector('[name="isMultipleChoice"]')?.textContent.trim() === 'true';
  const answersHtml = block.querySelector('[name="answers"]').innerHTML;
  const correctAnswersText = block.querySelector('[name="correctAnswers"]').textContent.trim();
  
  // Parse correct answers
  const correctAnswers = correctAnswersText.split(',').map(num => parseInt(num.trim(), 10));
  
  // Create the question element
  const questionElement = document.createElement('div');
  questionElement.classList.add('question-text');
  questionElement.textContent = questionText;
  
  // Create a separator line
  const separator = document.createElement('hr');
  separator.classList.add('question-separator');
  
  // Create the answers container
  const answersContainer = document.createElement('div');
  answersContainer.classList.add('answers-container');
  
  // Parse the answers from the HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = answersHtml;
  const answerItems = tempDiv.querySelectorAll('li');
  
  // Create the answers list with radio buttons or checkboxes
  const answersList = document.createElement('ul');
  answersList.classList.add('answers-list');
  
  answerItems.forEach((item, index) => {
    const answerItem = document.createElement('li');
    answerItem.classList.add('answer-item');
    
    const inputId = `question-${Date.now()}-answer-${index}`;
    
    // Create radio button or checkbox
    const input = document.createElement('input');
    input.type = isMultipleChoice ? 'checkbox' : 'radio';
    input.id = inputId;
    input.name = `question-${Date.now()}`;
    input.value = index + 1;
    input.classList.add('answer-input');
    
    // Create label for the input
    const label = document.createElement('label');
    label.htmlFor = inputId;
    label.classList.add('answer-label');
    label.innerHTML = item.innerHTML;
    
    // Add input and label to the answer item
    answerItem.appendChild(input);
    answerItem.appendChild(label);
    answersList.appendChild(answerItem);
  });
  
  // Add the answers list to the answers container
  answersContainer.appendChild(answersList);
  
  // Create submit button
  const submitButton = document.createElement('button');
  submitButton.classList.add('question-submit-btn');
  submitButton.textContent = 'SUBMIT';
  
  // Create feedback element
  const feedbackElement = document.createElement('div');
  feedbackElement.classList.add('question-feedback');
  feedbackElement.style.display = 'none';
  
  // Add event listener to the submit button
  submitButton.addEventListener('click', () => {
    // Get selected answers
    const selectedInputs = answersContainer.querySelectorAll('input:checked');
    const selectedAnswers = Array.from(selectedInputs).map(input => parseInt(input.value, 10));
    
    // Check if any answer is selected
    if (selectedAnswers.length === 0) {
      feedbackElement.textContent = 'Please select an answer.';
      feedbackElement.className = 'question-feedback warning';
      feedbackElement.style.display = 'block';
      return;
    }
    
    // Check if the answer is correct
    let isCorrect = false;
    
    if (isMultipleChoice) {
      // For multiple choice, all correct answers must be selected and no incorrect answers
      isCorrect = 
        selectedAnswers.length === correctAnswers.length && 
        selectedAnswers.every(answer => correctAnswers.includes(answer));
    } else {
      // For single choice, the selected answer must be in the correct answers
      isCorrect = correctAnswers.includes(selectedAnswers[0]);
    }
    
    // Update feedback
    if (isCorrect) {
      feedbackElement.textContent = 'Correct!';
      feedbackElement.className = 'question-feedback correct';
      block.classList.add('correct');
    } else {
      feedbackElement.textContent = 'Incorrect. Try again.';
      feedbackElement.className = 'question-feedback incorrect';
      block.classList.add('incorrect');
    }
    
    feedbackElement.style.display = 'block';
    
    // Disable inputs after submission
    answersContainer.querySelectorAll('input').forEach(input => {
      input.disabled = true;
    });
    
    // Disable submit button
    submitButton.disabled = true;
    
    // Dispatch event to notify the quiz component
    const event = new CustomEvent('question-answered', {
      bubbles: true,
      detail: { isCorrect }
    });
    block.dispatchEvent(event);
  });
  
  // Clear the block content
  block.innerHTML = '';
  
  // Add the elements to the block
  block.appendChild(questionElement);
  block.appendChild(separator);
  block.appendChild(answersContainer);
  block.appendChild(submitButton);
  block.appendChild(feedbackElement);
}
