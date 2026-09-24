import{h as r}from"./p-5925f187.js";import{r as t}from"./p-8f5830b4.js";
/*!
 * escape-html
 * Copyright(c) 2012-2013 TJ Holowaychuk
 * Copyright(c) 2015 Andreas Lubbe
 * Copyright(c) 2015 Tiancheng "Timothy" Gu
 * MIT Licensed
 */var e=/["'&<>]/;var a=n;function n(r){var t=""+r;var a=e.exec(t);if(!a){return t}var n;var s="";var o=0;var c=0;for(o=a.index;o<t.length;o++){switch(t.charCodeAt(o)){case 34:n="&quot;";break;case 38:n="&amp;";break;case 39:n="&#39;";break;case 60:n="&lt;";break;case 62:n="&gt;";break;default:continue}if(c!==o){s+=t.substring(c,o)}c=o+1;s+=n}return c!==o?s+t.substring(c,o):s}function s(r,t){const e=r.query!=="";const a=!r.values.length&&!t.values.length;const n=!r.isLoading&&t.isLoading;if(e&&a){return n}return true}function o(r){const t=r.query!=="";const e=r.isLoading;const a=!!r.values.length;if(!t){return false}if(a){return true}return!e}function c(r,e=""){const n=a(r);if(e.trim()===""){return n}const s=new RegExp(`(${t(a(e))})`,"i");return a(r).replace(s,'<span part="search-highlight" class="font-bold">$1</span>')}const u=t=>r("span",{title:t.displayValue,part:"value-label",class:`value-label peer-hover:text-error truncate ${t.isSelected||!!t.isExcluded?"font-bold":""}`,innerHTML:c(t.displayValue,t.searchQuery)});export{u as F,o as a,a as e,s};
//# sourceMappingURL=p-3827ecb1.js.map