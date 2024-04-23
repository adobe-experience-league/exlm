import fs from 'fs';
import https from 'https';
import process from 'process';

// Parse command line arguments
const args = process.argv.slice(2);
const languageIndex = args.indexOf('--language');
const language = languageIndex !== -1 ? args[languageIndex + 1] : 'en';

// Function to decode base64 strings
function decodeBase64(encodedString) {
  return Buffer.from(encodedString, 'base64').toString('utf-8');
}

// Generic function to decode base64 and remove prefix
function decodeAndRemovePrefix(value, prefix) {
  // Check if the value contains a comma
  if (value.includes(',')) {
    // Split the value by comma
    const parts = value.split(', ');
    // Decode and remove prefix for each part
    const decodedParts = parts.map((part) => {
      const decodedValue = decodeBase64(part.replace(prefix, ''));
      return decodedValue;
    });
    // Join the decoded parts back with comma
    const decodedValue = decodedParts.join(', ');
    return decodedValue;
    // eslint-disable-next-line no-else-return
  } else {
    // If the value is single without comma, decode and return it
    const decodedValue = decodeBase64(value.replace(prefix, ''));
    return decodedValue;
  }
}

// Fetch articles
async function fetchDataFromURL(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        let data = '';

        // A chunk of data has been received.
        response.on('data', (chunk) => {
          data += chunk;
        });

        // The whole response has been received.
        response.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
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

// Main function to generate XML content
async function generateXmlContent() {
  const url = `https://main--franklin-exlm--ruhisingh1.hlx.page/${language}/article-index.json`;
  try {
    const articles = await fetchDataFromURL(url);
    const xmlData = [];

    articles.data.forEach((article) => {
      xmlData.push('<url>');
      xmlData.push(`  <loc>${article.path}</loc>`);
      xmlData.push(`  <lastmod>${article.lastModified}</lastmod>`);
      xmlData.push('  <changefreq>daily</changefreq>');
      xmlData.push('  <coveo:metadata>');
      xmlData.push(`    <coveo-content-type>${article.coveoContentType}</coveo-content-type>`);
      const decodedSolution = decodeAndRemovePrefix(article.coveoSolution, 'exl:solution/');
      xmlData.push(`    <coveo-solution>${decodedSolution}</coveo-solution>`);
      const decodedRole = decodeAndRemovePrefix(article.coveoRole, 'exl:role/');
      xmlData.push(`    <role>${decodedRole}</role>`);
      const decodedLevel = decodeAndRemovePrefix(article.coveoLevel, 'exl:experience-level/');
      xmlData.push(`    <level>${decodedLevel}</level>`);
      xmlData.push('  </coveo:metadata>');
      xmlData.push('</url>');
    });

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
