const fs = require('fs');
const path = require('path');
const https = require('https');

const GITHUB_TOKEN = 'process.env.GITHUB_TOKEN';
const OWNER = 'mforgedesign';
const REPO = 'Convites';
const BASE_PATH = 'builder-v4';

// Force re-deploy with cache bust
const FILES = [
    { local: 'static/js/supabase-adapter.js', remote: 'static/js/supabase-adapter.js' }
];

async function getFileSHA(filePath) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'api.github.com',
            path: `/repos/${OWNER}/${REPO}/contents/${filePath}`,
            method: 'GET',
            headers: {
                'User-Agent': 'AutoBuilder-Deploy',
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Cache-Control': 'no-cache'
            }
        };

        https.get(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const fileData = JSON.parse(data);
                        console.log(`   Current SHA: ${fileData.sha.substring(0, 8)}...`);
                        resolve(fileData.sha);
                    } catch (e) {
                        resolve(null);
                    }
                } else {
                    resolve(null);
                }
            });
        }).on('error', () => resolve(null));
    });
}

async function deployFile(localPath, remotePath) {
    console.log(`📤 ${remotePath}`);

    if (!fs.existsSync(localPath)) {
        console.log(`   ❌ Not found`);
        return false;
    }

    const content = fs.readFileSync(localPath, 'utf8');

    // Add timestamp comment for cache busting
    const timestamp = new Date().toISOString();
    const contentWithTimestamp = `/* Deployed: ${timestamp} */\n${content}`;

    const base64Content = Buffer.from(contentWithTimestamp).toString('base64');
    const fullPath = `${BASE_PATH}/${remotePath}`;
    const fileSHA = await getFileSHA(fullPath);

    const payload = JSON.stringify({
        message: `Force update: Fix FormData handling (${timestamp})`,
        content: base64Content,
        ...(fileSHA && { sha: fileSHA })
    });

    return new Promise((resolve) => {
        const options = {
            hostname: 'api.github.com',
            path: `/repos/${OWNER}/${REPO}/contents/${fullPath}`,
            method: 'PUT',
            headers: {
                'User-Agent': 'AutoBuilder-Deploy',
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
                'Content-Length': payload.length
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200 || res.statusCode === 201) {
                    console.log(`   ✅ Success - New deploy triggered`);
                    resolve(true);
                } else {
                    console.log(`   ❌ Failed (${res.statusCode})`);
                    console.log(data);
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.log(`   ❌ Error: ${error.message}`);
            resolve(false);
        });

        req.write(payload);
        req.end();
    });
}

async function forceDeploy() {
    console.log('🔧 FORCE DEPLOYING Upload Fix (with cache bust)\n');

    for (const file of FILES) {
        await deployFile(file.local, file.remote);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n✅ Force deploy complete!');
    console.log('⏱️  GitHub Pages may take 1-2 minutes to update');
    console.log('🔗 https://mforgedesign.github.io/Convites/builder-v4/');
    console.log('\n💡 Clear browser cache or use Ctrl+Shift+R to force refresh');
}

forceDeploy();
