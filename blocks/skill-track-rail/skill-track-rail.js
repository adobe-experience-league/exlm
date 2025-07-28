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
  prevButton.classList.add('lesson-nav-button', 'prev-lesson', 'secondary');
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
  // Add skill track content
  block.innerHTML = `
    <div class="rail-content">
      <div class="collection-name">COLLECTION NAME</div>
      <h1 class="skill-track-title">Skill Track Title Lorem Ipsum</h1>
      <p class="skill-track-description">[Skill Track Description] Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna.</p>
      
      <hr class="divider">
      
      <div class="bookmark-section">
        <span class="bookmark-icon">🔖</span>
        <span class="bookmark-text">Bookmark this resource</span>
      </div>
      
      <div class="module-section">
        <h3 class="module-title">In this module</h3>
        <ul class="module-list">
          <li>Documentation Article Title Ipsum Dolor Sit Amet</li>
          <li class="current-lesson"><strong>Video Tutorial Title Ipsum Dolor</strong></li>
          <li>Documentation Article Title Ipsum Dolor Sit Amet</li>
          <li>Documentation Article Title Ipsum Dolor Sit Amet</li>
          <li>Skill Track Review</li>
        </ul>
      </div>
      
      <div class="progress-section">
        <div class="progress-bar">
          <div class="progress-fill" style="width: 50%"></div>
        </div>
        <div class="progress-text">2 of 4 Lessons Complete</div>
      </div>
    </div>
  `;

  // Add navigation buttons to content sections
  addNavigationButtons();
}

