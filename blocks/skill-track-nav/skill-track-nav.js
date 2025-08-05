import { getCurrentStepInfo } from '../../scripts/utils/learning-collection-utils.js';

export default async function decorate() {
  console.log('skill-track-nav');
  const stepInfo = await getCurrentStepInfo();
  console.log(stepInfo);
}