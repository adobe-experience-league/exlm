import { interestsUrl, industriesUrl, levelsUrl, rolesUrl, preferencesUrl} from '../../scripts/urls.js';
import loadJWT from '../../scripts/auth/jwt.js';
import { profile, updateProfile, fetchProfileData } from '../../scripts/data-service/profile-service.js';

const noticeTemplate = (info) => {
    const noticeContent = document.createElement('div');
    noticeContent.className = 'exl-toast';
    noticeContent.innerHTML = `<div class="icon-info"></div>
          <div class="exl-toast-content">${info}</div>
          <div class="icon-close"></div>`;
    return noticeContent;
};
  
const sendNotice = (noticelabel) => {
    const sendNoticeContent = noticeTemplate(noticelabel);
    document.body.prepend(sendNoticeContent);
    const isExlNotice = document.querySelector('.exl-toast');
    if (isExlNotice) {
      document.querySelector('.exl-toast .icon-close').addEventListener('click', () => {
        isExlNotice.remove();
      });
  
      setTimeout(() => {
        isExlNotice.remove();
      }, 3000);
    }
};

function manageValue (el, include = []) {
    let result;
    
    // eslint-disable-next-line
    if (typeof el.checked !== void 0) {
      // eslint-disable-next-line
      result = el.value !== 'on' ? el.checked ? el.value : void 0 : el.checked;
  
      if (include.length > 0) {
        // eslint-disable-next-line
        result = result !== void 0 ? [result] : [];
        // eslint-disable-next-line
        include.forEach(i => result.push(i.value));
        // eslint-disable-next-line
      } else if (el.dataset.multi === 'true') {
        // eslint-disable-next-line
        result = result !== void 0 ? [result] : [];
      }
    }
  
    if (result instanceof Array) {
      result = result.filter(i => i.trim().length > 0);
    }
  
    return result;
}

export async function autosave (block, ev) {
    const el = ev.target;
    const els = block.querySelectorAll('*[data-autosave="true"]');

    const other = [];

    if (el.dataset.name === 'interests' || el.dataset.name === 'role' || el.dataset.name === 'level') {
        block.querySelectorAll(`[data-name="${el.dataset.name}"]`).forEach(i => {
            if (i !== el && i.checked) {
            other.push(i);
            }
        });
    }

    els.forEach(i => {
        i.disabled = true;
    });

    const data = await updateProfile(el.dataset.name, manageValue(el, other), el.dataset.replace === 'true');

    els.forEach(i => {
        i.disabled = false;
    });

    // eslint-disable-next-line
    if (data !== void 0) {
        sendNotice("Your profile changes have been saved!");
    } else {
        sendNotice("Your profile changes have not been saved!");
    }
}

const notificationPrefs = `<div class="notification-container">
        <div class='row'>
            <label class="checkbox">
                <input data-autosave='true' data-name="emailOptIn" type="checkbox">
                <span class="subtext">Send me Experience League emails about my progress, awards, and recommended learning</span>
            </label>
        </div>
        <div class='row'>
            <label class="checkbox">
                <input data-autosave='true' data-name="geo" type="checkbox">
                <span class="subtext">Use my location for local event recommendations</span>
            </label>
        </div>
        <div class='row'>
            <label class="checkbox">
                <input data-autosave='true' data-name="inProductActivity" type="checkbox">
                <span class="subtext">Connect my in-product activity with Experience League for more personalized learning</span>
            </label>
        </div>
    </div>`;

const [interests, industries, levels, roles, preferences] = await Promise.all([
    fetchProfileData(interestsUrl, 'json'),
    fetchProfileData(industriesUrl, 'json'),
    fetchProfileData(levelsUrl, 'json'),
    fetchProfileData(rolesUrl, 'json'),
    fetchProfileData(preferencesUrl, 'text'),
]);

