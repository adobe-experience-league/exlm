'use strict';

const invalid = /^((seo-)?title|keywords|tags|(seo-)?description|role|level)$/;

function coveoSolution (arg = [], solutions = []) {
  const lsolutions = solutions.filter(i => arg.includes(i.Name)),
    lsubproducts = [],
    result = lsolutions.map((i, idx) => {
      i.SubProducts = lsolutions.slice(idx).filter(s => {
        const lresult = s.Nested === true && s.Name !== i.Name && s.Name.startsWith(i.Name);

        if (lresult) {
          lsubproducts.push(s.Name);
          s.ParentName = i.Name;
        }

        return lresult;
      });

      return i;
    }).filter(i => lsubproducts.includes(i.Name) === false);

  return result.reduce((a, v) => [...a, v.Name, ...v.SubProducts.map(x => `${x.ParentName}|${x.Name}`)], []).join(';');
}

function metaHTML (arg = {}, solutions = []) {
  const result = Object.keys(arg).filter(i => invalid.test(i) === false).map(i => `<meta name="${i}" content="${arg[i]}">`);

  if ('solution' in arg) {
    result.push(`<meta name="coveo-solution" content="${coveoSolution((arg.solution || '').split(','), solutions)}">`);
  }

  return result.join('\n');
}

module.exports = metaHTML;
