const getDefaultEmbed = (url) => `<div class="video-frame">
    <iframe 
      src="${url.href}"
      style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;"
      allowfullscreen=""
      scrolling="no"
      allow="encrypted-media"
      title="Content from ${url.hostname}"
      loading="lazy">
    </iframe>
  </div>`;

const embedMpc = (url) => {
  const urlObject = new URL(url);
  return getDefaultEmbed(urlObject);
};

const loadEmbed = (block, link) => {
  if (block.classList.contains('embed-is-loaded')) {
    return;
  }

  const url = new URL(link);
  block.innerHTML = embedMpc(url);
  block.classList = 'block video-embed';
  block.classList.add('embed-is-loaded');
};

export default async function decorate(block) {
  const anchor = block.querySelector('a');
  if (!anchor) return;

  const { href } = anchor;
  block.textContent = '';

  if (href) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        loadEmbed(block, href);
      }
    });
    observer.observe(block);
  }
}
