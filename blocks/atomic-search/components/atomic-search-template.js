import { htmlToElement, getPathDetails } from '../../../scripts/scripts.js';
import {
  atomicResultChildrenStyles,
  atomicResultChildrenTemplateStyles,
  INITIAL_ATOMIC_RESULT_CHILDREN_COUNT,
} from './atomic-result-children.js';
import { nextNavigationArrow, previousNavigationArrow } from './atomic-search-icons.js';
import { atomicResultListStyles, atomicResultStyles } from './atomic-search-result.js';

const getCoveoAtomicMarkup = (placeholders) => {
  const { lang: languageCode } = getPathDetails();
  const atomicUIElements = htmlToElement(`
        <atomic-search-interface language=${languageCode} fields-to-include='["@foldingchild","@foldingcollection","@foldingparent","author","author_bio_page","author_name","author_type","authorname","authortype","collection","connectortype","contenttype","date","documenttype","el_author_type","el_contenttype","el_id","el_interactionstyle","el_kudo_status","el_lirank","el_product","el_rank_icon","el_reply_status","el_solution","el_solutions_authored","el_type","el_usergenerictext","el_version","el_view_status","exl_description","exl_thumbnail","filetype","id","language","liMessageLabels","liboardinteractionstyle","licommunityurl","lithreadhassolution","objecttype","outlookformacuri","outlookuri","permanentid","role","source","sourcetype","sysdocumenttype","type","urihash","video_url", "sysdate", "el_kudo_status"]'>
          <script type="application/json" id="atomic-search-interface-config">
            {
              "search": {
                "freezeFacetOrder": true
              }
            }
          </script>

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
              atomic-search-interface  atomic-search-layout {
                z-index: 1;
                position: relative;
                background-color: var(--non-spectrum-hover-bg);
              }
              atomic-search-interface:not(.atomic-search-interface-no-results, .atomic-search-interface-error) atomic-search-layout {
                grid-template-areas: 
                  ". .                      atomic-section-search"
                  ". atomic-section-facets  atomic-section-main"
                  ". atomic-section-facets  .                  " !important;
    
                @media(max-width: 1024px) {
                  grid-template-areas: 
                  "atomic-section-search"
                  "atomic-section-main" !important;
                  grid-template-columns: 1fr !important;
                }
    
              }
              atomic-layout-section[section='search'] {
                  margin-bottom: 8px !important;
                  max-width: 100% !important;
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
                --atomic-neutral-light: var(--non-spectrum-hover-bg);
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
                height: 10px;
                width: 10px;
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
                margin: 16px 0 20px !important;
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
              .clear-label.clear-btn-enabled, .clear-label.clear-btn-enabled label {
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
                atomic-facet.hide-facet {
                  display: none;
                }
                atomic-facet::part(facet-hide-element) {
                  display: none;
                }
                atomic-search-interface.atomic-search-interface-no-results atomic-facet::part(facet-hide-element) {
                  display: flex;
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
                atomic-facet::part(placeholder) {
                    border: none;
                }
                atomic-facet::part(search-wrapper) {
                  display: none;
                }
                atomic-facet::part(label-button), atomic-timeframe-facet::part(label-button) {
                  font-weight: 700;
                  color: var(--non-spectrum-input-text);
                  justify-content: flex-end;
                  flex-direction: row-reverse;
                  gap: 16px;
                }
                atomic-facet::part(label-button-icon), atomic-timeframe-facet::part(label-button-icon) {
                  margin-left: 0;
                }
                atomic-facet::part(facet), atomic-timeframe-facet::part(facet) {
                  padding-right: 0;
                  border: none;
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
                atomic-facet::part(value-count), atomic-timeframe-facet::part(value-count) {
                  color: var(--non-spectrum-article-dark-gray);
                  width: auto;
                  margin: 0;
                }
                atomic-facet::part(value-label), atomic-timeframe-facet::part(value-label) {
                  margin-right: 4px;
                  width: auto;
                  color: var(--non-spectrum-article-dark-gray);
                }
                atomic-facet::part(clear-button), atomic-timeframe-facet::part(clear-button) {
                  display: none;
                }
                
                atomic-facet::part(show-more-less-icon) atomic-component-error, atomic-facet::part(value-checkbox-icon) atomic-component-error, atomic-facet::part(value-checkbox) atomic-component-error, atomic-component-error, atomic-icon atomic-component-error {
                  display: none !important;
                }
              </style>
              <atomic-facet
                id="facetContentType"
                sort-criteria="alphanumericNatural"
                field="el_contenttype"
                label="${placeholders.searchContentTypeLabel || 'Content Type'}"
                display-values-as="checkbox">
              </atomic-facet>
              <atomic-facet
                id="facetStatus"
                sort-criteria="alphanumericNatural"
                field="el_status"
                label="${
                  placeholders.searchAnsweredLabel ? placeholders.searchAnsweredLabel.replace(/:$/, '') : 'Answered'
                }"
                display-values-as="checkbox">
              </atomic-facet>
              <atomic-facet
                id="facetProduct"
                sort-criteria="alphanumericNatural"
                field="el_product"
                label="${placeholders.searchProductLabel || 'Product'}"
                number-of-values="60"
                display-values-as="checkbox"
                with-search="false">
              </atomic-facet>
              <atomic-facet
                id="facetRole"
                sort-criteria="alphanumericNatural"
                field="el_role"
                label="${placeholders.searchRoleLabel || 'Role'}"
                display-values-as="checkbox">
              </atomic-facet>
              <atomic-timeframe-facet
                id="facetDate"
                field="date"
                label="${placeholders.searchDateLabel || 'Date'}"
                filter-facet-count
                enable-custom-range="false">
                  <atomic-timeframe
                    amount="1"
                    unit="month"
                    period="past"
                    label="${placeholders.searchDateOneMonthLabel || 'Within one month'}">
                  </atomic-timeframe>
                  <atomic-timeframe
                    amount="6"
                    unit="month"
                    period="past"
                    label="${placeholders.searchDateSixMonthLabel || 'Within six months'}">
                  </atomic-timeframe>
                  <atomic-timeframe
                    amount="1"
                    unit="year"
                    period="past"
                    label="${placeholders.searchDateOneYearLabel || 'Within one year'}">
                  </atomic-timeframe>
              </atomic-timeframe-facet>
            </atomic-facet-manager>
          </atomic-layout-section>
          <atomic-layout-section section="main">
            <style>
              atomic-layout-section[section='main'] {
                padding-left: 36px;
                padding-right: 20px;
                background-color: var(--non-spectrum-bg);
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
                    min-height: 48px;
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
                  @media (min-width: 1024px) {
                    min-height: auto;
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

                    @media(max-width: 1024px) {
                      padding-right: 2rem;
                    }
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
                atomic-folded-result-list::part(list-wrap) {
                  margin: 0 0 24px;
                }
                atomic-folded-result-list.list-wrap-skeleton {
                 min-height: 100vh;
                 display: block;
                }
                atomic-folded-result-list::part(outline) {
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
                  font-size: var(--spectrum-font-size-50);
                  text-transform: uppercase;
                  color: var(--non-spectrum-web-gray);
                }
               .result-header-section.result-header-inactive {
                  display: none !important;
                }
                @media(min-width: 1024px) {
                  .result-header-section {
                    display: grid;
                    grid-template-columns: 1.5fr 0.5fr 0.6fr 0.4fr;
                  }
                }
              </style>
              <div part="result-header result-header-inactive" class="result-header-section desktop-only">
                <div class="result-header-item">
                  <label>${placeholders.searchNameLabel || 'NAME'}</label>
                </div>
                <div class="result-header-item">
                  <label>${placeholders.searchContentTypeLabel || 'CONTENT TYPE'}</label>
                </div>
                <div class="result-header-item">
                  <label>${placeholders.searchProductLabel || 'PRODUCT'}</label>
                </div>
                <div class="result-header-item">
                  <label>${placeholders.searchUpdatedLabel || 'UPDATED'}</label>
                </div>
              </div>
                <atomic-folded-result-list
                    collection-field="foldingcollection"
                    child-field="foldingchild"
                    parent-field="foldingparent"
                    number-of-folded-results="${INITIAL_ATOMIC_RESULT_CHILDREN_COUNT}"
                  >
                 ${atomicResultListStyles}
                <atomic-result-template>
                  <template>
                  ${atomicResultStyles}
                  <div class="result-item mobile-only">
                    <div class="mobile-result-title">
                      <atomic-field-condition must-match-is-recommendation="true">
                        <span class="atomic-recommendation-badge">${
                          placeholders.searchRecommendationBadge || 'Recommendation'
                        }</span>
                      </atomic-field-condition>
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
                          <atomic-result-date format="YYYY-MM-DD" field="sysdate">
                          </atomic-result-date>
                      </div>
                    </div>
                    <div class="mobile-description">
                      <atomic-result-section-excerpt>
                        <atomic-result-text field="excerpt" should-highlight="false"></atomic-result-text>
                      </atomic-result-section-excerpt>
                    </div>
                    <div class="child-result-count">
                      <atomic-result-number
                        field="totalNumberOfChildResults"
                        tag="span"
                        class="children-count__value"
                      >
                      </atomic-result-number>
                    </div>
                    <atomic-result-children>
                      ${atomicResultChildrenStyles}
                      <atomic-load-more-children-results label="Show replies"></atomic-load-more-children-results>
                      <atomic-result-children-template>
                        <template>
                          ${atomicResultChildrenTemplateStyles}
                          <div class="child-item">
                            <div class="mobile-result-title result-title">
                              <span class="icon icon-atomic-search-share"></span>
                              <atomic-result-text field="title" should-highlight="false">
                                <atomic-result-link>
                                </atomic-result-link>
                              </atomic-result-text>
                            </div>
                            <atomic-result-section-excerpt>
                              <atomic-result-text field="excerpt" should-highlight="false"></atomic-result-text>
                            </atomic-result-section-excerpt>
                          </div>
                        </template>
                      </atomic-result-children-template>
                    </atomic-result-children>
                  </div>
                  <div class="result-item desktop-only">
                    <div class="result-field">
                        <div class="result-title">
                          <atomic-field-condition must-match-is-recommendation="true">
                            <span class="atomic-recommendation-badge">${
                              placeholders.searchRecommendationBadge || 'Recommendation'
                            }</span>
                          </atomic-field-condition>
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
                          <atomic-result-date format="YYYY-MM-DD" field="sysdate">
                          </atomic-result-date>
                    </div>
                    <div class="child-result-count">
                      <atomic-result-number
                        field="totalNumberOfChildResults"
                        tag="span"
                        class="children-count__value"
                      >
                      </atomic-result-number>
                    </div>
                    <atomic-result-children>
                      ${atomicResultChildrenStyles}
                      <atomic-result-children-template>
                        <template>
                          ${atomicResultChildrenTemplateStyles}
                          
                          <div class="child-item">
                            <div class="result-title">
                              <span class="icon icon-atomic-search-share"></span>
                              <atomic-result-text field="title" should-highlight="false">
                                <atomic-result-link>
                                </atomic-result-link>
                              </atomic-result-text>
                            </div>
                            <atomic-result-section-excerpt>
                              <atomic-result-text field="excerpt" should-highlight="false"></atomic-result-text>
                            </atomic-result-section-excerpt>
                          </div>
                        </template>
                      </atomic-result-children-template>
                    </atomic-result-children>
                  </div>
                </template>
                </atomic-result-template>
                </atomic-folded-result-list>
              <atomic-query-error></atomic-query-error>
              <atomic-no-results enable-cancel-last-action="false">
              <style>
              atomic-no-results::part(icon) {
                display:none;
              }
              atomic-no-results::part(no-results) {
                font-size: var(--spectrum-font-size-300);
                text-align: left;
                font-weight: normal;
              }
              atomic-no-results::part(highlight) {
                font-weight: bold;
              }
              atomic-no-results::part(search-tips) {
                display:none;
              }
              atomic-no-results .atomic-no-results-text p {
                font-size: var(--spectrum-font-size-200);
                margin-bottom: 8px;
              }
              atomic-no-results .atomic-no-results-text ul > li {
                color: inherit;
                font-size: var(--spectrum-font-size-100);
                margin-top: 5px;
                margin-bottom: 5px;
              }
              atomic-no-results::part(clear-button) {
                font-size: var(--spectrum-font-size-100);
                text-align: left;
                text-decoration: underline;
                margin-bottom: 10px;
                color: var(--link-color);
              }
              </style>
              <atomic-breadbox></atomic-breadbox>
              <div class="atomic-no-results-text">
                  <p><strong>${placeholders.searchNoResultsSuggestionLabel || 'Search suggestions:'}</strong></p>
                  <ul>
                    <li>${
                      placeholders.searchNoResultsSpellCheckText || 'Make sure keywords are spelled correctly.'
                    }</li>
                    <li>${placeholders.searchNoResultsRephraseText || 'Try rephrasing or using synonyms.'}</li>
                    <li>${placeholders.searchNoResultsSpecificKeywordText || 'Use less specific keywords.'}</li>
                    <li class="clear-filters-text" >${
                      placeholders.searchNoResultsClearFiltersText || 'Clear your filters.'
                    }</li>
                  </ul>
                </div>
            </atomic-no-results>
            </atomic-layout-section>
            <atomic-layout-section section="pagination">
              <style>
                atomic-layout-section[section='pagination'] {
                  border-top: 1px solid var(--non-spectrurm-whisper-gray);
                  padding: 40px 0;
                  margin-top: 0;
                  position: relative;
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
          <style>
            atomic-search-interface.atomic-search-interface-no-results atomic-search-layout atomic-layout-section[section='status'] {
              display: none;
            }
            atomic-search-interface.atomic-search-interface-no-results atomic-search-layout atomic-layout-section[section='query'] {
              display: none;
            }
            @media only screen and (min-width: 1024px) {
              atomic-search-layout atomic-layout-section[section='main'] {
                position: relative;
              }
              atomic-search-interface.atomic-search-interface-no-results atomic-search-layout {
                    grid-template-areas:
                    '. .                     atomic-section-search .'
                    '. atomic-section-facets   atomic-section-main   .' !important;
                    grid-template-columns:
                  }
                  atomic-search-interface.atomic-search-interface-no-results atomic-search-layout atomic-layout-section[section='facets'] {
                    display: block;
                    height: fit-content;
                  }
                  atomic-search-interface.atomic-search-interface-no-results atomic-search-layout atomic-layout-section[section='facets'].all-facets-hidden {
                    display: none;
                  }
                  atomic-search-interface.atomic-search-interface-no-results atomic-search-layout atomic-layout-section[section='pagination'] {
                    display: none;
                  }
                  atomic-search-interface.atomic-search-interface-no-results atomic-search-layout atomic-layout-section[section='main'].atomic-no-result {
                    border: none;
                  }
                }
        </style>
        </atomic-search-layout>
      </atomic-search-interface>
      `);
  return atomicUIElements;
};

export default getCoveoAtomicMarkup;
