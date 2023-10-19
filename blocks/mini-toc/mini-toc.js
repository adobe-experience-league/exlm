/*
 * Mini TOC Block
 *
 */

function removeIsActive() {

}

export default async function decorate(block) {

  const anchors = block.querySelectorAll("ul > li > a");

  // clicked counter
  let count = 0;

  // Add click event listener to each anchor; highlight 1st item
  Array.from(anchors).forEach(function (anchor, index) {
    if (index == 0) {
      anchor.classList.add('is-active');
    }
    anchor.addEventListener("click", function (event) {
      // find current is-active element and remove class
      const currentIsActiveElement = event.srcElement.parentElement.parentElement.querySelector('a.is-active')
      currentIsActiveElement.classList.remove('is-active');
      event.srcElement.classList.add('is-active');
    });
  });

  // Add focus event listener to ul
  const ulElement = block.querySelector(".mini-toc ul");
  ulElement.addEventListener("mouseover", function (event) {
    console.log("Clicked! count: " + ++count);
    event.srcElement.classList.add('scrollable');
  });

  // ulElement.addEventListener("mouseout", function (event) {
  //   console.log("Clicked! count: " + ++count);
  //   event.srcElement.classList.remove('scrollable');
  // });

}
