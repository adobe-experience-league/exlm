// function adapter(data){

// }

async function fetchArticleByID(id) {
  try {
    const response = await fetch(`https://experienceleague.adobe.com/api/articles/${id}`);
    const json = await response.json();
    console.log(json.data);
    return json.data;
  } catch (error) {
    /* eslint-disable no-console */
    console.error('Error fetching data', error);
    return null;
  }
}

export default async function fetchArticleByURL(url) {
  try {
    const response = await fetch(url);
    const content = await response.text();
    console.log(content);
    const match = content.match(/<meta name="id" content="(.*)">/);
    const idValue = match[1];
    return fetchArticleByID(idValue);
  } catch (error) {
    /* eslint-disable no-console */
    console.error('Error fetching data', error);
    return null;
  }
}
