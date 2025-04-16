import { loadScript } from '../../scripts/lib-franklin.js';
import { htmlToElement, getPathDetails, getConfig } from '../../scripts/scripts.js';
import { filterIconSvg, nextNavigationArrow, previousNavigationArrow } from './icons.js';
import atomicFacetHandler from './atomic-facet.js';
import atomicResultHandler from './atomic-result.js';
import atomicSortDropdownHandler from './atomic-sort-dropdown.js';
import atomicFacetManagerHandler from './atomic-facet-manager.js';
import atomicQuerySummaryHandler from './atomic-query-summary.js';
import atomicBreadBoxHandler from './atomic-breadbox.js';
import atomicPagerHandler from './atomic-pager.js';

async function initiateCoveoAtomicSearch() {
  return new Promise((resolve, reject) => {
    loadScript('https://static.cloud.coveo.com/atomic/v3.13.0/atomic.esm.js', { type: 'module' })
      .then(async () => {
        resolve(true);
      })
      .catch((e) => {
        reject(e);
      });
  });
}

const viewIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12.812" height="9" viewBox="0 0 12.812 9">
  <g id="Group_170753" data-name="Group 170753" transform="translate(-468 -243.839)">
    <path id="Path_102994" data-name="Path 102994" d="M13.1,6.507a6.1,6.1,0,0,0-2.69-.668C6.882,5.839,4,9.347,4,10.486c0,1.219,3.034,4.353,6.381,4.353,3.374,0,6.432-3.132,6.432-4.353C16.812,9.524,15.1,7.5,13.1,6.507Zm-2.69,7.584a3.752,3.752,0,1,1,3.752-3.752A3.752,3.752,0,0,1,10.406,14.091Z" transform="translate(464 238)" fill="#6e6e6e"/>
    <path id="Path_102995" data-name="Path 102995" d="M10.2,9.648A1.085,1.085,0,0,1,9.113,8.563a1.068,1.068,0,0,1,.549-.925,2,2,0,0,0-.549-.085,2.059,2.059,0,1,0,2.059,2.061,1.922,1.922,0,0,0-.071-.486A1.068,1.068,0,0,1,10.2,9.648Z" transform="translate(465.293 238.726)" fill="#6e6e6e"/>
  </g>
</svg>
`;

const likeIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
  <g id="Icon" transform="translate(-4 -4)">
    <g id="Canvas" transform="translate(4 4)" fill="#6e6e6e" stroke="#6e6e6e" stroke-width="1" opacity="0">
      <rect width="16" height="16" stroke="none"/>
      <rect x="0.5" y="0.5" width="15" height="15" fill="none"/>
    </g>
    <path id="Path_102991" data-name="Path 102991" d="M13.375,5.448l-2.911,0a9.544,9.544,0,0,0,.356-2.7A1.69,1.69,0,0,0,9.409,1,1.479,1.479,0,0,0,7.951,2.406C7.742,4.431,5.616,6.079,4.5,6.572a.44.44,0,0,0-.388-.239H1.444A.444.444,0,0,0,1,6.778v7.111a.444.444,0,0,0,.444.444H4.111a.444.444,0,0,0,.444-.444v-.444h6.42a2.06,2.06,0,0,0,1.834-1.077L14.58,7.356a1.333,1.333,0,0,0-1.2-1.908Zm.4,1.522-1.785,5.047a.819.819,0,0,1-.774.548l-6.662-.009V7.489C5.83,6.976,8.622,5.033,8.84,2.422a.611.611,0,0,1,.569-.533c.271,0,.5.33.521.861a6.688,6.688,0,0,1-.776,3.583h4.222a.444.444,0,0,1,.4.636Z" transform="translate(3.889 3.889)" fill="#6e6e6e"/>
  </g>
</svg>
`;

const shareIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
  <g id="Icon" transform="translate(-7 -7)">
    <g id="Canvas" transform="translate(7 7)" fill="#6e6e6e" stroke="#6e6e6e" stroke-width="1" opacity="0">
      <rect width="12" height="12" stroke="none"/>
      <rect x="0.5" y="0.5" width="11" height="11" fill="none"/>
    </g>
    <path id="Path_102996" data-name="Path 102996" d="M5.343,4H5V2.267A.267.267,0,0,0,4.733,2h0a.262.262,0,0,0-.187.079L1.069,5.821a.267.267,0,0,0,0,.357L4.545,9.921A.262.262,0,0,0,4.731,10,.267.267,0,0,0,5,9.735V8a6.57,6.57,0,0,1,6.264,2.27.223.223,0,0,0,.4-.133C11.667,9.151,10.577,4,5.343,4Z" transform="translate(6.667 6.333)" fill="#6e6e6e"/>
  </g>
</svg>
`;

const handleHeaderSearchVisibility = () => {
  const exlHeader = document.querySelector('exl-header');
  if (exlHeader) {
    exlHeader.addEventListener('search-decorated', () => {
      const searchElement = exlHeader.shadowRoot.querySelector('.search');
      searchElement.style.visibility = 'hidden';
    });
  }
};

export default function decorate(block) {
  // const [heading, placeholder] = [...block.children].map((row) => row.firstElementChild);
  const handleAtomicLibLoad = async () => {
    await customElements.whenDefined('atomic-search-interface');
    const searchInterface = document.querySelector('atomic-search-interface');
    const { coveoOrganizationId } = getConfig();

    // Initialization
    await searchInterface.initialize({
      accessToken: window.exlm.config.coveoToken,
      organizationId: coveoOrganizationId,
    });

    // Trigger a first search
    searchInterface.executeFirstSearch();

    //     observer.observe(resultListWrapper.shadowRoot, { childList: true, subtree: true })
    //   }
    // });
    Promise.all([
      customElements.whenDefined('atomic-result-list'),
      customElements.whenDefined('atomic-result'),
      customElements.whenDefined('atomic-result-multi-value-text'),
      customElements.whenDefined('atomic-search-box'),
      customElements.whenDefined('atomic-facet'),
      customElements.whenDefined('atomic-query-summary'),
      customElements.whenDefined('atomic-breadbox'),
      customElements.whenDefined('atomic-pager'),
    ]).then(() => {
      atomicFacetHandler();
      atomicResultHandler();
      atomicSortDropdownHandler();
      atomicFacetManagerHandler();
      atomicQuerySummaryHandler();
      atomicBreadBoxHandler();
      atomicPagerHandler();

      handleHeaderSearchVisibility();
    });
  };
  const { lang: languageCode } = getPathDetails();

  const atomicUIElements = htmlToElement(`
    <atomic-search-interface language=${languageCode} fields-to-include='["@foldingchild","@foldingcollection","@foldingparent","author","author_bio_page","author_name","author_type","authorname","authortype","collection","connectortype","contenttype","date","documenttype","el_author_type","el_contenttype","el_id","el_interactionstyle","el_kudo_status","el_lirank","el_product","el_rank_icon","el_reply_status","el_solution","el_solutions_authored","el_type","el_usergenerictext","el_version","el_view_status","exl_description","exl_thumbnail","filetype","id","language","liMessageLabels","liboardinteractionstyle","licommunityurl","lithreadhassolution","objecttype","outlookformacuri","outlookuri","permanentid","role","source","sourcetype","sysdocumenttype","type","urihash","video_url", "sysdate", "el_kudo_status"]'>
    <style>
      atomic-search-layout {
        grid-template-columns: 0 18% 72% 0 !important;
        grid-column-gap: 16px;
      }
      atomic-search-layout atomic-layout-section[section="search"] {
        width: 100% !important;
        max-width: 100% !important;
        margin-bottom: 16px !important;
        @media(max-width: 1024px) {
          margin-bottom: 0 !important;
        }
      }
      atomic-search-layout atomic-layout-section[section='pagination'] {
        flex-direction: column;
        gap: 20px;
        justify-content: center;
        align-items: center;
        @media(min-width: 1024px) {
          flex-direction: row;
        }
      }
    </style>
    <atomic-search-layout>
      <div class="header-bg"></div>
      <atomic-layout-section section="search">
        <style>
          atomic-search-layout atomic-layout-section[section='status'] {
            position: relative;
            @media(max-width: 1024px) {
              position: relative;
              gap: 12px;
              grid-template-columns: 1fr;
              grid-template-areas:
                "atomic-sort"
                "atomic-breadbox";
            }
          }
          atomic-search-interface:not(.atomic-search-interface-no-results, .atomic-search-interface-error) atomic-search-layout {
            grid-template-areas: 
              ". .                      atomic-section-search ."
              ". atomic-section-facets  atomic-section-main   ."
              ". atomic-section-facets  .                     ." !important;

            @media(max-width: 1024px) {
              grid-template-areas: 
              "atomic-section-search"
              "atomic-section-main" !important;
              grid-template-columns: 1fr !important;
            }

          }
          atomic-layout-section[section='search'] {
              margin-bottom: 36px !important;
          }
          atomic-search-box::part(wrapper) {
            height: 32px;
            border: 2px solid #8E8E8E;
            border-radius: 4px 4px 0 0;
            position: relative;
          }
          atomic-search-box::part(textarea) {
            padding: 2px 16px 6px;
          }
          atomic-search-box::part(textarea-expander) {
            margin-left: 16px;
          }
          atomic-search-box::part(textarea) {
            font-size: 14px;
            color: #505050;
          }
          atomic-search-box::part(query-suggestion-item) {
            font-size: 14px;
            color: #505050;
          }
          atomic-search-box::part(clear-button) {
            background: #D2D2D2;
            border-radius: 100%;
            height: 18px;
            width: 18px;
          }
          atomic-search-box::part(clear-icon)  {
            color: white;
            stroke-width: 2.5px;
            transform: scale(0.6);
          }
          atomic-search-box::part(submit-button) {
            transform: scale(0.8);
            position: absolute;
            left: 0;
          }
          atomic-search-box::part(suggestions-wrapper) {
            background-color: white;
            border: 1px solid #CACACA;
          }
          atomic-search-box::part(textarea-spacer) {
            display: none;
          }
          .atomic-search-wrapper {
            width: 100%;
          }
          .atomic-search-wrapper *{
            box-sizing: border-box;
          }
          .atomic-search-wrapper atomic-search-box {
            width: 100%;
          }
          .search-box-wrapper {
            display:flex;
            gap: 16px;
            margin-left: 0;
            grid-area: search-box;
          }
          atomic-search-box {
            width: 100%;
            max-width: calc(100vw - 40px);
            @media(min-width: 1024px) {
              width: 90%;
            }
          }
        </style>
        <div class="atomic-search-wrapper">
          <div class="search-box-wrapper">
            <atomic-search-box
              suggestion-timeout="5000"
              number-of-queries="8"
            >
              <atomic-search-box-query-suggestions></atomic-search-box-query-suggestions>
            </atomic-search-box>
          </div>
        </div>
      </atomic-layout-section>
      <atomic-layout-section section="facets">
        <style>
           atomic-layout-section[section='facets'] {
            border-right: 2px solid #E1E1E1;
            border-top: 1px solid #E1E1E1;
            border-radius: 1px;
            background: #F5F5F5;
          }
          .facet-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 40px 20px 12px;
            border-bottom: 2px solid #E1E1E1;
          }
          .filter-label {
            color: #404040;
            font-size: 16px;
            font-weight: bold;
          }
          .clear-label {
            font-size: 12px;
            color: #767676;
            
          }
          .clear-label.clear-btn-enabled {
            color: #1473E6;
            cursor: pointer;
          }
        </style>
        <div class="facet-header">
          <div class="filter-label">
            <label>Filters</label>
          </div>
          <div class="clear-label">
            <label>Clear All</label>
          </div>
        </div>
        <atomic-facet-manager>
          <style>
            atomic-facet {
              border-bottom: 2px solid #E1E1E1;
              border-radius: 1px;
            }
            atomic-facet::part(facet), atomic-facet::part(placeholder) {
                border: none;
            }
            atomic-facet::part(search-wrapper) {
              display: none;
            }
            atomic-facet::part(label-button) {
              font-weight: 700;
              color: #4B4B4B;
              justify-content: flex-end;
              flex-direction: row-reverse;
              gap: 16px;
            }
            atomic-facet::part(label-button-icon) {
              margin-left: 0;
            }
            atomic-facet::part(values) {
              grid-template-columns: 1fr;
              gap: 0;
              margin-top: 0;
            }
            atomic-facet::part(show-more) {
              color: #4B4B4B;
            }
            atomic-facet::part(value-label) {
              width: auto;
            }
            atomic-facet::part(value-count) {
              width: auto;
              margin: 0;
            }
            atomic-facet::part(value-box) {
              border: none;
              display: flex;
              gap: 4px;
              padding: 4px 0;
              color: #4B4B4B;
            }
            atomic-facet::part(value-checkbox) {
              border: 2px solid #959595;
              border-radius: 2px;
            }
            atomic-facet::part(value-checkbox-checked) {
              background-color: #6E6E6E;
              border-color: #6E6E6E;
            }
            atomic-facet::part(value-count) {
              color: #505050;
            }
            atomic-facet::part(value-label) {
              margin-right: 4px;
              color: #505050;
            }
            atomic-facet::part(clear-button) {
              display: none;
            }
          </style>
          <atomic-facet
              field="el_contenttype"
              label="Content Type"
              display-values-as="checkbox"
            ></atomic-facet>
          <atomic-facet
            field="el_product"
            label="Product"
            display-values-as="checkbox"
          ></atomic-facet>
          <atomic-facet
            field="el_role"
            label="Role"
            display-values-as="checkbox"
          ></atomic-facet>
          
        
        </atomic-facet-manager>
      </atomic-layout-section>
      <atomic-layout-section section="main">
        <style>
          atomic-layout-section[section='main'] {
            padding-left: 36px;
            border-top: 1px solid #E1E1E1;
            @media(max-width: 1024px) {
              padding-left: 0;
            }
          }
        </style>
        <atomic-layout-section>
          <style>
            atomic-layout-section {
              position: relative;
              @media(max-width: 1024px) {
                // max-width: calc(100% - 40px);
                overflow-x: hidden;
              }
            }
          </style>
          <atomic-query-summary id="query-summary">
            <div id="custom-summary"></div>
            <style>
              atomic-query-summary {
                color: #2C2C2C;
                font-size: 18px;
                margin: 16px 0 20px;
              }
              .result-query {
                display: flex;
                flex-direction: column;
              }
            </style>
          </atomic-query-summary>
        </atomic-layout-section>
        <atomic-layout-section section="status">
          <style>
            atomic-layout-section {
              position: relative;
            }
            .mobile-only #mobile-filter-btn {
              display: block;
              position: absolute;
              left: 0;
              top: 4px;
              height: 32px;
              width: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #EAEAEA;
              border-radius: 4px;

              @media(min-width: 1024px) {
                display: none;
              }
            }
          </style>
          <atomic-breadbox>
            <style>
              atomic-breadbox::part(label) {
                font-size: 12px;
                color: #4B4B4B;
              }
              atomic-breadbox::part(container) {
                max-width: calc(100% - 80px);
              }
              atomic-breadbox::part(breadcrumb-list) {
                gap: 8px;
                max-width: 100%;
              }
              atomic-breadbox::part(breadcrumb-button) {
                border: 1px solid #959595;
                border-radius: 4px;
                color: #6E6E6E;
                font-size: 12px;
                line-height: 15px;
              }
              atomic-breadbox::part(show-more), atomic-breadbox::part(show-less), atomic-breadbox::part(clear) {
                border: 1px solid #959595;
                border-radius: 4px;
                color: #6E6E6E;
                height: 32px;
                padding: 0 8px;
              }
              @media(min-width: 1024px) {
                atomic-breadbox::part(clear) {
                  display: none;
                }
                atomic-breadbox::part(container) {
                  max-width: 100%;
                }
              }
            </style>
          </atomic-breadbox>
          <div class="mobile-only">
            <button id="mobile-filter-btn">
              ${filterIconSvg}
            </button>
          </div>
          <atomic-sort-dropdown>
            <style>
              atomic-sort-dropdown::part(select-separator) {
                border: none;
              }
              atomic-sort-dropdown::part(select) {
                border: 1px solid #CACACA;
                border-radius: 4px;
                color: #6E6E6E;
              }
              atomic-sort-dropdown::part(label) {
                font-size: 12px;
                color: #6E6E6E;
                margin-left: 0;
              }
              atomic-sort-dropdown::part(select-separator) {
                color: #6E6E6E;
              }
            </style>
            <atomic-sort-expression
              label="relevance"
              expression="relevancy"
            ></atomic-sort-expression>
            <atomic-sort-expression
              label="most-recent"
              expression="date descending"
            ></atomic-sort-expression>
          </atomic-sort-dropdown>
          <atomic-did-you-mean></atomic-did-you-mean>
        </atomic-layout-section>
        <atomic-layout-section section="results">
          <style>
            atomic-result-list::part(result-list) {
              margin: 16px 0 32px;
            }
            atomic-result-list::part(outline) {
              padding-left: 0;
              padding-right: 0;
            }
            .result-header-section {
              display: none;
              margin: 8px 0;
              padding: 8px 0;
              gap: 16px;
              border-bottom: 0.5px solid #EAEAEA;
              margin-left: -36px;
              padding-left: 72px;
            }
            .result-header-item {
              font-size: 11px;
              color: #707070;
            }
            @media(min-width: 1024px) {
              .result-header-section {
                display: grid;
                grid-template-columns: 1.5fr 0.5fr 0.6fr 0.4fr;
              }
            }
          </style>
          <div class="result-header-section desktop-only">
            <div class="result-header-item">
              <label>NAME</label>
            </div>
            <div class="result-header-item">
              <label>CONTENT TYPE</label>
            </div>
            <div class="result-header-item">
              <label>PRODUCT</label>
            </div>
            <div class="result-header-item">
              <label>UPDATED</label>
            </div>
          </div>
          <atomic-result-list id="coveo-results-list-wrapper">
            <style>
              atomic-result-list::part(outline)::before {
                background-color: #E1E1E1;
              }
            </style>
            <atomic-result-template>
              <template>
              <style>
                .result-root {
                  @media(max-width: 1024px) {
                    max-width: calc(100% - 40px);
                  }
                }
                .result-item {
                  display: none;
                  gap: 16px;
                  margin-left: 32px;
                }
                .result-item.mobile-only {
                  display: flex;
                  flex-direction: column;
                  gap: 2px;
                  margin-left: 0;
                }
                @media(min-width: 1024px) {
                  .result-item.desktop-only {
                    display: grid;
                    grid-template-columns: 1.5fr 0.5fr 0.6fr 0.4fr;
                  }
                  .result-item.mobile-only {
                    display: none;
                  }
                }
                
                atomic-result-section-excerpt, atomic-result-text {
                  font-size: 12px;
                  color: #505050;
                }
                atomic-result-section-excerpt {
                  color: #959595 !important;
                  font-size: 11px !important;
                  display: -webkit-box;
                  -webkit-line-clamp: 2; 
                  -webkit-box-orient: vertical;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  margin: 6px 0 4px;
                  max-width: 90vw;
                }
                atomic-result-section-excerpt atomic-result-text {
                  color: #959595 !important;
                  font-size: 11px !important;
                }
                .result-title atomic-result-text, .mobile-result-title atomic-result-text {
                  font-size: 14px;
                  color: #323232;
                  font-weight: bold;
                  display: -webkit-box;
                  -webkit-line-clamp: 1; 
                  -webkit-box-orient: vertical;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  max-width: 90vw;
                }
                .result-content-type {
                  display: flex;
                  justify-content: flex-start;
                }
                .result-content-type atomic-result-multi-value-text::part(result-multi-value-text-list) {
                  margin: 0 8px 0 0;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  flex-wrap: wrap;
                }
                .result-content-type atomic-result-multi-value-text::part(result-multi-value-text-value) {
                  border: 1px solid var(--content-type-color);
                  border-radius: 4px;
                  padding: 4px 8px;
                  width: fit-content;
                  font-size: 12px;
                  white-space: pre;
                  color: var(--content-type-color);
                  display: flex;
                  align-items: center;
                  flex-direction: row-reverse;
                  gap: 4px;
                }
                .result-content-type atomic-result-multi-value-text::part(result-multi-value-text-separator) {
                  display: none;
                }
                .result-product atomic-result-multi-value-text::part(result-multi-value-text-value) {
                  font-size: 14px;
                  color: #707070;
                  display: block;
                }
                .result-product atomic-result-multi-value-text::part(result-multi-value-text-list) {
                  flex-wrap: wrap;
                  gap: 4px;
                }
                .result-product atomic-result-multi-value-text::part(result-multi-value-text-separator) {
                  display: none;
                }
                .result-updated {
                  font-size: 14px;
                  color: #707070;
                  text-align: left;
                }
                atomic-result-link {
                  position: relative;
                  color: #1E76E3;
                  font-size: 11px !important;
                  cursor: pointer;
                }
                atomic-result-link > a:not([slot="label"]) {
                  position: absolute;
                  left: 0;
                }
                atomic-result-link > a > atomic-result-text {
                  visibility: hidden
                }
                .result-icons-wrapper {
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  margin: 2px 0;
                }
                .result-icon-item {
                  display: flex;
                  gap: 2px;
                  align-items: center;
                }
                .icon-text {
                  font-size: 11px;
                  color: #6E6E6E;
                  font-weight: bold;
                }
                .mobile-result-info {
                  display: flex;
                  align-items: center;
                  gap: 12px;
                }
                .mobile-result-title atomic-result-text {
                  font-size: 16px  !important;
                  font-weight: bold !important;
                  color: #2C2C2C !important;
                }
                .mobile-result-info .result-field atomic-result-multi-value-text, .mobile-result-info .atomic-result-date, .mobile-result-info .result-product atomic-result-multi-value-text::part(result-multi-value-text-value) {
                  color: #707070;
                  font-size: 12px;
                }
                .mobile-result-info .result-content-type atomic-result-multi-value-text::part(result-multi-value-text-value) {
                  padding: 0;
                }
                .mobile-description atomic-result-section-excerpt atomic-result-text {
                  font-size: 12px !important;
                  color: #959595 !important;
                }

                 atomic-result-multi-value-text::part(result-multi-value-text-value)::first-child {
                  background: red;
                 }
              </style>
              <div class="result-item mobile-only">
                <div class="mobile-result-title">
                  <atomic-result-text field="title" should-highlight="false"></atomic-result-text>
                </div>
                <div class="mobile-result-info">
                  <div class="result-field result-content-type">
                    <atomic-result-multi-value-text field="el_contenttype">
                    </atomic-result-multi-value-text>
                  </div>
                  <div class="result-field result-product">
                      <atomic-result-multi-value-text field="el_product">
                      </atomic-result-multi-value-text>
                  </div>
                  <div class="result-field result-updated">
                      <atomic-result-date field="sysdate">
                          <atomic-format-date format="LL" locale="en-US"></atomic-format-date>
                      </atomic-result-date>
                  </div>
                </div>
                <div class="mobile-description">
                  <atomic-result-section-excerpt>
                    <atomic-result-text field="excerpt" should-highlight="false"></atomic-result-text>
                  </atomic-result-section-excerpt>
                </div>
              </div>
              <div class="result-item desktop-only">
                <div class="result-field">
                    <div class="result-title">
                      <atomic-result-text field="title" should-highlight="false"></atomic-result-text>
                    </div>
                    <div class="result-icons-wrapper">
                      <div class="result-icon-item">
                        ${viewIconSvg}
                        <span class="icon-text">
                          <atomic-result-number field="score" number-format="decimal"></atomic-result-number>
                        </span>
                      </div>
                      <div class="result-icon-item">
                        ${likeIconSvg}
                        <span class="icon-text">
                          <atomic-result-number field="score" number-format="decimal"></atomic-result-number>
                        </span>
                      </div>
                      <div class="result-icon-item">
                        ${shareIconSvg}
                        <span class="icon-text">
                          <atomic-result-number field="score" number-format="decimal"></atomic-result-number>
                        </span>
                      </div>
                    </div>
                    <div>
                      <atomic-result-section-excerpt>
                        <atomic-result-text field="excerpt" should-highlight="false"></atomic-result-text>
                      </atomic-result-section-excerpt>
                    </div>
                    <div>
                      <atomic-result-link>
                        <span slot="label">Quick View</span>
                      </atomic-result-link>
                    </div>
                </div>
                <div class="result-field result-content-type">
                    <atomic-result-multi-value-text field="el_contenttype">
                    </atomic-result-multi-value-text>
                </div>
                <div class="result-field result-product">
                    <atomic-result-multi-value-text field="el_product">
                    </atomic-result-multi-value-text>
                </div>
                <div class="result-field result-updated">
                      <atomic-result-date field="sysdate">
                          <atomic-format-date format="LL" locale="en-US"></atomic-format-date>
                      </atomic-result-date>
                </div>
              </div>
            </template>
            </atomic-result-template>
          </atomic-result-list>
          <atomic-query-error></atomic-query-error>
          <atomic-no-results></atomic-no-results>
        </atomic-layout-section>
        <atomic-layout-section section="pagination">
          <style>
            atomic-layout-section[section='pagination'] {
              border-top: 1px solid #EAEAEA;
              padding: 40px 0;
              margin-top: -8px;
            }
            atomic-pager::part(active-page-button) {
              border: none;
              background-color: #EAEAEA;
            }
            atomic-pager::part(next-button), atomic-pager::part(previous-button) {
              border: none;
              padding: 4px 12px;
            }
            atomic-pager::part(next-button-icon), atomic-pager::part(previous-button-icon) {
              width: 25px;
              padding-top: 3px;
            }
            atomic-pager::part(previous-button-icon):disabled {
              visibility: hidden;
            }
          </style>
          <atomic-pager
            previous-button-icon="${previousNavigationArrow}"
            next-button-icon="${nextNavigationArrow}"
          ></atomic-pager>
          <style>
            atomic-results-per-page::part(button)  {
              color: #6E6E6E;
              background-color: #FFFFFF;
              font-size: 15px;
            }
            atomic-results-per-page::part(active-button) {
              border: none;
              border-radius: 4px;
              background-color: #EAEAEA;
            }
            atomic-results-per-page::part(label) {
              color: #4B4B4B;
              font-size: 15px;
            }
            atomic-pager::part(page-button) {
              background-color: #FFFFFF;
              border: 1px solid #EAEAEA;
              border-radius: 4px;
              color: #4B4B4B;
              height: 26px;
              width: 26px;
            }
            atomic-pager::part(active-page-button) {
              background-color: #EAEAEA;
            }
            atomic-pager::part(previous-button), atomic-pager::part(next-button) {
              height: 26px;
              color: #4B4B4B;
              padding: 0;
              width: 25px;
              min-width: 25px;
            }
            @media(max-width: 1024px) {
               atomic-pager::part(previous-button), atomic-pager::part(next-button) {
                transform: scale(0.7);
              }
            }
          </style>
          <atomic-results-per-page></atomic-results-per-page>
        </atomic-layout-section>
      </atomic-layout-section>
    </atomic-search-layout>
  </atomic-search-interface>
  `);
  initiateCoveoAtomicSearch().then(handleAtomicLibLoad);
  block.appendChild(atomicUIElements);
}
