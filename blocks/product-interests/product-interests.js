import { defaultProfileClient } from "../../scripts/auth/profile.js";

const interestsUrl = 'https://experienceleague.adobe.com/api/interests?page_size=200&sort=Order&lang=en';

export async function fetchProfileData(url, cType) {
    try {
      let data;
      const response = await fetch(url, {
        method: 'GET',
      });
      if (response.ok && cType === "json") {
          data = await response.json();
      } else if (response.ok && cType === "text") {
          data = await response.text();
      }
      return data;
    } catch (error) {
      /* eslint-disable no-console */
      console.error('Error fetching data', error);
      return null;
    }
}
const [interests, profileData] = await Promise.all([fetchProfileData(interestsUrl, 'json'), defaultProfileClient.getMergedProfile()]);

function decorateInterests(block){
    const columnsContainer = document.createElement('ul');
    block.appendChild(columnsContainer);
    columnsContainer.classList.add('interests-container');
    const userInterests = profileData.interests;
    interests.data.forEach(interest => {
        const column = document.createElement('li');
        column.innerHTML = `<li class='row'><label class="checkbox">
        <input title='${interest.Name}' type='checkbox' value='${interest.Name}'>
        <span class="subtext">${interest.Name}</span>
    </label></li>`;
        if (interest.Nested) {
            let subColumnsContainer = columnsContainer.querySelector('li:last-child > ul')
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
        
        if (userInterests.includes(interest.Name)) {
            column.querySelector('input').checked = true;
            column.querySelector('input').classList.add("checked")
        }
    });

}

function handleProductInterestChange(block){
    block.querySelectorAll("li.row > label").forEach((row)=>{
        row.addEventListener("click", (e)=>{
            e.stopPropagation();
            if(e.target.tagName === "INPUT") {
                const newInterests = []
                block.querySelectorAll("li.row input:checked").forEach((input)=>{
                    newInterests.push(input.title)
                })
                defaultProfileClient.updateProfile("interests", newInterests, true).then((response)=>{
                  // TODO: Add toast Notification
                    console.log(response)
                })
            }
        })
    })
}

export default async function decorateProfile(block) {
    decorateInterests(block);
    handleProductInterestChange(block)
}