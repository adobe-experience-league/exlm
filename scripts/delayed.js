// eslint-disable-next-line import/no-cycle
import { sampleRUM } from './lib-franklin.js';
import buildLayout from './rails.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');

// add more delayed functionality here
const main = document.querySelector('main');
if (main) buildLayout(main);
// eslint-disable-next-line
import './prism.js';