// eslint-disable-next-line
function renderGenericTemplate(block, elem, dataUrl, sel, checkbox = true, dname, flag = false){
    const elemSelector = block.querySelector(elem);
    const elemContent = elemSelector.querySelector("p:last-child");
    const elemBlock = document.createElement("div");
        elemBlock.classList.add(`${sel}-container`);
        elemBlock.innerHTML = dataUrl.data.map(data => `<div class='row'>
                <label class='checkbox'>
                    ${checkbox === true ? `<input title='${data.Label}' data-autosave='true' data-replace='true' data-name='${dname}' data-value='${data.Name}' type='checkbox' value='${data.Name}'>` : `<input title='${data.Name}' data-autosave='true' data-replace='true' data-name='${dname}' name='${dname}' data-value='${data.Name}' type='radio' value='${data.Name}'>`}
                    <span class='subtext'>${data.Name}</span>
                </label>
                ${flag === true ? `<p class='descp'>${data.Description}</p>` : ''}
            </div>`).join('');
        elemContent.outerHTML = elemBlock.outerHTML;
}

function decorateInterests(block){
    const interestsGroup = Array.from(new Set(interests.data.map(i => i.Group[0])));
    const myLearningInterests = block.querySelector('.my-learning-interests');
    const myLearningInterestsContent = myLearningInterests.querySelector("p:last-child");
    const columnsContainer = document.createElement('div');
        columnsContainer.classList.add('interests-container');
        interestsGroup.forEach((interest) => {
            const columns = document.createElement('div');
                columns.classList.add('interests-columns');
                columns.setAttribute('data-name', interest);
                columns.innerHTML += `<h3>${interest}</h3>`;
                interests.data.forEach((intName) => {
                    if(intName.Group[0] === interest){
                        columns.innerHTML += `<div class='row'><label class="checkbox">
                            <input title='${intName.Name}' data-autosave='true' data-replace='true' data-name='interests' data-value='${intName.Name}' type='checkbox' value='${intName.Name}'>
                            <span class="subtext">${intName.Name}</span>
                        </label></div>`;
                    }
                });
                columnsContainer.appendChild(columns);
        });

        myLearningInterestsContent.outerHTML = columnsContainer.outerHTML;

        const interestsColumnArr = block.querySelectorAll('.interests-columns');
            interestsColumnArr.forEach((intCol) => {
                const contentJourneyDataAttr = intCol.getAttribute("data-name");
                    if(contentJourneyDataAttr === "Content and Journeys"){
                        const intColRows = intCol.querySelectorAll('.row');
                            intColRows.forEach((icr, index) => {
                                const icrContent = icr.querySelector('.subtext');
                                if(index !== 0 && icrContent.innerHTML.indexOf("Experience Manager") !== -1){
                                    const newIcrContent = icrContent.innerHTML.replace('Experience Manager','');
                                        icr.classList.add('row-offset');
                                        icrContent.innerHTML = newIcrContent;
                                }
                            });
                    }
            });
}

function decorateRoles(block) {
    renderGenericTemplate(block, ".my-role", roles, 'roles', true, 'role', true);
}

function decorateLevels(block) {
    renderGenericTemplate(block, ".my-experience-level", levels, 'levels', true, 'level', false);
}

function decorateIndustries(block) {
    renderGenericTemplate(block, ".my-industry", industries, 'industries', false, 'industryInterests', false);
}

function decorateNotificationPrefs(block) {
    block.querySelector(".my-notification-preferences p:last-child").outerHTML = notificationPrefs;
}

function manageCheckboxItems(block){
    loadJWT().then(async () => {
        profile().then(async (data) => {
          const checkboxes = block.querySelectorAll(".dashboard-right input[type='checkbox'], .dashboard-right input[type='radio']");
            checkboxes.forEach((checkbox) => {
                if(Array.isArray(data[checkbox.dataset.name]) === true && data[checkbox.dataset.name].includes(checkbox.dataset.value)){
                    checkbox.checked = true;
                } else if(data[checkbox.dataset.name] === true || data[checkbox.dataset.name] === checkbox.dataset.value){
                    checkbox.checked = true;
                }
            });
            block.querySelectorAll('*[data-autosave="true"]').forEach(i => i.addEventListener('change', ev => autosave(block, ev), false));
        });
      });
}

export default async function decorateProfile(block) {
    block.querySelector(".dashboard-right").innerHTML = preferences;
    decorateInterests(block);
    decorateRoles(block);
    decorateLevels(block);
    decorateIndustries(block);
    decorateNotificationPrefs(block);
    manageCheckboxItems(block);
}