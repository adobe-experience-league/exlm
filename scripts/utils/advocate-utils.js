/**
 * Maps a content-type designation to the icon name authored on the Champion page.
 * Falls back to a neutral document icon when no mapping exists.
 */
const CONTENT_TYPE_ICONS = {
  perspective: 'atomic-search-perspective',
  documentation: 'atomic-search-documentation',
  event: 'atomic-search-event',
  playlist: 'atomic-search-playlist',
  course: 'book',
  community: 'user',
};

/**
 * Maps a time-commitment designation to the icon name authored on the Champion page.
 */
const TIME_ICONS = {
  clock: 'time',
  checkmark: 'check-circle',
  video: 'play-outline',
};

export function getContentTypeIcon(contentType) {
  return CONTENT_TYPE_ICONS[contentType?.toLowerCase()?.trim()] || 'documentation';
}

export function getTimeIcon(timeType) {
  return TIME_ICONS[timeType?.toLowerCase()?.trim()] || 'time';
}

// Number of Champion-level rows that precede the associated-content card rows.
const CHAMPION_FIELD_ROWS = 6;

/**
 * Extract a single associated-content card from a child row of the advocate-bio block.
 * Row cells (in order): content type, title, description, time icon, time text, cta text, cta url.
 * @param {HTMLElement} row
 */
function extractAssociatedContent(row) {
  const cells = [...row.children];
  const cellText = (i) => cells[i]?.textContent.trim() ?? '';
  const linkHref = cells[6]?.querySelector('a')?.getAttribute('href');
  return {
    contentType: cellText(0),
    title: cellText(1),
    description: cellText(2),
    timeType: cellText(3),
    timeText: cellText(4),
    ctaText: cellText(5),
    ctaLink: linkHref ?? cellText(6),
  };
}

/**
 * Extract Champion / Advocate information from the advocate-bio block markup.
 * The block is a container: the first rows are the Champion identity fields and
 * the remaining rows are the associated-content cards (up to three).
 * @param {HTMLElement} block the `.advocate-bio` element
 */
export function extractAdvocateInfo(block) {
  const rows = [...block.children];
  const fieldEl = rows.slice(0, CHAMPION_FIELD_ROWS).map((row) => row.firstElementChild);
  const contentRows = rows.slice(CHAMPION_FIELD_ROWS);
  const profileLink = fieldEl[2]?.querySelector('a')?.getAttribute('href') ?? fieldEl[2]?.textContent.trim() ?? '';
  return {
    image: fieldEl[0]?.querySelector('img')?.getAttribute('src') ?? '',
    name: fieldEl[1]?.textContent.trim() ?? '',
    profileLink,
    title: fieldEl[3]?.textContent.trim() ?? '',
    productDesignation: fieldEl[4]?.textContent.trim() ?? '',
    quote: fieldEl[5]?.textContent.trim() ?? '',
    associatedContent: contentRows.map(extractAssociatedContent),
  };
}

/**
 * Determines whether a Champion has enough data to be displayed.
 * Per the acceptance criteria: every field except the description/quote must
 * be populated. We treat name, title, product designation, image and profile
 * link as required, and require at least one complete associated-content card.
 * @param {ReturnType<typeof extractAdvocateInfo>} info
 */
export function isAdvocateComplete(info) {
  if (!info) return false;
  const requiredChampionFields = [info.image, info.name, info.profileLink, info.title, info.productDesignation];
  if (requiredChampionFields.some((field) => !field)) return false;
  const hasCompleteCard = info.associatedContent.some(
    (card) => card.contentType && card.title && card.ctaLink && card.ctaText,
  );
  return hasCompleteCard;
}

/**
 * Fetch and parse a Champion page's advocate-bio block.
 * @param {HTMLAnchorElement|string} anchor
 */
export async function fetchAdvocateInfo(anchor) {
  const link = typeof anchor === 'string' ? anchor : anchor?.href;
  if (!link) return null;
  try {
    const response = await fetch(link);
    if (!response.ok) return null;
    const html = await response.text();
    const htmlDoc = new DOMParser().parseFromString(html, 'text/html');
    const advocateEl = htmlDoc.querySelector('.advocate-bio');
    if (!advocateEl) return null;
    return extractAdvocateInfo(advocateEl);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching advocate info:', error);
    return null;
  }
}
