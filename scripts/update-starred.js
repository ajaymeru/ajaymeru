const fs = require('fs');
const https = require('https');
const path = require('path');

const USERNAME = 'ajaymeru';
const README_PATH = path.join(__dirname, '../README.md');
const CARDS_DIR = path.join(__dirname, '../images/cards');

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

function generateRepoSVG(repo) {
  const name = repo.name || '';
  const desc = repo.description || 'No description provided';
  const lang = repo.language || 'Plain Text';
  const stars = repo.stargazers_count || 0;
  const forks = repo.forks_count || 0;
  const isPrivate = repo.private || false;

  // Curated list of common language colors on GitHub
  const langColors = {
    javascript: '#f1e05a',
    typescript: '#3178c6',
    html: '#e34c26',
    css: '#563d7c',
    python: '#3572A5',
    java: '#b07219',
    ruby: '#701516',
    go: '#00ADD8',
    c: '#555555',
    'c++': '#f34b7d',
    'c#': '#178600',
    php: '#4F5D95',
    shell: '#89e051',
    vue: '#41b883',
    rust: '#dea584'
  };

  const langColor = langColors[lang.toLowerCase()] || '#858585';

  // Clean description and truncate if too long
  let cleanDesc = desc.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#039;';
      default: return m;
    }
  });
  
  let truncatedDesc = cleanDesc;
  if (truncatedDesc.length > 55) {
    truncatedDesc = truncatedDesc.substring(0, 52) + '...';
  }

  // Book icon for public, Lock icon for private
  const iconPath = isPrivate
    ? `<path d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1.5V4.5A3.5 3.5 0 0 0 8 1zm2.5 5h-5V4.5a2.5 2.5 0 1 1 5 0V6z" fill="#7aa2f7" />`
    : `<path d="M4 9H3V8h1v1zm0-3H3v1h1V6zm0-2H3v1h1V4zm10-1v9c0 .55-.45 1-1 1H1.5C.67 14 0 13.33 0 12.5V1.5C0 .67.67 0 1.5 0H13c.55 0 1 .45 1 1zM2 13h10V2H2v11z" fill="#7aa2f7" />`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="120" viewBox="0 0 400 120" fill="none">
  <style>
    .title { font: 600 14px 'Segoe UI', Ubuntu, Sans-Serif; fill: #7aa2f7; }
    .desc { font: 400 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: #a9b1d6; }
    .stat { font: 400 11px 'Segoe UI', Ubuntu, Sans-Serif; fill: #737aa2; }
  </style>
  <rect x="0.5" y="0.5" width="399" height="119" rx="6" fill="#1a1b26" stroke="#24283b"/>
  
  <!-- Icon & Title -->
  <g transform="translate(18, 22)">
    <svg x="0" y="0" width="16" height="16" viewBox="0 0 16 16">
      ${iconPath}
    </svg>
    <text x="25" y="13" class="title">${name}</text>
  </g>

  <!-- Description -->
  <text x="18" y="65" class="desc">${truncatedDesc}</text>

  <!-- Footer -->
  <g transform="translate(18, 95)">
    <!-- Language -->
    <circle cx="5" cy="-4" r="5" fill="${langColor}" />
    <text x="15" y="0" class="stat">${lang}</text>

    <!-- Stars -->
    <g transform="translate(110, 0)">
      <svg x="0" y="-12" width="14" height="14" viewBox="0 0 16 16">
        <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97 3.19 4.175a.75.75 0 0 1-1.095.896L8 12.27l-3.92 2.06a.75.75 0 0 1-1.095-.896l3.19-4.175-3.046-2.97a.75.75 0 0 1 .415-1.279l4.21-.612 1.882-3.815A.75.75 0 0 1 8 .25z" fill="#737aa2" />
      </svg>
      <text x="18" y="0" class="stat">${stars}</text>
    </g>

    <!-- Forks -->
    <g transform="translate(175, 0)">
      <svg x="0" y="-12" width="14" height="14" viewBox="0 0 16 16">
        <path d="M5 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zm0 2.122a2.25 2.25 0 1 0-1.5 0v5.256a2.251 2.251 0 1 0 1.5 0V5.372zm8 0a2.25 2.25 0 1 0-1.5 0v5.256a2.251 2.251 0 1 0 1.5 0V5.372zM11.5 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0z" fill="#737aa2" />
      </svg>
      <text x="18" y="0" class="stat">${forks}</text>
    </g>
  </g>
</svg>`;
}

async function main() {
  try {
    const repos = await fetchStarredRepos();
    // Keep only repositories owned by the user
    const myStarredRepos = repos.filter(r => r.owner.login.toLowerCase() === USERNAME.toLowerCase());
    
    console.log(`Found ${myStarredRepos.length} starred repositories owned by ${USERNAME}:`);
    myStarredRepos.forEach(r => console.log(`- ${r.name} (${r.private ? 'private' : 'public'})`));

    // Ensure directory exists
    if (!fs.existsSync(CARDS_DIR)) {
      fs.mkdirSync(CARDS_DIR, { recursive: true });
    }

    // Clean up old SVG files in the cards directory
    const existingFiles = fs.readdirSync(CARDS_DIR);
    existingFiles.forEach(file => {
      if (file.endsWith('.svg')) {
        fs.unlinkSync(path.join(CARDS_DIR, file));
      }
    });

    // Generate SVGs and construct markdown cards grid
    let markdown = '\n';
    const rows = [];
    
    myStarredRepos.forEach(r => {
      const svgContent = generateRepoSVG(r);
      fs.writeFileSync(path.join(CARDS_DIR, `${r.name}.svg`), svgContent, 'utf8');
    });

    for (let i = 0; i < myStarredRepos.length; i += 2) {
      const rowRepos = myStarredRepos.slice(i, i + 2);
      const cards = rowRepos.map(r => 
        `  <a href="${r.html_url}">\n    <img src="./images/cards/${r.name}.svg" alt="${r.name} Card" width="390px" />\n  </a>`
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
    console.log('README.md and local SVGs updated successfully!');
  } catch (error) {
    console.error('Error running update-starred script:', error);
    process.exit(1);
  }
}

main();
