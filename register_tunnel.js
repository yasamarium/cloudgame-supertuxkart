const { spawn } = require('child_process');
const https = require('https');

const GAME_ID = process.env.GAME_ID || 'cloudgame-supertuxkart';
const GAME_TITLE = process.env.GAME_TITLE || 'SuperTuxKart';
const GH_PAT = process.env.GH_PAT;

function updateSessionDb(streamUrl) {
  if (!GH_PAT) {
    console.log('[Registry] No GH_PAT provided, skipping session db sync');
    return;
  }

  const options = {
    hostname: 'api.github.com',
    path: '/repos/yasamarium/cloudgame-db-sessions/contents/data/servers.json',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${GH_PAT}`,
      'User-Agent': 'CloudGameRunner',
      'Accept': 'application/vnd.github+json'
    }
  };

  const req = https.request(options, res => {
    let body = '';
    res.on('data', chunk => { body += chunk; });
    res.on('end', () => {
      try {
        const fileData = JSON.parse(body);
        const sha = fileData.sha;
        const servers = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf8'));

        let found = false;
        for (const s of servers) {
          if (s.id === GAME_ID) {
            s.stream_url = streamUrl;
            s.status = 'online';
            s.last_ping = new Date().toISOString();
            found = true;
            break;
          }
        }
        if (!found) {
          servers.push({
            id: GAME_ID,
            title: GAME_TITLE,
            stream_url: streamUrl,
            status: 'online',
            last_ping: new Date().toISOString()
          });
        }

        const updatedContent = Buffer.from(JSON.stringify(servers, null, 2)).toString('base64');
        const putReq = https.request({
          hostname: 'api.github.com',
          path: '/repos/yasamarium/cloudgame-db-sessions/contents/data/servers.json',
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${GH_PAT}`,
            'User-Agent': 'CloudGameRunner',
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json'
          }
        }, putRes => {
          console.log('[Registry] Session DB updated successfully, status:', putRes.statusCode);
        });
        putReq.write(JSON.stringify({
          message: `Update live stream for ${GAME_TITLE}`,
          content: updatedContent,
          sha: sha,
          branch: 'main'
        }));
        putReq.end();
      } catch (err) {
        console.error('[Registry Error]', err.message);
      }
    });
  });
  req.on('error', err => console.error('[Registry Request Error]', err.message));
  req.end();
}

console.log('[Cloudflare Tunnel] Starting tunnel for http://localhost:8080...');
const tunnel = spawn('cloudflared', ['tunnel', '--url', 'http://localhost:8080']);

let registered = false;
const handleOutput = data => {
  const output = data.toString();
  console.log(output);
  const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  if (match && !registered) {
    registered = true;
    const streamUrl = match[0] + '/vnc.html?autoconnect=true&resize=scale&quality=8';
    console.log('==============================================');
    console.log(`LIVE CLOUD STREAM READY: ${streamUrl}`);
    console.log('==============================================');
    updateSessionDb(streamUrl);
  }
};

tunnel.stdout.on('data', handleOutput);
tunnel.stderr.on('data', handleOutput);
