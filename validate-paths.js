/**
 * A utility to ensure paths.json and paths.yaml are in sync.
 * this is only temporary untill paths.yaml is completely removed. For now, we need to ensure they are the same.
 */

// eslint-disable-next-line import/no-extraneous-dependencies
import yaml from 'js-yaml';
import fs from 'fs';

const isSameJson = (obj1, obj2) => JSON.stringify(obj1).trim() === JSON.stringify(obj2).trim();

// eslint-disable-next-line no-console
console.log('Checking if paths.yaml and paths.json are in sync...');

const pathsYaml = fs.readFileSync('paths.yaml', 'utf8');
const pathsJson = fs.readFileSync('paths.json', 'utf8');
const yamlObject = yaml.load(pathsYaml);
const jsonObject = JSON.parse(pathsJson);
if (!isSameJson(yamlObject, jsonObject)) {
  // eslint-disable-next-line no-console
  console.log('paths.yaml (represented as JSON)\n', JSON.stringify(yamlObject, null, 2));
  // eslint-disable-next-line no-console
  console.log('paths.json\n', JSON.stringify(jsonObject, null, 2));
  throw new Error('paths.yaml and paths.json are not in sync. Please ensure they are the same');
} else {
  // eslint-disable-next-line no-console
  console.log('paths.yaml and paths.json are in sync!');
}
