/**
 * Credit where due, copilot generated most of this :)
 *
 * A stylelint plugin that enforces that all CSS variables are declared in the same file.
 * to enable this rule, add the following comment to the top of the file:
 * /* stylelint-enforce-no-external-css-vars * /
 * you can also add the reason, for example:
 * /* stylelint-enforce-no-external-css-vars: This file should be self-contained... * /
 *
 * This is especially useful for CSS files that will be used outside the experienceleague site, like including the header in community, legacy or other exl apps.
 */

import stylelint from 'stylelint';

const {
  createPlugin,
  utils: { ruleMessages },
} = stylelint;

const ruleName = 'custom/no-external-css-vars';

const messages = ruleMessages(ruleName, {
  rejected: (varName) =>
    `CSS variable "${varName}" is not declared in the same file. No external CSS variables allowed in this file.`,
});

const meta = {
  url: 'https://github.com/foo-org/stylelint-selector-no-foo/blob/main/README.md',
};

/** @type {import('stylelint').Rule} */
const ruleFunction = () => (root, result) => {
  const hasOptInComment = root.toString().includes('/* stylelint-enforce-no-external-css-vars');
  if (!hasOptInComment) return;

  const declaredVars = new Set();
  const usedVars = new Map();

  root.walkDecls((decl) => {
    const { prop, value } = decl;

    // Collect declared variables
    if (prop.startsWith('--')) {
      declaredVars.add(prop);
    }

    // Find used variables
    const matches = value.match(/var\(--([\w-]+)\)/g);
    if (matches) {
      matches.forEach((match) => {
        const varName = match.match(/--([\w-]+)/)[0];
        if (!declaredVars.has(varName)) {
          usedVars.set(varName, decl);
        }
      });
    }
  });

  // Report any variables that are not declared in the same file
  usedVars.forEach((decl, varName) => {
    stylelint.utils.report({
      ruleName,
      result,
      node: decl,
      message: messages.rejected(varName),
    });
  });
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = meta;

export default createPlugin(ruleName, ruleFunction);
