export default async function decorate(block) {
  block.innerHTML = `
    <div class="rail-content">
      <div class="nav-item">
        <div class="nav-icon"></div>
        <span class="nav-text">Collections Home</span>
      </div>
    </div>
  `;
}
