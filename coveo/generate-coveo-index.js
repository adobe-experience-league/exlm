import fs from 'fs';
import https from 'https';
import process from 'process';
// eslint-disable-next-line import/no-extraneous-dependencies
import { JSDOM } from 'jsdom';

// Configuration object mapping repository names to domains
const domainConfig = {
  exlm: 'https://experienceleague-dev.adobe.com',
  'exlm-stage': 'https://experienceleague-stage.adobe.com',
  'exlm-prod': 'https://experienceleague.adobe.com',
};

const args = process.argv.slice(2);
const languageIndex = args.indexOf('--language');
const language = languageIndex !== -1 ? args[languageIndex + 1] : 'en';
const repoNameIndex = args.indexOf('--repo-name');
const repoName = repoNameIndex !== -1 ? args[repoNameIndex + 1] : '';
const domain = domainConfig[repoName] || '';

// Function to decode base64 strings
function decodeBase64(encodedString) {
  return Buffer.from(encodedString, 'base64').toString('utf-8');
}

// Generic function to decode base64 and remove prefix
function decodeAndRemovePrefix(value, prefix) {
  if (value.includes(',')) {
    const parts = value.split(', ');
    const decodedParts = parts.map((part) => {
      const decodedValue = decodeBase64(part.replace(prefix, ''));
      return decodedValue;
    });
    const decodedValue = decodedParts.join(', ');
    return decodedValue;
    // eslint-disable-next-line no-else-return
  } else {
    const decodedValue = decodeBase64(value.replace(prefix, ''));
    return decodedValue;
  }
}

async function fetchDataFromURL(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          try {
            const contentType = response.headers['content-type'];
            if (contentType.includes('application/json')) {
              const jsonData = JSON.parse(data);
              resolve(jsonData);
            } else if (contentType.includes('text/html')) {
              resolve(data);
            } else {
              resolve(data);
            }
          } catch (error) {
            reject(error);
          }
        });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Generate XML content
async function generateXmlContent() {
  const url = `${domain}/${language}/article-index.json`;
  try {
    const articles = await fetchDataFromURL(url);
    const xmlData = [];

    // Create an array to store all the promises
    const promises = articles.data.map(async (article) => {
      let authorName = '';
      let authorType = '';
      if (article.authorBioPage !== '') {
        const authorBioPage = `${domain}${article.authorBioPage}`;
        try {
          const authorBioPageData = await fetchDataFromURL(authorBioPage);
          const dom = new JSDOM(authorBioPageData);
          const { document } = dom.window;
          const authorBioDiv = document.querySelector('.author-bio');
          if (authorBioDiv) {
            authorName = authorBioDiv.querySelector('div:nth-child(2)').textContent.trim();
            authorType = authorBioDiv.querySelector('div:nth-child(4)').textContent.trim();
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error fetching or parsing author bio page:', error);
        }
      }

      xmlData.push('<url>');
      xmlData.push(`  <loc>${domain}${article.path}</loc>`);
      xmlData.push(`  <lastmod>${article.lastModified}</lastmod>`);
      xmlData.push('  <changefreq>daily</changefreq>');
      xmlData.push('  <coveo:metadata>');
      xmlData.push(`    <coveo-content-type>${article.coveoContentType}</coveo-content-type>`);
      xmlData.push(`    <author-type>${authorType}</author-type>`);
      xmlData.push(`    <author-name>${authorName}</author-name>`);
      const decodedSolution = decodeAndRemovePrefix(article.coveoSolution, 'exl:solution/');
      xmlData.push(`    <coveo-solution>${decodedSolution}</coveo-solution>`);
      const decodedRole = decodeAndRemovePrefix(article.coveoRole, 'exl:role/');
      xmlData.push(`    <role>${decodedRole}</role>`);
      const decodedLevel = decodeAndRemovePrefix(article.coveoLevel, 'exl:experience-level/');
      xmlData.push(`    <level>${decodedLevel}</level>`);
      xmlData.push('  </coveo:metadata>');
      xmlData.push('</url>');
    });

    // Wait for all promises to resolve
    await Promise.all(promises);

    return `
      <urlset xmlns="http://www.google.com/schemas/sitemap/0.84"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xmlns:coveo="http://www.coveo.com/schemas/metadata"
              xsi:schemaLocation="http://www.google.com/schemas/sitemap/0.84 http://www.google.com/schemas/sitemap/0.84/sitemap.xsd">
          ${xmlData.join('\n')}
      </urlset>
    `;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error generating XML content:', error);
    throw error;
  }
}

// Write Coveo XML file
async function writeCoveoXML() {
  try {
    const xmlContent = await generateXmlContent();
    const fileName = `coveo_${language}.xml`;
    fs.writeFileSync(fileName, xmlContent);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error writing Coveo XML file:', error);
    throw error;
  }
}

async function main() {
  try {
    await writeCoveoXML();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error:', error);
  }
}

main();
