import decorateCustomButtons from '../../scripts/utils/button-utils.js';

export default function decorate(block) {
  const [image, eyebrow, heading, description, cta, podcastHeading, podcastDescription] = block.children || [];

  image.classList.add('image');
  eyebrow.classList.add('eyebrow');
  heading.classList.add('heading');
  description.classList.add('description');
  cta.classList.add('cta');
  podcastHeading.classList.add('podcast-heading');
  podcastDescription.classList.add('podcast-description');

  const podcastContainer = document.createElement('div');
  podcastContainer.classList.add('podcast-container');
  block.append(podcastContainer);
  podcastContainer.append(image, podcastHeading, podcastDescription);

  const contentContainer = document.createElement('div');
  contentContainer.classList.add('content-container');
  block.append(contentContainer);
  contentContainer.append(eyebrow, heading, description);
  cta.innerHTML = decorateCustomButtons(cta.firstElementChild);

  contentContainer.append(cta);

  if (!block.classList.contains('podcast-card')) {
    podcastHeading.remove();
    podcastDescription.remove();
  }
}
