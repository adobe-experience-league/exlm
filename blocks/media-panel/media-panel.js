import decorateCustomButtons from '../../scripts/utils/button-utils.js';

export default function decorate(block) {
  const [image, eyebrow, heading, description, cta, podcastHeading, podcastDescription] = block.children || [];

  image.classList.add('image');
  eyebrow.classList.add('eyebrow');
  const headingTag = document.createElement('h2');
  headingTag.classList.add('heading');
  headingTag.innerHTML = heading.textContent;
  heading.replaceWith(headingTag);
  description.classList.add('description');
  cta.classList.add('cta');
  const podcastHeadingTag = document.createElement('h3');
  podcastHeadingTag.classList.add('podcast-heading');
  podcastHeadingTag.innerHTML = podcastHeading.textContent;
  podcastHeading.replaceWith(podcastHeadingTag);
  podcastDescription.classList.add('podcast-description');

  const podcastContainer = document.createElement('div');
  podcastContainer.classList.add('podcast-container');
  block.append(podcastContainer);
  podcastContainer.append(image, podcastHeadingTag, podcastDescription);

  const contentContainer = document.createElement('div');
  contentContainer.classList.add('content-container');
  block.append(contentContainer);
  contentContainer.append(eyebrow, headingTag, description);
  cta.innerHTML = decorateCustomButtons(cta.firstElementChild);

  contentContainer.append(cta);

  if (!block.classList.contains('podcast-card')) {
    podcastHeadingTag.remove();
    podcastDescription.remove();
  }
}
