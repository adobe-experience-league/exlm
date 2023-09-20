import transformer from './transformer';
import fs from 'fs';

const raw = fs.readFileSync('./md.md', {encoding: 'utf8'});
transform({
  src: '/help/marketo/getting-started',
  file: 'help-center.md',
  raw,
  base: '',
  lang: 'en',
  type: 'docs',
  solution: [],
  admonition: {}
}).then(console.log);