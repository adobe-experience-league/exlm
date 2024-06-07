import buildProductCard from '../../scripts/profile/profile-interests.js';
import { htmlToElement } from '../../scripts/scripts.js';
import { productExperienceEventEmitter } from '../../scripts/events.js';

const renderCards = (resultsEl) => {
  // eslint-disable-next-line no-use-before-define
  CARDS_DATA.filter((card) => card.isSelected).forEach((cardData) => {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card-item');
    buildProductCard(resultsEl, cardDiv, cardData);
    resultsEl.appendChild(cardDiv);
  });
};

export default function ProfileExperienceLevel(block) {
  const [firstLevel, secondLevel] = block.children;
  const heading = firstLevel.innerText?.trim() ?? '';
  const subHeading = secondLevel.innerText?.trim() ?? '';
  block.innerHTML = '';
  const content = htmlToElement(`
    <div>
        <h2 class="product-experience-level-header">${heading}</h2>
    <div>
      <p class="product-experience-level-para">${subHeading}</p>
      <div class="product-experience-level-type">
        <div class="product-experience-level-item">
          <h3>Beginner</h3>
          <p>You’re just starting out with the selected product and are looking to grow your skills.</p>
        </div>
        <div class="product-experience-level-item">
          <h3>Intermediate</h3>
          <p>You have a moderate understanding of the selected product, but have room to level up your skills.</p>
        </div>
        <div class="product-experience-level-item">
          <h3>Experienced</h3>
          <p>You know the selected product inside and out and use your advanced skills to achieve complex objectives.</p>
        </div>
      </div>
      <div class="personalize-interest-results"></div>
    </div>
  </div>`);
  block.appendChild(content);
  const resultsEl = block.querySelector('.personalize-interest-results');
  renderCards(resultsEl);

  productExperienceEventEmitter.on('dataChange', (data) => {
    const { key, value } = data;
    // eslint-disable-next-line no-use-before-define
    const model = CARDS_DATA.find((card) => card.product.includes(key));
    if (model) {
      model.isSelected = value;
      resultsEl.innerHTML = '';
      renderCards(resultsEl);
    }
  });
}

