import { defaultProfileClient } from '../../scripts/auth/profile.js';
import { sendNotice } from '../../scripts/toast/toast.js';
import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { productExperienceEventEmitter } from '../../scripts/events.js';

const interestsUrl = 'https://experienceleague.adobe.com/api/interests?page_size=200&sort=Order&lang=en';

/* Fetch data from the Placeholder.json */
let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

/* Mock - start ______________Delete below__________________________ */
const PROFILE_DATA = JSON.parse(
  '{"bookmarks":["recX88dqRxgR9ddBK","recV2e9cew8UC1JKw","recD5pXoi0XGJV57x","reckyeNjJTnUmoGu7","recU8Z30n3k9mZB1y","recd103aKbVORXpXe"],"emailOptIn":false,"entitlements":["Marketing Cloud"],"interactions":[],"interests":["Experience Manager","Experience Manager Sites","Experience Manager Assets"],"industryInterests":[],"learningInterests":[],"level":["Intermediate","Beginner","Beginner"],"geo":true,"inProductActivity":true,"origin":"experienceleague-dev.adobe.com","org":"90FC331D59DBA35E0A494204@AdobeOrg","orgs":[],"persona":"","progress":{},"playbook":{},"projectedProductContext":[{"owningEntity":"90FC331D59DBA35E0A494204@AdobeOrg","serviceCode":"delegation","ident":"E611426D444E33A2A2FB","groupid":"244780889","provisioning_group_id":"525248936","label":"delegation","modDts":1573207901000,"serviceLevel":"FREE_BASIC","createDts":1573207901000,"statusCode":"ACTIVE"},{"owningEntity":"90FC331D59DBA35E0A494204@AdobeOrg","serviceCode":"delegation","ident":"05A855D172C8DAA45BBB","groupid":"447201813","provisioning_group_id":"516834125","label":"delegation","modDts":1685467276000,"serviceLevel":"FREE_BASIC","createDts":1685467276000,"statusCode":"ACTIVE"},{"tenant_id":"908978","fulfillable_entity_resource_locator":"AEP_90FC331D59DBA35E0A494204@AdobeOrg","orig_sys":"jem","owningEntity":"90FC331D59DBA35E0A494204@AdobeOrg","serviceCode":"dma_tartan","EMPTY_KEY":"","ident":"SABAN8X9THHVSX22FDB1WAQNMW","groupid":"79624613","label":"Adobe Marketing Cloud","modDts":1655801234000,"enable_sub_service":"dma_tartan","fulfillable_data":"{\\"region\\":\\"VA7\\",\\"environment\\":\\"stage\\",\\"tenant_id\\":\\"908978\\",\\"geo\\":\\"useast\\"}","serviceLevel":"standard","createDts":1507566928000,"geo":"useast","statusCode":"ACTIVE"},{"owningEntity":"90FC331D59DBA35E0A494204@AdobeOrg","serviceCode":"delegation","ident":"C25C2BC8867978BC65AB","groupid":"449626185","provisioning_group_id":"449628612","label":"delegation","modDts":1686254038000,"serviceLevel":"FREE_BASIC","createDts":1686254038000,"statusCode":"ACTIVE"}],"push":false,"recommended":[],"role":["User"],"roles":[],"timestamp":"2024-03-31T06:06:10.325Z","updated":"2024-06-11T07:40:06.209Z","seen":[],"skills":[],"solutionLevels":["recX88dqRxgR9ddBK","recV2e9cew8UC1JKw","recD5pXoi0XGJV57x","reckyeNjJTnUmoGu7","recU8Z30n3k9mZB1y","recd103aKbVORXpXe"],"sms":false,"votes":{"down":[],"up":[]},"account_type":"type3","utcOffset":"null","preferred_languages":null,"displayName":"Rachabathuni Nitin Venkat","session":"https://ims-na1-stg1.adobelogin.com/ims/session/v1/ZWQ2N2M0YzktYzJlMi00NzcyLWFiMmUtMzllZGJlZTQ1ZTQ0LS0wRTM1N0RENDYyNjBBNEY4MEE0OTQxMUNAYzYyZjI0Y2M1YjViN2UwZTBhNDk0MDA0","last_name":"Nitin Venkat","userId":"0E357DD46260A4F80A49411C@c62f24cc5b5b7e0e0a494004","authId":"0E357DD46260A4F80A49411C@c62f24cc5b5b7e0e0a494004","tags":["agegroup_unknown","edu","edu_k12"],"ownerOrg":"90FC331D59DBA35E0A494204@AdobeOrg","emailVerified":"true","phoneNumber":null,"countryCode":"IN","name":"Rachabathuni Nitin Venkat","company":null,"mrktPerm":"","mrktPermEmail":null,"first_name":"Rachabathuni","email":"tac32570@adobe.com"}',
);
const INT_DATA = JSON.parse(
  '{"data":[{"Cloud":["Experience Cloud"],"Group":["Insights and Audiences"],"Name":"Analytics","Order":1,"source":"interests","id":"677e535f-2b2e-4c88-a153-813f4a3089e5"},{"Cloud":["Experience Cloud"],"Group":["Insights and Audiences"],"Name":"Audience Manager","Order":2,"source":"interests","id":"b556d75d-7506-42b8-92d3-412e64ab2530"},{"Cloud":["Experience Cloud"],"Group":["Insights and Audiences"],"Name":"Customer Journey Analytics","Order":3,"source":"interests","id":"f652ea85-ec21-4078-abd9-908e12d380a3"},{"Cloud":["Experience Cloud"],"Group":["Insights and Audiences"],"Name":"Real-Time Customer Data Platform","Order":4,"source":"interests","id":"ae00c4cb-9af1-42ee-8b7e-fb58635803ea"},{"Cloud":["Experience Cloud"],"Group":["Content and Journeys"],"Name":"Experience Manager","Order":20,"SubGroup":["aem"],"source":"interests","id":"b56ca9bb-b2b9-408d-acf0-5ac09ff7da7e"},{"Cloud":["Experience Cloud"],"Group":["Content and Journeys"],"Label":"Sites","Name":"Experience Manager Sites","Nested":true,"Order":21,"SubGroup":["aem"],"source":"interests","id":"e24e9525-9fdc-4b87-9e0a-820dc5a45997"},{"Cloud":["Experience Cloud"],"Group":["Content and Journeys"],"Label":"Assets","Name":"Experience Manager Assets","Nested":true,"Order":22,"SubGroup":["aem"],"source":"interests","id":"9a6c77ed-efc5-4ab3-968a-202cf5c87d0b"},{"Cloud":["Experience Cloud"],"Group":["Content and Journeys"],"Label":"Forms","Name":"Experience Manager Forms","Nested":true,"Order":23,"SubGroup":["aem"],"source":"interests","id":"34776a16-c48d-4bc7-8a5e-ded8d508100c"},{"Cloud":["Experience Cloud"],"Group":["Content and Journeys"],"Label":"Screens","Name":"Experience Manager Screens","Nested":true,"Order":24,"SubGroup":["aem"],"source":"interests","id":"dc30b29d-34f8-4cea-bca2-adc95462ddac"},{"Cloud":["Experience Cloud"],"Group":["Content and Journeys"],"Name":"Journey Orchestration","Order":25,"source":"interests","id":"2d99a4ab-0e4e-4992-8bb2-6d938ad50a96"},{"Cloud":["Experience Cloud"],"Group":["Content and Journeys"],"Name":"Journey Optimizer","Order":26,"source":"interests","id":"2eb493dd-bd19-4d09-bacc-7254293fe96a"},{"Cloud":["Experience Cloud"],"Group":["Optimization and Scale"],"Name":"Target","Order":41,"source":"interests","id":"59a955ef-999c-4e82-a680-0aec4cb16572"},{"Cloud":["Experience Cloud"],"Group":["Marketing Workflows"],"Name":"Workfront","Order":42,"source":"interests","id":"8d133a03-8b21-4432-b077-b5ac12985a79"},{"Cloud":["Experience Cloud"],"Group":["Commerce and Conversion"],"Name":"Advertising","Order":60,"source":"interests","id":"42f7d6fe-938c-4b24-9349-73ad81a93201"},{"Cloud":["Experience Cloud"],"Group":["Commerce and Conversion"],"Name":"Commerce","Order":61,"source":"interests","id":"202972dd-3901-44dd-bc41-f7d0ca4c5a59"},{"Cloud":["Experience Cloud"],"Group":["Channels and Engagement"],"Name":"Campaign v8","Order":80,"source":"interests","id":"c0223567-6b04-48a8-871d-29aada2ebd5d"},{"Cloud":["Experience Cloud"],"Group":["Channels and Engagement"],"Name":"Campaign Classic v7","Order":81,"source":"interests","id":"1d05b5df-3b88-4f0c-b672-37aa8fde16e8"},{"Cloud":["Experience Cloud"],"Group":["Channels and Engagement"],"Name":"Campaign Standard","Order":82,"source":"interests","id":"fbbe9e4b-9894-40f5-82ed-89751a2408f1"},{"Cloud":["Experience Cloud"],"Group":["Channels and Engagement"],"Label":"Marketo Engage","Name":"Marketo Engage","Order":82,"source":"interests","id":"6ba656af-b830-4362-a5a2-18916879b03a"},{"Cloud":["Experience Platform"],"Group":["Experience Platform"],"Name":"Experience Platform","Order":100,"source":"interests","id":"63a3b0cf-14bb-4ecd-aa5f-c085525e3e42"},{"Cloud":["Document Cloud"],"Group":["Document Cloud"],"Label":"Adobe Acrobat","Name":"Acrobat","Order":120,"source":"interests","id":"cb34a7c6-dae1-4ccb-b210-5b7b18e6179a"},{"Cloud":["Document Cloud"],"Group":["Document Cloud"],"Label":"Acrobat Sign","Name":"Acrobat Sign","Order":121,"source":"interests","id":"d23cd7e6-8eaa-4743-aceb-911df7375257"},{"Cloud":["Document Cloud"],"Group":["Document Cloud"],"Name":"Acrobat Services","Order":122,"source":"interests","id":"6b33660e-cdc0-4cd4-bccd-448014255f5b"},{"Cloud":["Strategy and thought leadership"],"Group":["Strategy and thought leadership"],"Label":"CXM Strategy and Best Practices","Name":"Customer Experience Management","Order":140,"source":"interests","id":"e1a33fd6-2f7c-49ae-87b1-6107dc5a7f2f"}],"error":null,"links":[{"uri":"/api","rel":"collection"}],"status":200}',
);

