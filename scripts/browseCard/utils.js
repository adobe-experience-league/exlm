export const generateContributorsMarkup = (contributor) => {
  const { name, thumbnail, level, date } = contributor;
  const contributorElement = document.createDocumentFragment();
  const img = document.createElement('img');
  img.src = thumbnail;
  contributorElement.appendChild(img);
  const namePlate = document.createElement('div');
  namePlate.classList.add('card-name-plate');
  contributorElement.appendChild(namePlate);
  const nameElement = document.createElement('span');
  nameElement.classList.add('card-contributor-name');
  nameElement.textContent = name;
  namePlate.appendChild(nameElement);

  const levelElement = document.createElement('div');
  levelElement.classList.add('card-contributor-level');
  const levelNum = document.createElement('span');
  levelNum.textContent = `L${level}`;
  const levelVal = document.createElement('span');
  levelVal.textContent = `Level ${level}`;
  levelElement.appendChild(levelNum);
  levelElement.appendChild(levelVal);
  namePlate.appendChild(levelElement);

  const dateElement = document.createElement('span');
  dateElement.textContent = date;
  namePlate.appendChild(dateElement);

  return contributorElement;
};

export const buildCardContent = (card, model) => {
  const { description, contentType: type, viewLinkText, viewLink, copyLink, tags, contributor, eventDateTime } = model;
  const contentType = type.toLowerCase();
  const cardContent = card.querySelector('.card-content');
  const cardFooter = card.querySelector('.card-footer');
  const { matches: isDesktopResolution } = window.matchMedia('(min-width: 900px)');

  if (description) {
    const stringContent = description.length > 100 ? `${description.substring(0, 100).trim()}...` : description;
    const descriptionElement = document.createElement('p');
    descriptionElement.classList.add('card-description-text');
    descriptionElement.textContent = stringContent;
    cardContent.appendChild(descriptionElement);
  }

  const cardMeta = document.createElement('div');
  cardMeta.classList.add('card-meta-info');

  if (contentType === 'course') {
    tags.forEach((tag) => {
      const { icon: iconName, text } = tag;
      const anchor = document.createElement('a');
      anchor.classList.add('card-meta-anchor');
      const span = document.createElement('span');
      span.classList.add('icon', `icon-${iconName}`);
      anchor.textContent = text;
      anchor.appendChild(span);

      cardMeta.appendChild(anchor);
    });
  }
  if (isDesktopResolution) {
    cardContent.appendChild(cardMeta);
  } else {
    const titleEl = card.querySelector('.card-title-text');
    cardContent.insertBefore(cardMeta, titleEl);
  }

  if (contentType === 'community') {
    const contributorInfo = document.createElement('div');
    contributorInfo.classList.add('card-contributor-info');
    const contributorElement = generateContributorsMarkup(contributor);
    contributorInfo.appendChild(contributorElement);

    tags.forEach((tag) => {
      const { icon: iconName, text } = tag;
      if (iconName) {
        const anchor = document.createElement('a');
        anchor.classList.add('card-meta-anchor');
        const span = document.createElement('span');
        span.classList.add('icon', `icon-${iconName}`);
        anchor.textContent = text || '100';
        anchor.appendChild(span);
        cardMeta.appendChild(anchor);
      }
    });

    cardContent.insertBefore(contributorInfo, cardMeta);
  }

  if (contentType.includes('event') && eventDateTime) {
    const startDate = new Date(eventDateTime);
    const dateInfo = new Date(startDate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const hrs = dateInfo.getHours();

    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);
    const endDateInfo = new Date(endDate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const weekday = dateInfo.toLocaleDateString('en-US', { weekday: 'long' });
    const month = dateInfo.toLocaleDateString('en-US', { month: 'long' });
    let dateString = `<h6>${weekday}, ${month} ${dateInfo.getDate()}</h6>`;

    const dayDuration = hrs < 12 ? 'AM' : 'PM';
    const startHours = hrs === 0 ? 12 : hrs % 12;

    const endHrs = endDateInfo.getHours();
    const endHours = endHrs === 0 ? 12 : endHrs % 12;
    const enddayDuration = endHrs < 12 ? 'AM' : 'PM';
    const time = `${startHours}:${dateInfo
      .getMinutes()
      .toString()
      .padStart(2, '0')} ${dayDuration} - ${endHours}:${endDateInfo
      .getMinutes()
      .toString()
      .padStart(2, '0')} ${enddayDuration} PDT`;
    dateString += `<h6>${time}</h6>`;
    const eventInfo = document.createElement('div');
    eventInfo.classList.add('card-event-info');
    eventInfo.innerHTML = `<span class="icon icon-time"></span>`;
    const dateElement = document.createElement('div');
    dateElement.classList.add('card-event-time');
    dateElement.innerHTML = dateString;
    eventInfo.appendChild(dateElement);
    const title = card.querySelector('.card-title-text');
    cardContent.insertBefore(eventInfo, title.nextElementSibling);
  }

  const cardOptions = document.createElement('div');
  cardOptions.classList.add('card-options');
  if (copyLink) {
    cardOptions.innerHTML = `<a href="${copyLink}"><span class="icon icon-copy"></span></a>`;
  }
  cardOptions.innerHTML += `<a><span class="icon icon-bookmark"></span></a>`;

  const anchorLink = document.createElement('a');
  anchorLink.classList.add('card-cta-element');
  anchorLink.target = '_blank';
  let icon = null;
  if (contentType === 'tutorial') {
    icon = 'play';
  } else if (contentType.includes('event')) {
    icon = 'new-tab';
  }
  if (icon) {
    anchorLink.innerHTML = `${viewLinkText || ''} <span class="icon icon-${icon}"></span>`;
  } else {
    anchorLink.innerText = viewLinkText || '';
  }
  anchorLink.href = viewLink;
  cardFooter.appendChild(cardOptions);
  cardFooter.appendChild(anchorLink);
};

export const setupCopyAction = (wrapper) => {
  Array.from(wrapper.querySelectorAll('.icon.icon-copy')).forEach((svg) => {
    const anchor = svg.parentElement;
    if (anchor?.href) {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        navigator.clipboard
          .writeText(anchor.href)
          .then(() => {})
          .catch(() => {
            // noop
          });
      });
    }
  });
};
