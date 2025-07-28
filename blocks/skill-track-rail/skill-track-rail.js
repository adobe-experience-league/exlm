function addNavigationButtons() {
  // Check if navigation already exists
  const existingNav = document.querySelector('.lesson-navigation-section');
  if (existingNav) {
    return; // Navigation already exists, don't create another
  }
  
  // Create navigation section
  const navSection = document.createElement('div');
  navSection.classList.add('section', 'lesson-navigation-section');
  
  // Create navigation container
  const navContainer = document.createElement('div');
  navContainer.classList.add('lesson-navigation');
  
  // Create previous button
  const prevButton = document.createElement('button');
  prevButton.classList.add('lesson-nav-button', 'prev-lesson');
  prevButton.textContent = 'Previous lesson';
  
  // Create next button
  const nextButton = document.createElement('button');
  nextButton.classList.add('lesson-nav-button', 'next-lesson');
  nextButton.textContent = 'Next lesson';
  
  // Add buttons to container
  navContainer.appendChild(prevButton);
  navContainer.appendChild(nextButton);
  
  // Add container to section
  navSection.appendChild(navContainer);
  
  // Insert navigation section before the rail sections
  const main = document.querySelector('main');
  const railSections = main.querySelectorAll('.learning-collection-rail-section, .skill-track-rail-section');
  
  if (railSections.length > 0) {
    // Insert before the first rail section
    main.insertBefore(navSection, railSections[0]);
  } else {
    // If no rail sections, append to end
    main.appendChild(navSection);
  }
} 

/**
 * loads and decorates the skill track rail
 * @param {Element} block The skill track rail block element
 */
export default async function decorate(block) {
  // Add dummy content for now
  block.innerHTML = `
    <div class="rail-content">
      <h3>Skill Track</h3>
      <div class="skill-item">
        <strong>Fundamentals</strong>
        <p>Basic concepts and terminology</p>
        <div class="skill-progress">
          <div class="skill-progress-bar" style="width: 100%"></div>
        </div>
      </div>
      <div class="skill-item">
        <strong>Intermediate</strong>
        <p>Advanced techniques and workflows</p>
        <div class="skill-progress">
          <div class="skill-progress-bar" style="width: 75%"></div>
        </div>
      </div>
      <div class="skill-item">
        <strong>Expert</strong>
        <p>Master-level skills and optimization</p>
        <div class="skill-progress">
          <div class="skill-progress-bar" style="width: 25%"></div>
        </div>
      </div>
      <div class="skill-item">
        <strong>Certification</strong>
        <p>Official recognition and validation</p>
        <div class="skill-progress">
          <div class="skill-progress-bar" style="width: 0%"></div>
        </div>
      </div>
    </div>
  `;

  // Add navigation buttons to content sections
  addNavigationButtons();
}

