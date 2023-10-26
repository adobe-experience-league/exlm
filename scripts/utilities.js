// Desktop Only (1025px onwards)
export const isDesktop = window.matchMedia('(min-width: 1025px)');

// Mobile Only (Until 1024px)
export const isMobile = window.matchMedia('(max-width: 1024px)');

// Fetching fragment data
export const fetchContent = async (url) => {
  const response = await fetch(url);
  if (response.ok) {
    const responseData = response.text();
    return responseData;
  }
  throw new Error(`${url} not found`);
};

// Removing extra div from a parent container
export const cleanUpDivElems = (sel, tag) => {
  const tagType = sel.querySelector(tag);
  if (tagType) {
    sel.innerHTML = tagType.outerHTML;
  }
};

export const isMobileResolution = () => {
  const { matches: isMobileRes } = window.matchMedia('(max-width: 900px)');
  return isMobileRes;
};
