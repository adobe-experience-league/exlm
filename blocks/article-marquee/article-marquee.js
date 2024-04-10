const mobileSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1003.8 2167.2" style="display:none;" class="article-marquee-bg article-marquee-bg-mobile">
    <path d="M1002.1 269.1C969 236.1 791.2 44.9 501.8 46.9c-283 2-465.9 188-500.2 222.2.1 583.4-.1 1314.7 0 1898.1h1001l-.4-1898.1Z" style="stroke-width:0"/>
    <path d="M991 196.7C936.1 146.8 766.6 2.1 501.8 2.5c-256.6.4-437 151.4-492.5 198" style="fill:none;stroke:#000;stroke-dasharray:0 0 10.1 10.1;stroke-miterlimit:10;stroke-width:5px"/>
</svg>
`;

const tabletSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1998.2 1003.8" style="display:none;" class="article-marquee-bg article-marquee-bg-tablet">
    <path d="M251.4 1.7C221 34.8 45.1 212.6 46.9 501.9c1.8 283 173 466 204.4 500.3 536.9-.1 1209.9.1 1746.8 0V1.2l-1746.7.5Z" style="stroke-width:0"/>
    <path d="M196.7 12.8C146.8 67.7 2.1 237.2 2.5 501.9c.4 256.7 151.4 437.1 198 492.6" style="fill:none;stroke:#000;stroke-dasharray:0 0 10.1 10.1;stroke-miterlimit:10;stroke-width:5px"/>
</svg>
`;

const desktopSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1990 1002.5" style="display:none;" class="article-marquee-bg article-marquee-bg-desktop">
    <path d="M77.2.4C85.3 121.5 117.5 355.9 267 602c125.4 206.4 279.6 332.4 375 399h1348V0L77.2.4Z" style="stroke-width:0"/>
    <path d="M512.5 1000.5c-84-66.9-187.4-165.2-280-303-185.7-276.3-222-553.9-230-696" style="fill:none;stroke:#000;stroke-dasharray:0 0 10 10;stroke-miterlimit:10;stroke-width:5px"/>
</svg>
`;

/**
 * @param {HTMLElement} block
 */
export default function ArticleMarquee(block) {
  const el = block.querySelector(":scope > div > div:nth-child(2)");
  el.insertAdjacentHTML("afterbegin", desktopSvg);
  el.insertAdjacentHTML("afterbegin", tabletSvg);
  el.insertAdjacentHTML("afterbegin", mobileSvg);
}
