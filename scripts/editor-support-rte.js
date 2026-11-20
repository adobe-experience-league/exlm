// group editable texts in single wrappers if applicable
//
// this script should execute after script.js by editor-support.js

const columnsTextFilter = 'columns-text-no-h1';
const textEditable = `[data-aue-type="richtext"][data-aue-resource]:is([data-aue-filter="text"], [data-aue-filter="${columnsTextFilter}"])`;
const columnsTitleModel = 'columns-title';
const preserveH1Model = 'columns-title-preserve-h1';
const titleEditable = `[data-aue-prop="jcr:title"][data-aue-type="text"][data-aue-resource][data-aue-behavior="component"]:is([data-aue-model="title"], [data-aue-model="${columnsTitleModel}"], [data-aue-model="${preserveH1Model}"])`;

function findEditables(container, selector) {
  const editables = [...container.querySelectorAll(selector)];
  if (container.matches?.(selector)) editables.push(container);
  return editables;
}

function scopeColumnsAuthoring(container) {
  findEditables(container, textEditable).forEach((element) => {
    // Both standard Text and Text previously added with the scoped filter use the same resource type.
    const filter = element.closest('.columns') ? columnsTextFilter : 'text';
    if (element.dataset.aueFilter !== filter) element.dataset.aueFilter = filter;
  });
  findEditables(container, titleEditable).forEach((element) => {
    let model = 'title';
    if (element.closest('.columns')) {
      // The native Title heading is the model-bearing element. Omit the level field for
      // rendered H1s so UE cannot submit a fallback for a value absent from the select.
      model = element.matches('h1') ? preserveH1Model : columnsTitleModel;
    }
    if (element.dataset.aueModel !== model) element.dataset.aueModel = model;
  });
}

// eslint-disable-next-line import/prefer-default-export
export function decorateRichtext(container = document) {
  function deleteInstrumentation(element) {
    delete element.dataset.richtextResource;
    delete element.dataset.richtextProp;
    delete element.dataset.richtextFilter;
    delete element.dataset.richtextLabel;
  }

  let element;
  // eslint-disable-next-line no-cond-assign
  while ((element = container.querySelector('[data-richtext-resource]:not(div)'))) {
    const { richtextResource, richtextProp, richtextFilter, richtextLabel } = element.dataset;
    deleteInstrumentation(element);
    const siblings = [];
    let sibling = element;
    // eslint-disable-next-line no-cond-assign
    while ((sibling = sibling.nextElementSibling)) {
      if (sibling.dataset.richtextResource === richtextResource && sibling.dataset.richtextProp === richtextProp) {
        deleteInstrumentation(sibling);
        siblings.push(sibling);
      } else break;
    }
    const orphanElements = document.querySelectorAll(
      `[data-richtext-id="${richtextResource}"][data-richtext-prop="${richtextProp}"]`,
    );
    if (orphanElements.length) {
      // eslint-disable-next-line no-console
      console.warn(
        'Found orphan elements of a richtext, that were not consecutive siblings of the first paragraph.',
        orphanElements,
      );
      orphanElements.forEach((el) => deleteInstrumentation(el));
    } else {
      const group = document.createElement('div');
      if (richtextResource) group.dataset.aueResource = richtextResource;
      if (richtextProp) group.dataset.aueProp = richtextProp;
      if (richtextLabel) group.dataset.aueLabel = richtextLabel;
      if (richtextFilter) group.dataset.aueFilter = richtextFilter;
      group.dataset.aueBehavior = 'component';
      group.dataset.aueType = 'richtext';
      element.replaceWith(group);
      group.append(element, ...siblings);
    }
  }
  scopeColumnsAuthoring(container);
}

decorateRichtext();
