#!/usr/bin/env node
/**
 * YouTube OpenClaw/ClawdBot Daily Summary Script
 * 
 * Checks YouTube for new videos about OpenClaw/ClawdBot via:
 * 1. Invidious API search (public, no API key needed)
 * 2. YouTube RSS feeds for known channels covering OpenClaw
 * 
 * Outputs a formatted summary of the top 5 most popular/recent videos.
 * 
 * Usage: node youtube-openclaw-summary.js [--json] [--count N]
 * 
 * Created: 2026-02-05 by Vienna
 */

const https = require('https');
const http = require('http');

// ── Configuration ──────────────────────────────────────────────────────────

const SEARCH_TERMS = [
  'openclaw',
  'clawdbot',
  'openclaw tutorial',
  'openclaw ai assistant',
];

// Top channels known to cover OpenClaw (handle → display name)
const KNOWN_CHANNELS = {
  '@Fireship': 'Fireship',
  '@freecodecamp': 'freeCodeCamp.org',
  '@NateBJones': 'Nate B Jones',
  '@mikeynocode': 'Mikey No Code',
  '@PeterYangYT': 'Peter Yang',
  '@theAIsearch': 'AI Search',
  '@velvetshark-com': 'VelvetShark',
  '@fahdmirza': 'Fahd Mirza',
  '@intheworldofai': 'WorldofAI',
  '@Telusko': 'Telusko',
  '@ToLearnAIAutoMation': 'To Learn AI AutoMation',
  '@TheAgentLabs': 'Agent Labs AI',
  '@ExecuteAutomation': 'Execute Automation',
  '@MervinPraison': 'Mervin Praison',
  '@CharlieChang': 'Charlie Chang',
  '@techchipnet': 'TechChip',
  '@HostingerAcademy': 'Hostinger Academy',
  '@railwayapp': 'Railway',
  '@LaravelPHP': 'Laravel',
};

// Invidious instances (public, no API key needed)
const INVIDIOUS_INSTANCES = [
  'https://vid.puffyan.us',
  'https://invidious.fdn.fr',
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://yt.artemislena.eu',
];

// Keywords to match in video titles/descriptions
const KEYWORDS = ['openclaw', 'clawdbot', 'clawd bot', 'moltbot', 'open claw'];

// ── HTTP Helpers ───────────────────────────────────────────────────────────

function fetchJSON(url, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout: timeoutMs }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJSON(res.headers.location, timeoutMs).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`JSON parse error from ${url}: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout: ${url}`)); });
  });
}

function fetchText(url, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout: timeoutMs }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchText(res.headers.location, timeoutMs).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout: ${url}`)); });
  });
}

// ── Invidious Search ───────────────────────────────────────────────────────

async function searchInvidious(query, instance) {
  const url = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&sort_by=upload_date&page=1`;
  const results = await fetchJSON(url, 15000);
  
  if (!Array.isArray(results)) return [];
  
  return results
    .filter(v => v.type === 'video')
    .map(v => ({
      title: v.title || '',
      videoId: v.videoId || '',
      channel: v.author || '',
      channelId: v.authorId || '',
      views: v.viewCount || 0,
      published: v.published ? new Date(v.published * 1000) : null,
      publishedText: v.publishedText || '',
      description: (v.description || '').substring(0, 200),
      lengthSeconds: v.lengthSeconds || 0,
      url: `https://www.youtube.com/watch?v=${v.videoId}`,
    }));
}

async function searchAllInstances(query) {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const results = await searchInvidious(query, instance);
      if (results.length > 0) return results;
    } catch (e) {
      // Try next instance
    }
  }
  return [];
}

// ── YouTube RSS Feed Parsing ───────────────────────────────────────────────

function parseYouTubeRSS(xml) {
  const entries = [];
  // Simple XML parsing without external dependencies
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  
  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];
    const get = (tag) => {
      const m = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return m ? m[1].trim() : '';
    };
    const getAttr = (tag, attr) => {
      const m = entry.match(new RegExp(`<${tag}[^>]*${attr}="([^"]*)"[^>]*/>`));
      return m ? m[1] : '';
    };
    
    const videoId = get('yt:videoId');
    const title = get('title');
    const channelName = get('name');
    const published = get('published');
    const views = entry.match(/views="(\d+)"/)?.[1] || '0';
    
    if (videoId && title) {
      entries.push({
        title,
        videoId,
        channel: channelName,
        channelId: get('yt:channelId'),
        views: parseInt(views, 10),
        published: published ? new Date(published) : null,
        publishedText: published ? formatTimeAgo(new Date(published)) : '',
        description: get('media:description')?.substring(0, 200) || '',
        url: `https://www.youtube.com/watch?v=${videoId}`,
      });
    }
  }
  
  return entries;
}

async function fetchChannelRSS(handle) {
  try {
    // First get channel page to find channel ID
    const pageUrl = `https://www.youtube.com/${handle}`;
    const html = await fetchText(pageUrl, 10000);
    
    // Extract channel ID from page source
    const cidMatch = html.match(/channel_id=([A-Za-z0-9_-]+)/);
    if (!cidMatch) return [];
    
    const channelId = cidMatch[1];
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const xml = await fetchText(rssUrl, 10000);
    
    return parseYouTubeRSS(xml);
  } catch (e) {
    return [];
  }
}

