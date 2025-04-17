import { htmlToElement, getPathDetails } from '../../scripts/scripts.js';
import {
  shareIconSvg,
  likeIconSvg,
  viewIconSvg,
  filterIconSvg,
  nextNavigationArrow,
  previousNavigationArrow,
} from './icons.js';

const getCoveoAtomicMarkup = () => {
  const { lang: languageCode } = getPathDetails();
  const atomicUIElements = htmlToElement(`
        <atomic-search-interface language=${languageCode} fields-to-include='["@foldingchild","@foldingcollection","@foldingparent","author","author_bio_page","author_name","author_type","authorname","authortype","collection","connectortype","contenttype","date","documenttype","el_author_type","el_contenttype","el_id","el_interactionstyle","el_kudo_status","el_lirank","el_product","el_rank_icon","el_reply_status","el_solution","el_solutions_authored","el_type","el_usergenerictext","el_version","el_view_status","exl_description","exl_thumbnail","filetype","id","language","liMessageLabels","liboardinteractionstyle","licommunityurl","lithreadhassolution","objecttype","outlookformacuri","outlookuri","permanentid","role","source","sourcetype","sysdocumenttype","type","urihash","video_url", "sysdate", "el_kudo_status"]'>
        <style>
          atomic-search-layout {
            grid-template-columns: 0 18% 72% 0 !important;
            grid-column-gap: 16px;
            background-color: #FAFAFA;
          }
          atomic-search-layout atomic-layout-section[section="search"] {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
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
                height: 40px;
                border: none;
                border-bottom: 2px solid #E1E1E1;
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
                border-top: 1px solid #E1E1E1;
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
                    .result-title {
                      position: relative;
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
                              ${viewIconSvg}
                              <span class="icon-text">
                                <atomic-result-number field="el_view_status" number-format="decimal"></atomic-result-number>
                              </span>
                            </div>
                          </atomic-field-condition>
                          <atomic-field-condition if-defined="el_kudo_status">
                            <div class="result-icon-item">
                              ${likeIconSvg}
                              <span class="icon-text">
                                <atomic-result-text field="el_kudo_status"></atomic-result-text>
                              </span>
                            </div>
                          </atomic-field-condition>
                          <atomic-field-condition if-defined="el_reply_status">
                            <div class="result-icon-item">
                              ${shareIconSvg}
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
  return atomicUIElements;
};

export default getCoveoAtomicMarkup;
