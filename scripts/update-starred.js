const fs = require('fs');
const https = require('https');
const path = require('path');

const USERNAME = 'ajaymeru';
const README_PATH = path.join(__dirname, '../README.md');

function fetchStarredRepos() {
  return new Promise((resolve, reject) => {
    const token = process.env.STARRED_TOKEN || process.env.GITHUB_TOKEN;
    const apiPath = token ? '/user/starred?per_page=100' : `/users/${USERNAME}/starred?per_page=100`;

    const headers = {
      'User-Agent': 'Node.js-Script',
      'Accept': 'application/vnd.github.v3+json'
    };

    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const options = {
      hostname: 'api.github.com',
      path: apiPath,
      method: 'GET',
      headers: headers
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error(`Failed to fetch starred repos: ${res.statusCode} ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  try {
    const repos = await fetchStarredRepos();
    // Keep only repositories owned by the user
    const myStarredRepos = repos.filter(r => r.owner.login.toLowerCase() === USERNAME.toLowerCase());
    
    console.log(`Found ${myStarredRepos.length} starred repositories owned by ${USERNAME}:`);
    myStarredRepos.forEach(r => console.log(`- ${r.name}`));

    // Construct markdown cards grid
    let markdown = '\n';
    const rows = [];
    for (let i = 0; i < myStarredRepos.length; i += 2) {
      const rowRepos = myStarredRepos.slice(i, i + 2);
      const cards = rowRepos.map(r => 
        `  <a href="${r.html_url}">\n    <img src="https://github-readme-stats.vercel.app/api/pin/?username=${USERNAME}&repo=${r.name}&theme=tokyonight&hide_border=true" alt="${r.name} Card" height="120px" />\n  </a>`
      ).join('\n');
      rows.push(`<p align="center">\n${cards}\n</p>`);
    }
    markdown += rows.join('\n') + '\n';

    // Read README.md
    let readmeContent = fs.readFileSync(README_PATH, 'utf8');

    const startTag = '<!-- STARRED-START -->';
    const endTag = '<!-- STARRED-END -->';

    const startIndex = readmeContent.indexOf(startTag);
    const endIndex = readmeContent.indexOf(endTag);

    if (startIndex === -1 || endIndex === -1) {
      throw new Error('Could not find start/end tags in README.md');
    }

    const updatedContent = 
      readmeContent.substring(0, startIndex + startTag.length) +
      markdown +
      readmeContent.substring(endIndex);

    fs.writeFileSync(README_PATH, updatedContent, 'utf8');
    console.log('README.md updated successfully!');
  } catch (error) {
    console.error('Error running update-starred script:', error);
    process.exit(1);
  }
}

main();