// ── Utility Functions ──────────────────────────────────────────────────────

function formatTimeAgo(date) {
  if (!date) return 'unknown';
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffHours < 1) return 'just now';
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) !== 1 ? 's' : ''} ago`;
}

function formatViews(n) {
  if (!n || n === 0) return 'N/A';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

function formatDuration(seconds) {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function matchesKeywords(text) {
  const lower = (text || '').toLowerCase();
  return KEYWORDS.some(kw => lower.includes(kw));
}

function deduplicateByVideoId(videos) {
  const seen = new Set();
  return videos.filter(v => {
    if (seen.has(v.videoId)) return false;
    seen.add(v.videoId);
    return true;
  });
}

// ── Main Logic ─────────────────────────────────────────────────────────────

async function collectVideos() {
  const allVideos = [];
  
  console.error('🔍 Searching YouTube via Invidious API...');
  
  // Search via Invidious
  for (const term of SEARCH_TERMS) {
    try {
      console.error(`   Searching: "${term}"`);
      const results = await searchAllInstances(term);
      allVideos.push(...results);
      // Small delay to be polite
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.error(`   ⚠ Search failed for "${term}": ${e.message}`);
    }
  }
  
  // Check RSS feeds for known channels (sample a few to avoid rate limiting)
  console.error('📡 Checking RSS feeds for known channels...');
  const channelHandles = Object.keys(KNOWN_CHANNELS).slice(0, 8); // Check top 8
  
  for (const handle of channelHandles) {
    try {
      console.error(`   Checking: ${KNOWN_CHANNELS[handle]} (${handle})`);
      const entries = await fetchChannelRSS(handle);
      // Only include entries that match OpenClaw keywords
      const relevant = entries.filter(e => matchesKeywords(e.title) || matchesKeywords(e.description));
      allVideos.push(...relevant);
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      // Skip failed channels
    }
  }
  
  return allVideos;
}

function rankAndSort(videos, count = 5) {
  // Deduplicate
  const unique = deduplicateByVideoId(videos);
  
  // Score: views + recency bonus
  const now = Date.now();
  const scored = unique.map(v => {
    const ageHours = v.published ? (now - v.published.getTime()) / (1000 * 60 * 60) : 999;
    const recencyBonus = Math.max(0, 100000 - (ageHours * 500)); // Recent videos get bonus
    const viewScore = v.views || 0;
    return { ...v, score: viewScore + recencyBonus };
  });
  
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  
  return scored.slice(0, count);
}

function formatSummary(videos, asJSON = false) {
  if (asJSON) {
    return JSON.stringify(videos, null, 2);
  }
  
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const lines = [];
  
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push(`  📺 OpenClaw/ClawdBot YouTube Daily Summary — ${dateStr}`);
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');
  
  if (videos.length === 0) {
    lines.push('  No new videos found today.');
    lines.push('');
    return lines.join('\n');
  }
  
  videos.forEach((v, i) => {
    lines.push(`  ${i + 1}. ${v.title}`);
    lines.push(`     📺 Channel: ${v.channel}`);
    lines.push(`     👁  Views:   ${formatViews(v.views)}`);
    if (v.published) {
      lines.push(`     📅 Date:    ${v.published.toISOString().split('T')[0]} (${v.publishedText || formatTimeAgo(v.published)})`);
    }
    if (v.lengthSeconds) {
      lines.push(`     ⏱  Length:  ${formatDuration(v.lengthSeconds)}`);
    }
    lines.push(`     🔗 URL:     ${v.url}`);
    if (v.description) {
      lines.push(`     📝 ${v.description.replace(/\n/g, ' ').substring(0, 120)}...`);
    }
    lines.push('');
    lines.push('  ───────────────────────────────────────────────────────────');
    lines.push('');
  });
  
  lines.push(`  Generated: ${now.toISOString()}`);
  lines.push(`  Search terms: ${SEARCH_TERMS.join(', ')}`);
  lines.push(`  Channels monitored: ${Object.keys(KNOWN_CHANNELS).length}`);
  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════════');
  
  return lines.join('\n');
}

// ── CLI Entry Point ────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const asJSON = args.includes('--json');
  const countIdx = args.indexOf('--count');
  const count = countIdx >= 0 && args[countIdx + 1] ? parseInt(args[countIdx + 1], 10) : 5;
  
  try {
    const videos = await collectVideos();
    console.error(`\n✅ Found ${videos.length} total results (before dedup)\n`);
    
    const top = rankAndSort(videos, count);
    const output = formatSummary(top, asJSON);
    
    console.log(output);
    
    // Also save to file if in workspace
    const fs = require('fs');
    const path = require('path');
    const outputDir = path.join(__dirname, '..', 'memory');
    const outputFile = path.join(outputDir, `youtube-summary-${new Date().toISOString().split('T')[0]}.md`);
    
    try {
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(outputFile, `# YouTube OpenClaw Summary\n\n\`\`\`\n${output}\n\`\`\`\n`);
      console.error(`📁 Summary saved to: ${outputFile}`);
    } catch (e) {
      // Not critical if save fails
    }
    
  } catch (e) {
    console.error(`❌ Error: ${e.message}`);
    process.exit(1);
  }
}

main();