const [_interests, _profileData] = await Promise.all([
  fetchProfileData(interestsUrl, 'json'),
  defaultProfileClient.getMergedProfile(),
]);

const profileData = _profileData || PROFILE_DATA;
const interests = _interests || INT_DATA;

/* Mock - END  ^^^^^^^^^^^ delete above ^^^^^^^^^^^^^^^^^^^^^^ */

export async function fetchProfileData(url, cType) {
  try {
    let data;
    const response = await fetch(url, {
      method: 'GET',
    });
    if (response.ok && cType === 'json') {
      data = await response.json();
    } else if (response.ok && cType === 'text') {
      data = await response.text();
    }
    return data;
  } catch (error) {
    /* eslint-disable no-console */
    console.error('Error fetching data', error);
    return null;
  }
}
// TODO :: UNCOMMMENT BELOW BLOCK.
// const [interests, profileData] = await Promise.all([
//   fetchProfileData(interestsUrl, 'json'),
//   defaultProfileClient.getMergedProfile(),
// ]);

function decorateInterests(block) {
  const columnsContainer = document.createElement('ul');
  block.appendChild(columnsContainer);
  columnsContainer.classList.add('interests-container');
  const userInterests = profileData?.interests ? profileData.interests : [];
  const clonedInterests = structuredClone(interests.data);

  productExperienceEventEmitter.set('interests_data', clonedInterests);

  clonedInterests.forEach((interest) => {
    const column = document.createElement('li');
    column.innerHTML = `<label class="checkbox">
        <input title='${interest.Name}' type='checkbox' value='${interest.Name}'>
        <span class="subtext">${interest.Name}</span>
    </label>`;
    if (interest.Nested) {
      let subColumnsContainer = columnsContainer.querySelector('li:last-child > ul');
      const parentName = columnsContainer.querySelector('li.interest:last-child  > label').textContent.trim();
      const childLabel = column.querySelector('span.subtext');
      if (childLabel.textContent.trim().includes(parentName)) {
        childLabel.textContent = childLabel.textContent.trim().replace(parentName, '');
      }
      if (!subColumnsContainer) {
        subColumnsContainer = document.createElement('ul');
        columnsContainer.querySelector('li.interest:last-child').appendChild(subColumnsContainer);
        subColumnsContainer.classList.add('sub-interests-container');
        subColumnsContainer.appendChild(column);
        column.classList.add('sub-interest');
      } else {
        subColumnsContainer.appendChild(column);
        column.classList.add('sub-interest');
      }
    } else {
      columnsContainer.appendChild(column);
      column.classList.add('interest');
    }

    const inputEl = column.querySelector('input');
    if (inputEl) {
      inputEl.id = `interest__${interest.id}`;
    }
    if (userInterests.includes(interest.Name)) {
      inputEl.checked = true;
      inputEl.classList.add('checked');
      interest.selected = true;
      productExperienceEventEmitter.set(interest.id, true);
    } else {
      interest.selected = false;
    }
  });
  productExperienceEventEmitter.on('dataChange', ({ key, value }) => {
    const inputEl = block.querySelector(`#interest__${key}`);
    if (inputEl) {
      inputEl.checked = value;
    }
    // TODO :: Add network call.
  });
}

function handleProductInterestChange(block) {
  block.querySelectorAll('li.row > label').forEach((row) => {
    row.addEventListener('click', (e) => {
      e.stopPropagation();
      if (e.target.tagName === 'INPUT') {
        const newInterests = [];
        block.querySelectorAll('li.row input:checked').forEach((input) => {
          newInterests.push(input.title);
        });
        defaultProfileClient.updateProfile('interests', newInterests, true).then(() => {
          sendNotice(placeholders.profileUpdated || 'Profile updated successfully');
        });
        const [, id] = e.target.id.split('__');
        productExperienceEventEmitter.set(id, e.target.checked);
      }
    });
  });
}

export default async function decorateProfile(block) {
  decorateInterests(block);
  handleProductInterestChange(block);
}
