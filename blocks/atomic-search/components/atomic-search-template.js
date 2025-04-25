import { htmlToElement, getPathDetails } from '../../../scripts/scripts.js';
import { nextNavigationArrow, previousNavigationArrow } from './atomic-search-icons.js';

const getCoveoAtomicMarkup = (placeholders) => {
  const { lang: languageCode } = getPathDetails();
  const atomicUIElements = htmlToElement(`
        <atomic-search-interface language=${languageCode} fields-to-include='["@foldingchild","@foldingcollection","@foldingparent","author","author_bio_page","author_name","author_type","authorname","authortype","collection","connectortype","contenttype","date","documenttype","el_author_type","el_contenttype","el_id","el_interactionstyle","el_kudo_status","el_lirank","el_product","el_rank_icon","el_reply_status","el_solution","el_solutions_authored","el_type","el_usergenerictext","el_version","el_view_status","exl_description","exl_thumbnail","filetype","id","language","liMessageLabels","liboardinteractionstyle","licommunityurl","lithreadhassolution","objecttype","outlookformacuri","outlookuri","permanentid","role","source","sourcetype","sysdocumenttype","type","urihash","video_url", "sysdate", "el_kudo_status"]'>
        <style>
        atomic-search-layout {
          // background-color: var(--spectrum-gray-900);
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
                height: 40px;
                border: none;
                border-bottom: 2px solid var(--footer-border-color);
                border-radius: 4px 4px 0 0;
                position: relative;
              }
              atomic-search-box::part(textarea) {
                display: flex;
                padding: 6px 16px 6px;
                font-size: 16px !important;
                align-content: center;

                @media(max-width: 1024px) {
                  font-size: 14px;
                }
              }
              atomic-search-box::part(textarea-expander) {
                margin-left: 16px;
              }
              atomic-search-box::part(textarea) {
                font-size: 14px;
                color: var(--non-spectrum-article-dark-gray);
              }
              atomic-search-box::part(query-suggestion-item) {
                font-size: 14px;
                color: var(--non-spectrum-article-dark-gray);
              }
              atomic-search-box::part(clear-button) {
                background: var(--non-spectrum-silver-mist);
                border-radius: 100%;
                height: 18px;
                width: 18px;
              }
              atomic-search-box::part(clear-icon)  {
                color: var(--background-color);
                stroke-width: 2.5px;
                transform: scale(0.6);
              }
              atomic-search-box::part(submit-button) {
                transform: scale(0.8);
                position: absolute;
                left: 0;
              }
              atomic-search-box::part(suggestions-wrapper) {
                background-color: var(--background-color);
                border: 1px solid #CACACA;
              }
              atomic-search-box::part(textarea-spacer) {
                display: none;
              }
              .atomic-search-box-wrapper {
                width: 100%;
                margin: 32px 0 20px !important;
                @media(max-width: 1024px) {
                  margin-bottom: 0 !important;
                }
              }
              .atomic-search-box-wrapper *{
                box-sizing: border-box;
              }
              .atomic-search-box-wrapper atomic-search-box {
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
            <div class="atomic-search-box-wrapper">
              <div class="search-box-wrapper">
                <atomic-search-box
                  suggestion-timeout="5000"
                  number-of-queries="8"
                  clear-filters="false"
                >
                  <atomic-search-box-query-suggestions></atomic-search-box-query-suggestions>
                </atomic-search-box>
              </div>
            </div>
          </atomic-layout-section>
          <atomic-layout-section section="facets">
            <style>
               atomic-layout-section[section='facets'] {
                border-right: 2px solid var(--footer-border-color);
                border-top: 1px solid var(--footer-border-color);
                border-radius: 1px;
                background: var(--non-spectrum-hover-bg);
              }
              .facet-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 40px 20px 12px;
                border-bottom: 2px solid var(--footer-border-color);
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
                color: var(--non-spectrum-navy-blue);
                cursor: pointer;
              }
            </style>
            <div class="facet-header">
              <div class="filter-label">
                <label>${placeholders.filterLabel || 'Filters'}</label>
              </div>
              <div class="clear-label">
                <label>${placeholders.filterClearAllLabel || 'Clear All'}</label>
              </div>
            </div>
            <atomic-facet-manager>
              <style>
                atomic-facet::part(facet-child-element) {
                  margin-left: 32px;
                }
                atomic-facet::part(facet-hide-element) {
                  display: none;
                }
                atomic-facet::part(facet-child-label) {
                  padding-top: 6px;
                  padding-bottom: 6px;
                }
                atomic-facet::part(facet-parent-label) {
                  padding-bottom: 4px;
                }
                atomic-facet::part(facet-parent-button) {
                  margin-top: 4px;
                }
                atomic-facet {
                  border-bottom: 2px solid var(--footer-border-color);
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
                  color: var(--non-spectrum-input-text);
                  justify-content: flex-end;
                  flex-direction: row-reverse;
                  gap: 16px;
                }
                atomic-facet::part(label-button-icon) {
                  margin-left: 0;
                }
                atomic-facet::part(facet) {
                  padding-right: 0;
                }
                atomic-facet::part(values) {
                  max-height: 500px;
                  overflow-y: auto;
                  margin-top: 0;
                  padding-right: 16px;
                }
                atomic-facet::part(show-more), atomic-facet::part(show-less) {
                  color: var(--non-spectrum-input-text);
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
                  color: var(--non-spectrum-input-text);
                }
                atomic-facet::part(value-checkbox) {
                  border: 2px solid #959595;
                  border-radius: 2px;
                }
                atomic-facet::part(value-checkbox-checked) {
                  background-color: var(--non-spectrum-grey-updated);
                  border-color: var(--non-spectrum-grey-updated);
                }
                atomic-facet::part(value-count) {
                  color: var(--non-spectrum-article-dark-gray);
                }
                atomic-facet::part(value-label) {
                  margin-right: 4px;
                  color: var(--non-spectrum-article-dark-gray);
                }
                atomic-facet::part(clear-button) {
                  display: none;
                }
                
                atomic-facet::part(show-more-less-icon) atomic-component-error, atomic-facet::part(value-checkbox-icon) atomic-component-error, atomic-facet::part(value-checkbox) atomic-component-error, atomic-component-error, atomic-icon atomic-component-error {
                  display: none !important;
                }
              </style>
              <atomic-facet
                  sort-criteria="alphanumericNaturalDescending"
                  field="el_contenttype"
                  label="Content Type"
                  display-values-as="checkbox"
                ></atomic-facet>
              <atomic-facet
                sort-criteria="alphanumericNaturalDescending"
                field="el_product"
                label="Product"
                number-of-values="60"
                display-values-as="checkbox"
              ></atomic-facet>
              <atomic-facet
                sort-criteria="alphanumericNaturalDescending"
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
                padding-right: 20px;
                border-top: 1px solid var(--footer-border-color);
                @media(max-width: 1024px) {
                  padding-left: 20px;
                }
              }
            </style>
            <atomic-layout-section section="query">
              <style>
                atomic-layout-section {
                  position: relative;
                  @media(max-width: 1024px) {
                    // max-width: calc(100% - 40px);
                    overflow-x: hidden;
                  }
                }
                atomic-layout-section[section="query"] {
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                }
              </style>
              <atomic-query-summary id="query-summary">
                <style>
                  atomic-query-summary {
                    color: var(--non-spectrum-dark-gray);
                    font-size: 18px;
                    margin: 16px 0 20px;
                  }
                  .result-query {
                    display: flex;
                    flex-direction: column;
                  }
                  atomic-query-summary[mobile]::part(results) {
                    display: flex;
                    flex-direction: column;
                    font-size: 18px;
                    color: var(--non-spectrum-dark-gray);
                  }
                  atomic-query-summary[mobile]::part(duration) {
                    font-size: 14px;
                    color: var(--non-spectrum-graphite-gray);
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
                  background: var(--non-spectrurm-whisper-gray);
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
                    color: var(--non-spectrum-input-text);
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
                    color: var(--non-spectrum-grey-updated);
                    font-size: 12px;
                    line-height: 15px;
                  }
                  atomic-breadbox::part(show-more), atomic-breadbox::part(show-less), atomic-breadbox::part(clear) {
                    border: 1px solid #959595;
                    border-radius: 4px;
                    color: var(--non-spectrum-grey-updated);
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
                  <span class="icon icon-atomic-search-filter"></span>
                </button>
              </div>
              <atomic-sort-dropdown>
                <style>
                  atomic-sort-dropdown.atomic-sort-mweb {
                    width: 100%;
                    padding-left: 50px;
                    display: flex;
                    justify-content: flex-end;
                  }
                  atomic-sort-dropdown::part(select-separator) {
                    border: none;
                  }
                  atomic-sort-dropdown::part(select) {
                    border: 1px solid #CACACA;
                    border-radius: 4px;
                    color: var(--non-spectrum-grey-updated);
                  }
                  atomic-sort-dropdown::part(label) {
                    font-size: 12px;
                    color: var(--non-spectrum-grey-updated);
                    margin-left: 0;
                  }
                  atomic-sort-dropdown::part(select-separator) {
                    color: var(--non-spectrum-grey-updated);
                  }
                </style>
                <atomic-sort-expression
                  label="relevance"
                  expression="relevancy"
                ></atomic-sort-expression>
                <atomic-sort-expression
                  label="Most Views"
                  expression="el_view_status descending"
                ></atomic-sort-expression>
                <atomic-sort-expression
                  label="Most Likes"
                  expression="el_kudo_status descending"
                ></atomic-sort-expression>
                <atomic-sort-expression
                  label="Most Replies"
                  expression="el_reply_status descending"
                ></atomic-sort-expression>
                <atomic-sort-expression
                  label="Newest First"
                  expression="date descending"
                ></atomic-sort-expression>
                <atomic-sort-expression
                  label="Oldest First"
                  expression="date ascending"
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
                  border-bottom: 0.5px solid var(--non-spectrurm-whisper-gray);
                  margin-left: -36px;
                  padding-left: 72px;
                }
                .result-header-item {
                  font-size: 11px;
                  color: var(--non-spectrum-web-gray);
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
                    background-color:var(--footer-border-color);
                  }
                  atomic-result-list::part(skeleton) {
                    display: flex;
                    flex-direction: column;
                  }
                  atomic-result-list::part(atomic-skeleton),
                  atomic-result-list::part(atomic-mobile-view) {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    margin: 24px 0;
                  }

                  atomic-result-list::part(atomic-skeleton-line) {
                    background: linear-gradient(-90deg, var(--shimmer-image-slide-start) 0%, var(--shimmer-image-slide-end) 50%, var(--shimmer-image-slide-start) 100%);
                    background-size: 400% 400%;
                    animation: skeleton-shimmer 1.2s ease-in-out infinite;
                    border-radius: 4px;
                  }

                  atomic-result-list::part(atomic-skeleton-line-title) {
                    height: 18px;
                    width: 50%;
                  }

                  atomic-result-list::part(atomic-skeleton-line-subtitle) {
                    height: 12px;
                    width: 40%;
                    margin: 6px 0;
                  }

                  atomic-result-list::part(atomic-skeleton-line-content) {
                    height: 32px;
                    width: 90%;
                  }

                  atomic-result-list::part(atomic-skeleton-grid-desktop) {
                    display: grid;
                    grid-template-columns: 1.5fr 0.5fr 0.6fr 0.4fr;
                    gap: 16px;
                    align-items: start;
                    border-bottom: 1px solid #ddd;
                    padding: 12px 0;
                    margin-left: 32px;
                  }

                  atomic-result-list::part(atomic-skeleton-desktop-line) {
                    background: linear-gradient(-90deg, var(--shimmer-image-slide-start) 0%, var(--shimmer-image-slide-end) 50%, var(--shimmer-image-slide-start) 100%);background-size: 400% 400%;
                    animation: skeleton-shimmer 1.2s ease-in-out infinite;
                    border-radius: 4px;
                  }

                  atomic-result-list::part(atomic-skeleton-desktop-line-heading) {
                    width: 100%;
                    height: 21px;
                    margin-bottom: 6px;
                  }

                  atomic-result-list::part(atomic-skeleton-desktop-line-subheading) {
                    width: 50%;
                    height: 11px;
                    margin-bottom: 8px;
                  }

                  atomic-result-list::part(atomic-skeleton-desktop-line-content) {
                    width: 100%;
                    height: 36px;
                    margin-bottom: 8px;
                  }

                  atomic-result-list::part(atomic-skeleton-desktop-line-tag) {
                    width: 50px;
                    height: 12px;
                    margin-bottom: 6px;
                  }

                  atomic-result-list::part(atomic-skeleton-desktop-line-button) {
                    width: 80px;
                    height: 26px;
                  }

                  atomic-result-list::part(atomic-skeleton-desktop-line-info) {
                    width: 120px;
                    height: 24px;
                  }

                  atomic-result-list::part(atomic-skeleton-desktop-line-status) {
                    width: 60px;
                    height: 14px;
                  }

                  @keyframes skeleton-shimmer {
                    0% {
                      background-position: 200% 0;
                    }
                    100% {
                      background-position: -200% 0;
                    }
                  }

                </style>
                <atomic-result-template>
                  <template>
                  <style>
                    :host {
                      --content-type-playlist-color: #30a7ff;
                      --content-type-tutorial-color: #10cfa9;
                      --content-type-documentation-color: #0aa35b;
                      --content-type-community-color: #ffde2c;
                      --content-type-certification-color: #b6db00;
                      --content-type-troubleshooting-color: #ffa213;
                      --content-type-event-color: #ff709f;
                      --content-type-perspective-color: #c844dc;
                      --content-type-default-color: #000000
                    }
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
                    .result-title {
                      position: relative;
                    }
                    atomic-result-section-excerpt, atomic-result-text {
                      font-size: 12px;
                      color: var(--non-spectrum-article-dark-gray);
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
                      color: var(--non-spectrum-dark-charcoal);
                      font-weight: bold;
                      display: -webkit-box;
                      -webkit-line-clamp: 1; 
                      -webkit-box-orient: vertical;
                      overflow: hidden;
                      text-overflow: ellipsis;
                      max-width: 90vw;
                    }
                    .result-title atomic-result-text atomic-result-link, .mobile-result-title atomic-result-text atomic-result-link {
                      width: 100%;
                      display: block;
                      height: 20px;
                      position: absolute;
                    }
                    .result-content-type {
                      display: flex;
                      justify-content: flex-start;
                    }
                    atomic-result-multi-value-text::part(svg-element) {
                      top: 2px;
                      position: relative;
                      max-height: 18px
                    }
                    .result-content-type atomic-result-multi-value-text::part(result-multi-value-text-list) {
                      margin: 0 8px 0 0;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      flex-wrap: wrap;
                    }
                    .result-content-type atomic-result-multi-value-text::part(result-multi-value-text-value) {
                      width: fit-content;
                      font-size: 12px;
                      white-space: pre;
                      white-space: nowrap;
                    }

                    @media(min-width: 1024px) {
                      .result-content-type atomic-result-multi-value-text::part(result-multi-value-text-value) {
                        border: 1px solid var(--content-type-default-color);
                        border-radius: 4px;
                        padding: 4px 8px;
                        color: var(--content-type-default-color);
                        display: flex;
                        align-items: center;
                        flex-direction: row-reverse;
                        gap: 4px;
                      }
                      .result-content-type.troubleshooting atomic-result-multi-value-text::part(result-multi-value-text-value),
                      .result-content-type.troubleshoot atomic-result-multi-value-text::part(result-multi-value-text-value) {
                        border: 1px solid var(--content-type-troubleshooting-color);
                        color: var(--content-type-troubleshooting-color);
                      }
                      .result-content-type.playlist atomic-result-multi-value-text::part(result-multi-value-text-value) {
                        border: 1px solid var(--content-type-playlist-color);
                        color: var(--content-type-playlist-color);
                      }
                      .result-content-type.tutorial atomic-result-multi-value-text::part(result-multi-value-text-value) {
                        border: 1px solid var(--content-type-tutorial-color);
                        color: var(--content-type-tutorial-color);
                      }
                      .result-content-type.documentation atomic-result-multi-value-text::part(result-multi-value-text-value) {
                        border: 1px solid var(--content-type-documentation-color);
                        color: var(--content-type-documentation-color);
                      }
                      .result-content-type.community atomic-result-multi-value-text::part(result-multi-value-text-value) {
                        border: 1px solid var(--content-type-community-color);
                        color: var(--content-type-community-color);
                      }
                      .result-content-type.certification atomic-result-multi-value-text::part(result-multi-value-text-value) {
                        border: 1px solid var(--content-type-certification-color);
                        color: var(--content-type-certification-color);
                      }
                      .result-content-type.event atomic-result-multi-value-text::part(result-multi-value-text-value) {
                        border: 1px solid var(--content-type-event-color);
                        color: var(--content-type-event-color);
                      }
                      .result-content-type.perspective atomic-result-multi-value-text::part(result-multi-value-text-value) {
                        border: 1px solid var(--content-type-perspective-color);
                        color: var(--content-type-perspective-color);
                      }
                    }
                    
                    .result-content-type atomic-result-multi-value-text::part(result-multi-value-text-separator) {
                      display: none;
                    }
                    .result-product atomic-result-multi-value-text::part(result-multi-value-text-value) {
                      font-size: 14px;
                      color: var(--non-spectrum-web-gray);
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
                      color: var(--non-spectrum-web-gray);
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
                      color: var(--non-spectrum-grey-updated);
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
                      color: var(--non-spectrum-dark-gray) !important;
                    }
                    .mobile-result-info .result-field atomic-result-multi-value-text, .mobile-result-info .atomic-result-date, .mobile-result-info .result-product atomic-result-multi-value-text::part(result-multi-value-text-value) {
                      color: var(--non-spectrum-web-gray);
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
                      <atomic-result-text field="title" should-highlight="false">
                        <atomic-result-link></atomic-result-link>
                      </atomic-result-text>
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
                          <atomic-result-text field="title" should-highlight="false">
                            <atomic-result-link>
                            </atomic-result-link>
                          </atomic-result-text>
                          
                        </div>
                        <div class="result-icons-wrapper">
                          <atomic-field-condition if-defined="el_view_status">
                            <div class="result-icon-item">
                              <span class="icon icon-atomic-search-view"></span>
                              <span class="icon-text">
                                <atomic-result-number field="el_view_status" number-format="decimal"></atomic-result-number>
                              </span>
                            </div>
                          </atomic-field-condition>
                          <atomic-field-condition if-defined="el_kudo_status">
                            <div class="result-icon-item">
                              <span class="icon icon-atomic-search-like"></span>
                              <span class="icon-text">
                                <atomic-result-text field="el_kudo_status"></atomic-result-text>
                              </span>
                            </div>
                          </atomic-field-condition>
                          <atomic-field-condition if-defined="el_reply_status">
                            <div class="result-icon-item">
                              <span class="icon icon-atomic-search-share"></span>
                              <span class="icon-text">
                                <atomic-result-text field="el_reply_status"></atomic-result-text>
                              </span>
                            </div>
                          </atomic-field-condition>
                        </div>
                        <div>
                          <atomic-result-section-excerpt>
                            <atomic-result-text field="excerpt" should-highlight="false"></atomic-result-text>
                          </atomic-result-section-excerpt>
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
                  border-top: 1px solid var(--non-spectrurm-whisper-gray);
                  padding: 40px 0;
                  margin-top: -8px;
                }
                atomic-pager::part(active-page-button) {
                  border: none;
                  background-color: var(--non-spectrurm-whisper-gray);
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
                  color: var(--non-spectrum-grey-updated);
                  background-color: var(--background-color)
                  font-size: 15px;
                }
                atomic-results-per-page::part(active-button) {
                  border: none;
                  border-radius: 4px;
                  background-color: var(--non-spectrurm-whisper-gray);
                }
                atomic-results-per-page::part(label) {
                  color: var(--non-spectrum-input-text);
                  font-size: 15px;
                }
                atomic-pager::part(page-button) {
                  background-color: var(--background-color)
                  border: 1px solid var(--non-spectrurm-whisper-gray);
                  border-radius: 4px;
                  color: var(--non-spectrum-input-text);
                  height: 26px;
                  width: 26px;
                }
                atomic-pager::part(active-page-button) {
                  background-color: var(--non-spectrurm-whisper-gray);
                }
                atomic-pager::part(previous-button), atomic-pager::part(next-button) {
                  height: 26px;
                  color: var(--non-spectrum-input-text);
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
  return atomicUIElements;
};

export default getCoveoAtomicMarkup;
