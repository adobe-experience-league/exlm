// eslint-disable-next-line import/no-cycle
import { sampleRUM } from './lib-franklin.js';
import { imgZoomable } from '../blocks/img/img.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');

// add more delayed functionality here
imgZoomable();

// eslint-disable-next-line
import './prism.js';
