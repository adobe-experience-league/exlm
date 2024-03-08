import { parse } from 'acorn';
import { ancestor } from 'acorn-walk';
import { generate, FORMAT_MINIFY } from 'escodegen';
import { readFile, writeFile } from 'node:fs/promises';

function makeVariableName(name) {
  return name
    .toLowerCase()
    .replace(/[^0-9a-z]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

function makeFileName(name) {
  return `./launch-${name.toLowerCase()}.js`;
}

function makeImportDeclartion(names, fileName = makeFileName(names)) {
  names = Array.isArray(names) ? names : [names];
  return {
    type: 'ImportDeclaration',
    specifiers: names.map((name) => ({
      type: 'ImportSpecifier',
      imported: { type: 'Identifier', name },
      local: { type: 'Identifier', name },
    })),
    importKind: 'value',
    source: {
      type: 'Literal',
      value: fileName,
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

function doGenerate(st) {
  return generate(st, { format: FORMAT_MINIFY });
}

async function splitLaunch(st, files) {
  const containerProps = {};

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

  // add imports and generate launch.js
  st.body.unshift(...Object.keys(containerProps).map((name) => makeImportDeclartion(name)));
  files['./launch.js'] = doGenerate(st);

  // generate and write the container properties
  Object.entries(containerProps).forEach(([name, st]) => {
    // now we split extensions in chunks as well
    const fileName = makeFileName(name);
    let content;
    if (name === 'extensions') {
      const program = {
        type: 'Program',
        sourceType: 'module',
        body: [
          makeExportDeclration(name, st)
        ]
      }
      const objExpr = containerProps.extensions;
      const modules = {};
      for (const extension of objExpr.properties) {
        const extensionObj = extension.value;
        extensionObj.properties
          .find((property) => property.key.name === 'modules')
          .value
          .properties
          .forEach((property) => modules[property.key.value] = property);
      }

      // modules is name => property which has a value which is the object expression
      // aggregate modules in files
      let fileContent = '';
      let moduleCnt = 1;
      let aggNames = [];
      for (const [module, prop] of Object.entries(modules)) {
        const varName = makeVariableName(module);
        aggNames.push(varName);
        const exportDecl = makeExportDeclration(varName, prop.value);
        prop.value = { type: 'Identifier', name: varName };
        const str = doGenerate(exportDecl);
        fileContent += str + '\n';
        if (fileContent.length > 10000) {
          // write chunk
          const fileName = makeFileName(`modules-${moduleCnt}`);
          const importDecl = makeImportDeclartion(aggNames, fileName);
          files[fileName] = fileContent;
          program.body.unshift(importDecl);
          moduleCnt++;
          fileContent = '';
          aggNames = [];
        }
      }
      if (aggNames.length) {
        const fileName = makeFileName(`modules-${moduleCnt}`);
        const importDecl = makeImportDeclartion(aggNames, fileName);
        files[fileName] = fileContent;
        program.body.unshift(importDecl);
      }
      content = doGenerate(program);
    } else {
      content = doGenerate(makeExportDeclration(name, st));
    }
    files[fileName] = content;
  });
}


(async function () {
  const fullJs = await readFile('./full.js', { encoding: 'utf-8' });
  const st = parse(fullJs, { ecmaVersion: 2020 });
  const files = {};

  await splitLaunch(st, files);

  await Promise.all(Object.entries(files).map(([name, content]) => {
    console.log(`writing ${name} ...`);
    return writeFile(name, content, { encoding: 'utf-8' });
  }));
})()