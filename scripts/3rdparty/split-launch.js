import { parse } from 'acorn';
import { ancestor } from 'acorn-walk';
import { generate, FORMAT_MINIFY } from 'escodegen';
import { readFile, writeFile } from 'node:fs/promises';

function makeFileName(name) {
  return `./launch-${name.toLowerCase()}.js`;
}

function makeImportDeclartion(name) {
  return {
    type: 'ImportDeclaration',
    specifiers: [
      {
        type: 'ImportSpecifier',
        imported: { type: 'Identifier', name },
        local: { type: 'Identifier', name },
      }
    ],
    importKind: 'value',
    source: {
      type: 'Literal',
      value: makeFileName(name),
    }
  }
}

function makeExportDeclration(name, objectExpr) {
  return {
    type: 'ExportNamedDeclaration',
    exportKind: 'value',
    declaration: {
      type: 'VariableDeclaration',
      kind: 'const',
      declarations: [
        {
          type: 'VariableDeclarator',
          id: { type: 'Identifier', name },
          init: objectExpr
        }
      ]
    }
  }
}

(async function () {
  const fullJs = await readFile('./full.js', { encoding: 'utf-8' });
  const st = parse(fullJs, { ecmaVersion: 2020 });
  const containerProps = {};
  const files = {};

  // extract the window._satalite.container properties
  ancestor(st, {
    MemberExpression(exp, _state, ancestors) {
      if (exp.property.name === 'container') {
        // parent must be AssignmentExpression with opreator '='
        // window._satalite.container = {}
        const parentExpr = ancestors[ancestors.length - 2];
        if (parentExpr.type === 'AssignmentExpression' && parentExpr.operator === '=') {
          const { properties } = parentExpr.right;
          for (const prop of properties) {
            containerProps[prop.key.name] = prop.value;
            // replace with a shorthand assignment
            prop.shorthand = true;
            prop.value = {
              type: 'Identifier',
              name: prop.key.name,
            };
          }
        }
      }
    }
  });

  // add imports
  st.body.unshift(...Object.keys(containerProps).map((name) => makeImportDeclartion(name)));

  files['launch.js'] = generate(st, { format: FORMAT_MINIFY });

  // write the container properties
  Object.entries(containerProps).forEach(([name, st]) => {
    const fileName = makeFileName(name);
    const content = generate(makeExportDeclration(name, st), { format: FORMAT_MINIFY });
    files[fileName] = content;
  })

  await Promise.all(Object.entries(files).map(([name, content]) => {
    console.log(`writing ${name} ...`);
    return writeFile(name, content, { encoding: 'utf-8' });
  }));
})();