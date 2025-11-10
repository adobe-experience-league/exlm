import { getCurrentStepInfo } from '../../scripts/courses/course-utils.js';

export default async function decorate() {
  // Check if it's in UE author mode
  const isUEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');

  if (!isUEAuthorMode) {
    const stepInfo = await getCurrentStepInfo();
    document.querySelector('main').style.visibility = 'hidden';
    setTimeout(() => {
      window.location.href = stepInfo.courseUrl;
    }, 1000);
  }
}
