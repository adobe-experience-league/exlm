/* eslint-disable no-console */
import path from 'path';
import { fileURLToPath } from 'url';
import { compileDirectoriesInPlace, watchAndCompile } from './build/sass-util.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const IGNORED_FILES = ['_breakpoints.scss', '_typography.scss']; // list of files to ignore from compilation
const SASS_FOLDERS = ['styles', 'blocks']; // list of folders to compile

// MAIN

const args = process.argv.slice(2);
if (args.includes('--watch')) {
  await watchAndCompile(path.join(dirname), IGNORED_FILES);
} else if (args.includes('--compile')) {
  const directories = SASS_FOLDERS.map((folder) => path.join(dirname, folder));
  await compileDirectoriesInPlace(directories, IGNORED_FILES);
} else {
  console.log('Please specify a flag: --watch or --compile');
}
