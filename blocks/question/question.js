/**
 * Question component for quizzes
 */
export default function decorate(block) {
  // Get the question data from the block
  const rows = Array.from(block.children);
  
  // Extract question text from the first row
  const questionText = rows[0]?.textContent.trim() || 'Question';
  
  // Extract isMultipleChoice from the second row
  const isMultipleChoice = rows[1]?.textContent.trim().toLowerCase() === 'true';
  
  // Extract answers from the third row (should be an ordered list)
  const answersRow = rows[2];
  let answersList = [];
  
  if (answersRow) {
    const orderedList = answersRow.querySelector('ol');
    if (orderedList) {
      answersList = Array.from(orderedList.querySelectorAll('li')).map(li => li.innerHTML);
    } else {
      // If no ordered list is found, try to extract text content
      answersList = [answersRow.textContent.trim()];
    }
  }
  
  // Extract correct answers from the fourth row
  const correctAnswersText = rows[3]?.textContent.trim() || '';
  
  // Clear the block content
  block.innerHTML = '';
  
  // Add question container class
  block.classList.add('question-container');
  if (isMultipleChoice) {
    block.classList.add('multiple-choice');
  } else {
    block.classList.add('single-choice');
  }
  
  // Store correct answers as data attribute
  block.dataset.correctAnswers = correctAnswersText;
  
  // Create question header
  const questionHeader = document.createElement('div');
  questionHeader.classList.add('question-header');
  
  const questionTitle = document.createElement('h3');
  questionTitle.classList.add('question-title');
  questionTitle.innerHTML = questionText;
  questionHeader.appendChild(questionTitle);
  
  block.appendChild(questionHeader);
  
  // Create answers container
  const answersContainer = document.createElement('div');
  answersContainer.classList.add('answers-container');
  
  // Create form elements for answers
  const inputType = isMultipleChoice ? 'checkbox' : 'radio';
  const inputName = `question-${Math.random().toString(36).substring(2, 9)}`;
  
  answersList.forEach((answer, index) => {
    const answerWrapper = document.createElement('div');
    answerWrapper.classList.add('answer-wrapper');
    
    const input = document.createElement('input');
    input.type = inputType;
    input.name = inputName;
    input.id = `${inputName}-${index}`;
    input.value = index + 1;
    
    const label = document.createElement('label');
    label.setAttribute('for', `${inputName}-${index}`);
    label.innerHTML = answer;
    
    answerWrapper.appendChild(input);
    answerWrapper.appendChild(label);
    answersContainer.appendChild(answerWrapper);
  });
  
  block.appendChild(answersContainer);
}
