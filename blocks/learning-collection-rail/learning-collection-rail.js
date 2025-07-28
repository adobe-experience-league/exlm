/**
 * loads and decorates the learning collection rail
 * @param {Element} block The learning collection rail block element
 */
export default async function decorate(block) {
  // Add navigation menu content
  block.innerHTML = `
    <div class="rail-content">
      <div class="nav-item">
        <div class="nav-icon"></div>
        <span class="nav-text">My Homepage</span>
      </div>
      <div class="nav-item">
        <div class="nav-icon"></div>
        <span class="nav-text">Collections Home</span>
      </div>
      <div class="nav-item">
        <div class="nav-icon"></div>
        <span class="nav-text">Bookmarks</span>
      </div>
    </div>
  `;
} 