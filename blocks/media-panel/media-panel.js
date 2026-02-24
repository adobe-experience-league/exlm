export default function decorate(block) {
    const [
        image,
        eyebrow,
        heading,
        description,
        cta,
        highlightHeading,
        highlightDescription
    ] = block.children || [];

    image.classList.add('image');
    eyebrow.classList.add('eyebrow');
    heading.classList.add('heading');
    description.classList.add('description');
    cta.classList.add('cta');
    highlightHeading.classList.add('highlight-heading');
    highlightDescription.classList.add('highlight-description');

    const highlightContainer = document.createElement('div');
    highlightContainer.classList.add('highlight-container');
    block.append(highlightContainer);
    highlightContainer.append(image, highlightHeading, highlightDescription);

    const contentContainer = document.createElement('div');
    contentContainer.classList.add('content-container');
    block.append(contentContainer);
    contentContainer.append(eyebrow, heading, description, cta);
}