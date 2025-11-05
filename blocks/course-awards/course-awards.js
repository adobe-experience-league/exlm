import { getCurrentCourses } from '../../scripts/courses/course-profile.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';
import { fetchLanguagePlaceholders, getPathDetails } from '../../scripts/scripts.js';

let placeholders = {};

function certificateCard(props) {
  const { lang } = getPathDetails();
  const date = new Date(props?.awards?.timestamp);
  const dateStr = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
        <div class="course-awards-card">
            <div class="course-badge">
                <span class="icon icon-course-badge-red"></span>
            </div>
                <h4 class="course-awards-card-title">${props?.name}</h4>
                <div class="course-tag">${placeholders?.courseAwardCertificateLabel || 'Certificate'}</div>
                <div class="course-awards-card-footer">
                  <div class="course-awards-card-timestamp">${
                    placeholders?.courseAwardCertificateCompletedLabel || 'Completed'
                  } ${dateStr || ''}</div>
                  <a href="${window.location.origin}/${lang}/${
                    props?.awards?.id
                  }" class="course-awards-card-link button secondary">${
                    placeholders?.courseAwardCertificateLinkLabel || 'View Certificate'
                  }</a>
                </div>
        </div>
    `;
}

export default async function decorate(block) {
  block.textContent = '';

  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  let courses;
  try {
    courses = await getCurrentCourses();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching courses:', err);
    block.closest('.section.course-awards-container')?.remove();
    return;
  }

  courses = [
    {
      courseId: 'courses/get-started-with-adobe-experience-platform',
      name: 'Get Started with Adobe Experience Platform',
      modules: [
        {
          moduleId: 'courses/get-started-with-adobe-experience-platform/unified-data-in-adobe-experience-platform',
          startedAt: '2025-10-30T07:27:56.932Z',
          finishedAt: '2025-10-30T07:28:04.693Z',
        },
        {
          moduleId: 'courses/get-started-with-adobe-experience-platform/manage-customer-data-in-experience-platform',
          startedAt: '2025-10-30T07:28:12.354Z',
          finishedAt: '2025-10-30T07:29:10.092Z',
        },
        {
          moduleId:
            'courses/get-started-with-adobe-experience-platform/manage-real-time-customer-profiles-and-audiences-in-experience-platform',
          startedAt: '2025-10-30T07:29:16.203Z',
          finishedAt: '2025-10-30T07:31:07.829Z',
        },
        {
          moduleId:
            'courses/get-started-with-adobe-experience-platform/leverage-experience-platform-data-in-application-services-and-intelligent-services',
          startedAt: '2025-10-30T07:31:15.886Z',
          finishedAt: '2025-10-30T07:31:20.234Z',
        },
      ],
      awards: {
        timestamp: '2025-10-30T07:31:20.234Z',
        id: 'courses/get-started-with-adobe-experience-platform/certificate',
      },
    },
    {
      courseId: 'courses/aep-data-governance',
      name: 'Adobe Experience Platform data governance: Manage data responsibly',
      modules: [
        {
          moduleId: 'courses/aep-data-governance/module-1',
          startedAt: '2025-10-30T14:42:19.776Z',
        },
      ],
    },
    {
      courseId: 'courses/adobe-marketo-engage-core-concepts-i',
      name: 'Adobe Marketo Engage core concepts I',
      modules: [
        {
          moduleId: 'courses/adobe-marketo-engage-core-concepts-i/fundamentals-of-adobe-marketo-engage',
          startedAt: '2025-11-04T06:35:03.099Z',
          finishedAt: '2025-11-04T15:04:42.487Z',
        },
        {
          moduleId: 'courses/adobe-marketo-engage-core-concepts-i/introduction-to-the-course',
          startedAt: '2025-11-04T11:03:10.047Z',
          finishedAt: '2025-11-04T14:59:37.404Z',
        },
        {
          moduleId: 'courses/adobe-marketo-engage-core-concepts-i/module-1-fundamentals-of-adobe-marketo-engage',
          startedAt: '2025-11-04T15:00:38.455Z',
          finishedAt: '2025-11-04T15:00:42.536Z',
        },
        {
          moduleId: 'courses/adobe-marketo-engage-core-concepts-i/module-2-deploy-a-monthly-newsletter',
          startedAt: '2025-11-04T15:01:55.503Z',
        },
        {
          moduleId: 'courses/adobe-marketo-engage-core-concepts-i/deploy-a-monthly-newsletter',
          startedAt: '2025-11-05T10:47:33.163Z',
          finishedAt: '2025-11-05T10:47:36.693Z',
        },
        {
          moduleId: 'courses/adobe-marketo-engage-core-concepts-i/announce-a-newly-released-product',
          startedAt: '2025-11-05T10:47:50.050Z',
          finishedAt: '2025-11-05T10:48:16.183Z',
        },
        {
          moduleId: 'courses/adobe-marketo-engage-core-concepts-i/promote-a-special-offer',
          startedAt: '2025-11-05T10:49:37.321Z',
          finishedAt: '2025-11-05T10:49:41.407Z',
        },
        {
          moduleId: 'courses/adobe-marketo-engage-core-concepts-i/nurture-new-prospects',
          startedAt: '2025-11-05T10:49:44.220Z',
          finishedAt: '2025-11-05T10:49:47.514Z',
        },
        {
          moduleId: 'courses/adobe-marketo-engage-core-concepts-i/encourage-people-to-download-a-brochure',
          startedAt: '2025-11-05T10:50:21.594Z',
          finishedAt: '2025-11-05T10:50:31.606Z',
        },
      ],
      awards: {
        timestamp: '2025-11-05T10:50:31.606Z',
        id: 'courses/adobe-marketo-engage-core-concepts-i/certificate-of-completion',
      },
    },
    {
      courseId: 'courses/create-audiences-and-activate-destinations-in-real-time-cdp',
      name: 'Create audiences and activate destinations in Adobe Real-Time CDP',
      modules: [
        {
          moduleId:
            'courses/create-audiences-and-activate-destinations-in-real-time-cdp/get-started-with-real-time-customer-data-profile',
          startedAt: '2025-11-04T07:07:21.392Z',
          finishedAt: '2025-11-04T11:56:28.238Z',
        },
        {
          moduleId:
            'courses/create-audiences-and-activate-destinations-in-real-time-cdp/module-1-get-started-with-real-time-customer-data-profile',
          startedAt: '2025-11-04T11:58:55.644Z',
        },
      ],
    },
    {
      courseId: 'courses/create-personalized-customer-journeys-using-adobe-journey-optimizer',
      name: 'Create personalized customer journeys using Adobe Journey Optimizer',
      modules: [
        {
          moduleId:
            'courses/create-personalized-customer-journeys-using-adobe-journey-optimizer/get-started-with-adobe-journey-optimizer',
          startedAt: '2025-11-04T14:34:33.683Z',
          finishedAt: '2025-11-05T06:13:07.820Z',
        },
        {
          moduleId:
            'courses/create-personalized-customer-journeys-using-adobe-journey-optimizer/create-audiences-in-adobe-journey-optimizer',
          startedAt: '2025-11-05T06:13:13.262Z',
          finishedAt: '2025-11-05T06:17:54.058Z',
        },
      ],
    },
    {
      courseId: 'courses/administer-and-maintain-adobe-workfront-i',
      name: 'Administer and maintain Adobe Workfront I',
      modules: [
        {
          moduleId: 'courses/administer-and-maintain-adobe-workfront-i/the-role-of-the-system-administrator',
          startedAt: '2025-11-05T05:51:41.015Z',
        },
      ],
    },
  ];

  const completedCourses = courses?.filter((course) => course?.awards?.timestamp);

  if (!completedCourses?.length) {
    block.closest('.section.course-awards-container')?.remove();
    return;
  }

  const certificateCards = completedCourses.map(certificateCard);
  block.innerHTML = certificateCards.join('');
  decorateIcons(block);
}
