import { loadCSS } from "../lib-franklin.js";

loadCSS(`${window.hlx.codeBasePath}/scripts/shimmer/shimmer.css`); // load placeholder css dynamically

export default class Shimmer {
    constructor() {
      this.shimmer = document.createElement('div');
      this.shimmer.className = 'shimmer';
      const loader = document.createElement("span")
      loader.classList.add("loader")
      this.shimmer.append(loader)
    }

    add(container){
      this.container = container;
      this.container.classList.add("shimmer-container");
      this.container.append(this.shimmer);
      console.log(container)
    }

    remove(){
      this.container.classList.remove("shimmer-container");
      this.shimmer.remove();
    }
}


  