import { loadScript } from '../../scripts/lib-franklin.js';
import { htmlToElement, getConfig } from '../../scripts/scripts.js';

async function initiateCoveoAtomicSearch() {
  return new Promise((resolve, reject) => {
    loadScript("https://static.cloud.coveo.com/atomic/v3.13.0/atomic.esm.js", { type: "module" }).then(async (resp) => {
      console.log("----------------- resp:", resp);
      resolve(true)
    }).catch((e) => {
      console.log("failed to load the script::---", e);
      reject(e);
    });

  });
}

export default function decorate(block) {
  // const [heading, placeholder] = [...block.children].map((row) => row.firstElementChild);
  const handleAtomicLibLoad = async () => {
    await customElements.whenDefined("atomic-search-interface");
    const searchInterface = document.querySelector(
      "atomic-search-interface"
    );
    const { coveoOrganizationId } = getConfig();

    // Initialization
    await searchInterface.initialize({
      accessToken: window.exlm.config.coveoToken,
      organizationId: coveoOrganizationId,
    });

    // Trigger a first search
    searchInterface.executeFirstSearch();

  };
  const atomicUI = htmlToElement(`
    <atomic-search-interface fields-to-include='["el_contenttype","el_product"]'>
    <style>
      atomic-search-layout {
        grid-template-columns: 0 1fr 4fr 0 !important;
        grid-column-gap: 16px;
      }
      atomic-search-layout atomic-layout-section[section="search"] {
        width: 90% !important;
      }
    </style>
    <atomic-search-layout>
      <div class="header-bg"></div>
      <atomic-layout-section section="search">
      <style>
        atomic-search-box::part(wrapper) {
          height: 34px;
        }
        atomic-search-box::part(textarea) {
          padding: 4px 16px;
        }
      </style>
        <atomic-search-box></atomic-search-box>
      </atomic-layout-section>
      <atomic-layout-section section="facets">
        <atomic-facet-manager>
          <style>
            atomic-facet::part(facet) {
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
          </style>
          <atomic-facet
              field="el_contenttype"
              label="Content Type"
              display-values-as="box"
            ></atomic-facet>
          <atomic-facet
            field="role"
            label="Role"
          ></atomic-facet>
          <atomic-facet
            field="el_product"
            label="Product"
            display-values-as="box"
          ></atomic-facet>
          <atomic-facet
            field="el_solution"
            label="Solution"
          ></atomic-facet>
          
        
        </atomic-facet-manager>
      </atomic-layout-section>
      <atomic-layout-section section="main">
        <style>
          atomic-sort-dropdown::part(select-separator) {
            border: none;
          }
          atomic-sort-dropdown::part(select) {
            border: 1px solid #B3B3B3;
          }
        </style>
        <atomic-layout-section section="status">
          <atomic-breadbox></atomic-breadbox>
          <atomic-query-summary></atomic-query-summary>
          <atomic-refine-toggle></atomic-refine-toggle>
          <atomic-sort-dropdown>
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
              margin-bottom: 32px;
            }
          </style>
          <atomic-result-list>
            <atomic-result-template>
              <template>
                <style>
                  .field {
                    display: inline-flex;
                    white-space: nowrap;
                    align-items: center;
                  }

                  .field-label {
                    font-weight: bold;
                    margin-right: 0.25rem;
                  }

                  .thumbnail {
                    display: none;
                    width: 100%;
                    height: 100%;
                  }

                  .icon {
                    display: none;
                  }

                  .result-root.image-small .thumbnail,
                  .result-root.image-large .thumbnail {
                    display: inline-block;
                  }

                  .result-root.image-icon .icon {
                    display: inline-block;
                  }
                  
                  atomic-result-section-title atomic-result-text {
                    font-weight: 700 !important;
                    color: #323232 !important;
                  }

                  atomic-result-section-excerpt atomic-result-text {
                    color: #505050 !important;
                  }

                  atomic-result::before {
                    margin: none !important;
                  }
                </style>
                
                
                <atomic-result-section-title
                  ><atomic-result-link></atomic-result-link
                ></atomic-result-section-title>
                <atomic-result-section-title-metadata>
                  
                </atomic-result-section-title-metadata>
                <atomic-result-section-excerpt
                  ><atomic-result-text field="excerpt"></atomic-result-text
                ></atomic-result-section-excerpt>
                <atomic-result-section-bottom-metadata>
                  <atomic-result-fields-list>
                    <atomic-field-condition class="field" if-defined="author">
                      <span class="field-label"
                        ><atomic-text value="author"></atomic-text>:</span
                      >
                      <atomic-result-text field="author"></atomic-result-text>
                    </atomic-field-condition>

                    <atomic-field-condition class="field" if-defined="source">
                      <span class="field-label"
                        ><atomic-text value="source"></atomic-text>:</span
                      >
                      <atomic-result-text field="source"></atomic-result-text>
                    </atomic-field-condition>

                    <atomic-field-condition
                      class="field"
                      if-defined="language"
                    >
                      <span class="field-label"
                        ><atomic-text value="language"></atomic-text>:</span
                      >
                      <atomic-result-multi-value-text
                        field="language"
                      ></atomic-result-multi-value-text>
                    </atomic-field-condition>

                    <atomic-field-condition
                      class="field"
                      if-defined="filetype"
                    >
                      <span class="field-label"
                        ><atomic-text value="fileType"></atomic-text>:</span
                      >
                      <atomic-result-text
                        field="filetype"
                      ></atomic-result-text>
                    </atomic-field-condition>

                    <atomic-field-condition class="field" if-defined="sncost">
                      <span class="field-label">Cost:</span>
                      <atomic-result-number field="sncost">
                        <atomic-format-currency
                          currency="CAD"
                        ></atomic-format-currency>
                      </atomic-result-number>
                    </atomic-field-condition>

                    <span class="field">
                      <span class="field-label">Date:</span>
                      <atomic-result-date></atomic-result-date>
                    </span>
                  </atomic-result-fields-list>
                </atomic-result-section-bottom-metadata>
                <atomic-table-element label="Description">
                  <atomic-result-link field="title"></atomic-result-link>
                  <atomic-result-text field="excerpt"></atomic-result-text>
                </atomic-table-element>
                <atomic-table-element label="author">
                  <atomic-result-text field="author"></atomic-result-text>
                </atomic-table-element>
                <atomic-table-element label="source">
                  <atomic-result-text field="source"></atomic-result-text>
                </atomic-table-element>
                <atomic-table-element label="language">
                  <atomic-result-multi-value-text
                    field="language"
                  ></atomic-result-multi-value-text>
                </atomic-table-element>
                <atomic-table-element label="file-type">
                  <atomic-result-text field="filetype"></atomic-result-text>
                </atomic-table-element>
              </template>
            </atomic-result-template>
          </atomic-result-list>
          <atomic-query-error></atomic-query-error>
          <atomic-no-results></atomic-no-results>
        </atomic-layout-section>
        <atomic-layout-section section="pagination">
          <style>
            atomic-pager::part(active-page-button) {
              border: none;
              background-color: #EAEAEA;
            }
            atomic-pager::part(next-button), atomic-pager::part(previous-button) {
                 border: none;
    padding: 4px 12px;
            }
            atomic-pager::part(next-button-icon), atomic-pager::part(previous-button-icon) {
                  width: 100%;
                    padding-top: 3px;
            }
            atomic-pager::part(previous-button-icon) {
                    padding-top: 15px;
            }
          </style>
          <atomic-pager
            previous-button-icon="Previous"
            next-button-icon="Next"
          ></atomic-pager>
          <atomic-results-per-page></atomic-results-per-page>
        </atomic-layout-section>
      </atomic-layout-section>
    </atomic-search-layout>
  </atomic-search-interface>
  `);
  initiateCoveoAtomicSearch().then(handleAtomicLibLoad);
  block.appendChild(atomicUI);
}