// eslint-disable-next-line
var CARDS_DATA = [
  {
    id: 'rechJv2BcnrbnOrXz',
    contentType: 'Documentation',
    badgeTitle: 'Documentation',
    thumbnail: '',
    product: ['Workfront'],
    isSelected: true, // PropAdded
    title: 'Marketo modules | Adobe Workfront',
    description:
      'In an Adobe Workfront Fusion scenario, you can automate workflows that use Marketo, as well as connect it to multiple third-party applications and services. ... If you need instructions on creating a scenario, see Create a scenario in Adobe Workfr...',
    tags: [
      {
        icon: '',
        text: '',
      },
      {
        icon: '',
        text: '',
      },
    ],
    event: {
      time: '',
    },
    contributor: {
      thumbnail: '',
      name: '',
      level: '',
      date: '',
    },
    authorInfo: {
      name: '',
      type: '',
    },
    copyLink:
      'https://experienceleague-stage.adobe.com/en/docs/workfront/using/adobe-workfront-fusion/fusion-apps-and-modules/marketo-modules',
    bookmarkLink: '',
    viewLink:
      'https://experienceleague-stage.adobe.com/en/docs/workfront/using/adobe-workfront-fusion/fusion-apps-and-modules/marketo-modules',
    viewLinkText: 'Read article',
    inProgressText: '',
    inProgressStatus: '',
    permanentid: '08dfb29e29c3150101e4a07f2bab0dc7652bb571c138e77af9d96d4220ba',
    index: 0,
  },
  {
    id: 'recmn7x18B4C0VxcH',
    contentType: 'Documentation',
    badgeTitle: 'Documentation',
    thumbnail: '',
    product: ['Commerce'],
    isSelected: true, // PropAdded
    title: 'Support Tools overview | Adobe Commerce',
    description:
      'CREATED FOR: ... Admin ... Adobe Commerce offers a variety of support tools that help and empower you to improve your e-commerce store experience. ... We provide personalized best practices, diagnostic and monitoring tools, and the most relevant i...',
    tags: [
      {
        icon: '',
        text: '',
      },
      {
        icon: '',
        text: '',
      },
    ],
    event: {
      time: '',
    },
    contributor: {
      thumbnail: '',
      name: '',
      level: '',
      date: '',
    },
    authorInfo: {
      name: '',
      type: '',
    },
    copyLink: 'https://experienceleague-stage.adobe.com/en/docs/commerce-knowledge-base/kb/support-tools/overview',
    bookmarkLink: '',
    viewLink: 'https://experienceleague-stage.adobe.com/en/docs/commerce-knowledge-base/kb/support-tools/overview',
    viewLinkText: 'Read article',
    inProgressText: '',
    inProgressStatus: '',
    permanentid: 'e973c1e6eba9258d5d2e49b4de55bb0887e9651d4cd89be69f669520fff8',
    index: 1,
  },
  {
    id: 'recLfTJRSGvCdeq7V',
    contentType: 'Tutorial',
    badgeTitle: 'Tutorial',
    thumbnail: '',
    product: ['Workfront'],
    isSelected: false, // PropAdded
    title: 'Best Practice - Dashboards | Adobe Workfront',
    description:
      'What is an Adobe Workfront “best practice”? ... Best practices are guidelines that represent an effective, efficient course of action; are easily adopted by you and the users at your company; and can be replicated successfully across your organiza...',
    tags: [
      {
        icon: '',
        text: '',
      },
      {
        icon: '',
        text: '',
      },
    ],
    event: {
      time: '',
    },
    contributor: {
      thumbnail: '',
      name: '',
      level: '',
      date: '',
    },
    authorInfo: {
      name: '',
      type: '',
    },
    copyLink:
      'https://experienceleague-stage.adobe.com/en/docs/workfront-learn/tutorials-workfront/best-practices/dashboards-bp',
    bookmarkLink: '',
    viewLink:
      'https://experienceleague-stage.adobe.com/en/docs/workfront-learn/tutorials-workfront/best-practices/dashboards-bp',
    viewLinkText: 'View tutorial',
    inProgressText: '',
    inProgressStatus: '',
    permanentid: '7a67760e18ea354745b6041ed6c02bebc8fa987235cd98b35ae12120aa0f',
    index: 2,
  },
  {
    id: 'rec7oGJ79szTvFAkK',
    contentType: 'Documentation',
    badgeTitle: 'Documentation',
    thumbnail: '',
    product: ['Commerce'],
    isSelected: false, // PropAdded
    title: 'Best Practices | Adobe Commerce',
    description:
      'This topic lists the actions you should take to manage the complexity of upgrading Adobe Commerce and Magento Open Source projects. ... Your team should be thinking about upgrades from the moment your project development starts and continue throug...',
    tags: [
      {
        icon: '',
        text: '',
      },
      {
        icon: '',
        text: '',
      },
    ],
    event: {
      time: '',
    },
    contributor: {
      thumbnail: '',
      name: '',
      level: '',
      date: '',
    },
    authorInfo: {
      name: '',
      type: '',
    },
    copyLink:
      'https://experienceleague-stage.adobe.com/en/docs/commerce-operations/upgrade-guide/prepare/best-practices',
    bookmarkLink: '',
    viewLink:
      'https://experienceleague-stage.adobe.com/en/docs/commerce-operations/upgrade-guide/prepare/best-practices',
    viewLinkText: 'Read article',
    inProgressText: '',
    inProgressStatus: '',
    permanentid: '960811c3c7e0fc927e379e7cc8fe51edac8391b79d56b54692d0832c2a95',
    index: 3,
  },
  {
    id: 'recAcu9ds9wz8Uhtj',
    contentType: 'Documentation',
    badgeTitle: 'Documentation',
    thumbnail: '',
    product: ['General', 'Experience Cloud'],
    isSelected: false, // PropAdded
    title: 'Metadata and tagging | Adobe Experience Cloud',
    description:
      'The preceding links describe where add values. ... If you aren’t sure what to do after reading those sections, get some advice from Blake, Bob, or Alva. ... You can find them in each tag’s respective yaml file. ... Change or create tags by filing ...',
    tags: [
      {
        icon: '',
        text: '',
      },
      {
        icon: '',
        text: '',
      },
    ],
    event: {
      time: '',
    },
    contributor: {
      thumbnail: '',
      name: '',
      level: '',
      date: '',
    },
    authorInfo: {
      name: '',
      type: '',
    },
    copyLink: 'https://experienceleague-stage.adobe.com/en/docs/authoring-guide-exl/using/authoring/using-metadata',
    bookmarkLink: '',
    viewLink: 'https://experienceleague-stage.adobe.com/en/docs/authoring-guide-exl/using/authoring/using-metadata',
    viewLinkText: 'Read article',
    inProgressText: '',
    inProgressStatus: '',
    permanentid: 'c30eaccc42517ffa56062b6177f6c07457817faf6dfa86f7daeffbeaf74e',
    index: 4,
  },
  {
    id: 'recNCNyz7TN44zhIY',
    contentType: 'Documentation',
    badgeTitle: 'Documentation',
    thumbnail: '',
    product: ['Commerce'],
    isSelected: false, // PropAdded
    title: 'MDVA-39966: Unable to deploy locales other than en_US | Adobe Commerce',
    description:
      'The MDVA-39966 patch solves the issue where the user is unable to deploy locales other than en_US. ... Please note that the issue was fixed in Adobe Commerce version 2.4.1. ... The patch might become applicable to other versions with new Quality P...',
    tags: [
      {
        icon: '',
        text: '',
      },
      {
        icon: '',
        text: '',
      },
    ],
    event: {
      time: '',
    },
    contributor: {
      thumbnail: '',
      name: '',
      level: '',
      date: '',
    },
    authorInfo: {
      name: '',
      type: '',
    },
    copyLink:
      'https://experienceleague-stage.adobe.com/de/docs/commerce-knowledge-base/kb/support-tools/patches/v1-1-2/mdva-39966-unable-to-deploy-locales-other-than-en-us',
    bookmarkLink: '',
    viewLink:
      'https://experienceleague-stage.adobe.com/de/docs/commerce-knowledge-base/kb/support-tools/patches/v1-1-2/mdva-39966-unable-to-deploy-locales-other-than-en-us',
    viewLinkText: 'Read article',
    inProgressText: '',
    inProgressStatus: '',
    permanentid: '782e6527180d0675c066bbba19bdec82d9cc09a63dd3b3671ccdf48c26e5',
    index: 5,
  },
  {
    id: '12e3a9ad-7d8e-4de1-a555-09654e851f19',
    contentType: 'Documentation',
    badgeTitle: 'Documentation',
    thumbnail: '',
    product: ['Experience Platform'],
    isSelected: false, // PropAdded
    title: 'Acxiom Data Ingestion | Adobe Experience Platform',
    description:
      'The Acxiom Data Ingestion source is in beta. ... Read the terms and conditions in the sources overview for more information on using beta-labeled sources. ... Use the Acxiom Data Ingestion source to ingest Acxiom data into Real-Time Customer Data ...',
    tags: [
      {
        icon: '',
        text: '',
      },
      {
        icon: '',
        text: '',
      },
    ],
    event: {
      time: '',
    },
    contributor: {
      thumbnail: '',
      name: '',
      level: '',
      date: '',
    },
    authorInfo: {
      name: '',
      type: '',
    },
    copyLink:
      'https://experienceleague-stage.adobe.com/en/docs/experience-platform/sources/ui-tutorials/create/data-partner/acxiom-data-ingestion',
    bookmarkLink: '',
    viewLink:
      'https://experienceleague-stage.adobe.com/en/docs/experience-platform/sources/ui-tutorials/create/data-partner/acxiom-data-ingestion',
    viewLinkText: 'Read article',
    inProgressText: '',
    inProgressStatus: '',
    permanentid: '450206de789ae0e262d60a2226519f54e0167ba27d7a3093ec98b818ab2a',
    index: 6,
  },
  {
    id: 'recTgMkZQAoaGl3TL',
    contentType: 'Documentation',
    badgeTitle: 'Documentation',
    thumbnail: '',
    product: ['Workfront'],
    isSelected: false, // PropAdded
    title: 'Share the Public URL in Workfront Proof | Adobe Workfront',
    description:
      'This article refers to functionality in the standalone product Workfront Proof. ... For information on proofing inside Adobe Workfront, see Proofing. ... You can share a proof by providing the desired recipient with the Public proof URL. ... A Pub...',
    tags: [
      {
        icon: '',
        text: '',
      },
      {
        icon: '',
        text: '',
      },
    ],
    event: {
      time: '',
    },
    contributor: {
      thumbnail: '',
      name: '',
      level: '',
      date: '',
    },
    authorInfo: {
      name: '',
      type: '',
    },
    copyLink:
      'https://experienceleague-stage.adobe.com/en/docs/workfront/using/workfront-proof/work-with-proofs-in-wf-proof/share-proofs-and-files/share-public-url',
    bookmarkLink: '',
    viewLink:
      'https://experienceleague-stage.adobe.com/en/docs/workfront/using/workfront-proof/work-with-proofs-in-wf-proof/share-proofs-and-files/share-public-url',
    viewLinkText: 'Read article',
    inProgressText: '',
    inProgressStatus: '',
    permanentid: 'efb72fe55705133aff3ea677991756d7fc26ef8ec079e69f48c57568750a',
    index: 7,
  },
];
