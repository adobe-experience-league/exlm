import fs from 'fs';
import https from 'https';
import process from 'process';
import { JSDOM } from 'jsdom';

const languagesMap = new Map([
  ['de', 'de'],
  ['en', 'en'],
  ['ja', 'ja'],
  ['fr', 'fr'],
  ['es', 'es'],
  ['pt-BR', 'pt-br'],
  ['ko', 'ko'],
  ['sv', 'sv'],
  ['nl', 'nl'],
  ['it', 'it'],
  ['zh-CN', 'zh-hans'],
  ['zh-TW', 'zh-hant'],
]);

const args = process.argv.slice(2);
const languageIndex = args.indexOf('--language');
let language = 'en';

if (languageIndex !== -1) {
  const requestedLanguage = args[languageIndex + 1];
  language = languagesMap.get(requestedLanguage) || language;
}

const domainConfig = {
  exlm: 'https://experienceleague-dev.adobe.com',
  'exlm-stage': 'https://experienceleague-stage.adobe.com',
  'exlm-prod': 'https://experienceleague.adobe.com',
};

const repoNameIndex = args.indexOf('--repo-name');
const repoName = repoNameIndex !== -1 ? args[repoNameIndex + 1] : '';
const domain = domainConfig[repoName] || '';

function formatPageMetaTags(inputString) {
  return inputString
    .replace(/exl:[^/]*\/*/g, '')
    .split(',')
    .map((part) => part.trim());
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

function decodeBase64(encodedString) {
  return Buffer.from(encodedString, 'base64').toString('utf-8');
}

async function generateXmlContent() {
  const url = `${domain}/${language}/article-index.json`;
  try {
    const articles = await fetchDataFromURL(url);
    const xmlData = [];

    const promises = articles.data.map(async (article) => {
      const langPrefix = `/${language}/`;

      if (article.path !== `${langPrefix}articles` && !article.path.startsWith(`${langPrefix}articles/authors`)) {
        let authorName = '';
        let authorType = '';
        if (article.authorBioPage !== '') {
          let authorBioPage = `${article.authorBioPage}`;
          const regex = /^\/content\/exlm(?:-[^\s/]+)?\/global$/;
          const match = article.authorBioPage.match(regex);

          if (match) {
            authorBioPage = `${domain}${match[1]}`;
          } else {
            authorBioPage = `${domain}${article.authorBioPage}`;
          }

          const parts = authorBioPage.split('/');
          if (languagesMap.has(parts[3])) {
            parts[3] = languagesMap.get(parts[3]);
          }
          const updatedAuthorBioPage = parts.join('/');
          try {
            const authorBioPageData = await fetchDataFromURL(updatedAuthorBioPage);
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
        const solutions = article.coveoSolution ? formatPageMetaTags(article.coveoSolution) : [];
        const roles = article.coveoRole ? formatPageMetaTags(article.coveoRole) : [];
        const experienceLevels = article.coveoLevel ? formatPageMetaTags(article.coveoLevel) : [];
        let versionContent = '';
        const decodedSolutions = solutions.map((solution) => {
          const parts = solution.split('/');
          const decodedParts = parts.map((part) => decodeBase64(part));

          if (parts.length > 1) {
            versionContent = decodeBase64(parts.slice(1).join('/'));
          }

          return decodedParts[0];
        });

        const decodedRoles = roles.map((role) => decodeBase64(role));
        const decodedLevels = experienceLevels.map((level) => decodeBase64(level));

        xmlData.push('<url>');
        xmlData.push(`  <loc>${domain}${article.path}</loc>`);
        xmlData.push(`  <lastmod>${article.lastModified}</lastmod>`);
        xmlData.push('  <changefreq>daily</changefreq>');
        xmlData.push('  <coveo:metadata>');
        xmlData.push(`    <coveo-content-type>${article.coveoContentType}</coveo-content-type>`);
        xmlData.push(`    <author-type>${authorType}</author-type>`);
        xmlData.push(`    <author-name>${authorName}</author-name>`);
        if (decodedSolutions.join(',')) {
          xmlData.push(`    <coveo-solution>${decodedSolutions.join(',')}</coveo-solution>`);
        }
        if (decodedRoles) {
          xmlData.push(`    <role>${decodedRoles}</role>`);
        }
        if (decodedLevels) {
          xmlData.push(`    <level>${decodedLevels}</level>`);
        }
        if (versionContent) {
          xmlData.push(`    <version>${versionContent}</version>`);
        }
        xmlData.push('  </coveo:metadata>');
        xmlData.push('</url>');
      }
    });

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

async function writeCoveoXML() {
  try {
    const xmlContent = await generateXmlContent();
    if (xmlContent.trim() !== '') {
      const fileName = `coveo_articles_${language}.xml`;
      fs.writeFileSync(fileName, xmlContent);
    } else {
      // eslint-disable-next-line no-console
      console.log('XML content is empty. Skipping file creation.');
    }
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
