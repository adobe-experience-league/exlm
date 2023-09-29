import * as sass from 'sass';
import fs from 'fs';
import path from 'path';
import { readdir } from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ignoredFiles = [];

const compileAndSave = async (sassFile) => {
  const dest = sassFile.replace(path.extname(sassFile), '.css');

  fs.writeFile(dest, sass.compile(sassFile).css, (err) => {
    if (err) console.log(err);
    console.log(`Compiled ${sassFile} to ${dest}`);
  });
};

const processFiles = async (parent) => {
  const files = await readdir(parent, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      await processFiles(path.join(parent, file.name));
    }
    if (path.extname(file.name) === '.scss') {
      if (!ignoredFiles.includes(file.name)) {
        await compileAndSave(path.join(parent, file.name));
      } else {
        console.log(`${file.name} has been explicitly ignored for compilation`);
      }
    }
  }
};

// Program execution process
for (const folder of ['styles', 'blocks']) {
  try {
    await processFiles(path.join(__dirname, folder));
  } catch (err) {
    console.error(err);
  }
}

fs.watch('.', { recursive: true }, (eventType, fileName) => {
  if (path.extname(fileName) === '.scss' && eventType === 'change') {
    console.log(fileName);
    if (!ignoredFiles.includes(fileName)) {
      compileAndSave(path.join(__dirname, fileName));
    } else {
      console.log(`${fileName} has been explicitly ignored for compilation`);
    }
  }
});
