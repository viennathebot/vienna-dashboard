#!/usr/bin/env node
/**
 * Cardiology Trials & Research - Weekly Summary v2
 * Sources: ClinicalTrials.gov, PubMed, ACC, AHA, ESC RSS feeds
 * Emails summary to Dr. B on Sundays
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const { execSync } = require('child_process');

const DAYS_BACK = 7; // Weekly
const OUTPUT_FILE = '/Users/vi/.openclaw/workspace/output/cardiology-trials-weekly.md';
const DR_B_EMAIL = 'peterbleszynski@gmail.com'; // Update if different

// Calculate date range
const endDate = new Date();
const startDate = new Date();
startDate.setDate(startDate.getDate() - DAYS_BACK);
const formatDate = (d) => d.toISOString().split('T')[0];

// Search terms for interventional/structural cardiology
const searchTerms = [
  'interventional cardiology',
  'TAVR transcatheter aortic valve',
  'PCI percutaneous coronary intervention',
  'structural heart disease',
  'MitraClip mitral valve',
  'Watchman left atrial appendage',
  'coronary intervention stent',
  'CTO chronic total occlusion',
  'TEER transcatheter edge-to-edge repair',
  'renal denervation hypertension'
];

// Major journals to highlight
const majorJournals = [
  'JACC', 'J Am Coll Cardiol', 'Circulation', 'Lancet', 'NEJM', 
  'N Engl J Med', 'Eur Heart J', 'JAMA Cardiol', 'Heart'
];

async function fetch(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function fetchTrials(term) {
  try {
    const query = encodeURIComponent(term);
    const url = `https://clinicaltrials.gov/api/v2/studies?query.term=${query}&filter.advanced=AREA[StartDate]RANGE[${formatDate(startDate)},${formatDate(endDate)}]&pageSize=15&format=json`;
    const data = await fetch(url);
    return JSON.parse(data);
  } catch (e) {
    return { studies: [] };
  }
}

async function fetchPubMed(term, days = 7) {
  try {
    const query = encodeURIComponent(term);
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${query}&reldate=${days}&datetype=pdat&retmax=30&retmode=json`;
    const data = await fetch(url);
    return JSON.parse(data);
  } catch (e) {
    return { esearchresult: { idlist: [] } };
  }
}

async function fetchPubMedDetails(ids) {
  if (!ids.length) return {};
  try {
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
    const data = await fetch(url);
    return JSON.parse(data).result || {};
  } catch (e) {
    return {};
  }
}

async function fetchRSSFeed(url, sourceName) {
  try {
    const data = await fetch(url);
    // Simple RSS parsing
    const items = [];
    const matches = data.matchAll(/<item>[\s\S]*?<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>[\s\S]*?<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>[\s\S]*?<\/item>/gi);
    for (const match of matches) {
      items.push({
        title: match[1].replace(/<[^>]+>/g, '').trim(),
        url: match[2].trim(),
        source: sourceName
      });
    }
    return items.slice(0, 10);
  } catch (e) {
    console.log(`  RSS error (${sourceName}): ${e.message}`);
    return [];
  }
}

async function main() {
  console.log('🫀 Fetching cardiology updates (last 7 days)...\n');
  
  const allTrials = [];
  const seenTrialIds = new Set();
  const allArticles = [];
  const seenArticleIds = new Set();
  const majorFindings = [];
  
  // 1. ClinicalTrials.gov
  console.log('📋 Searching ClinicalTrials.gov...');
  for (const term of searchTerms) {
    const result = await fetchTrials(term);
    if (result.studies) {
      for (const study of result.studies) {
        const id = study.protocolSection?.identificationModule?.nctId;
        if (id && !seenTrialIds.has(id)) {
          seenTrialIds.add(id);
          const trial = {
            id,
            title: study.protocolSection?.identificationModule?.briefTitle || 'Unknown',
            status: study.protocolSection?.statusModule?.overallStatus || 'Unknown',
            phase: study.protocolSection?.designModule?.phases?.join(', ') || 'N/A',
            conditions: study.protocolSection?.conditionsModule?.conditions || [],
            interventions: study.protocolSection?.armsInterventionsModule?.interventions?.map(i => i.name) || [],
            sponsor: study.protocolSection?.sponsorCollaboratorsModule?.leadSponsor?.name || 'Unknown',
            url: `https://clinicaltrials.gov/study/${id}`
          };
          allTrials.push(trial);
          
          // Flag major trials (Phase 3, major sponsors)
          if (trial.phase.includes('PHASE3') || trial.phase.includes('Phase 3')) {
            majorFindings.push({ type: 'trial', data: trial });
          }
        }
      }
    }
  }
  console.log(`  Found ${allTrials.length} trials`);
  
  // 2. PubMed
  console.log('📚 Searching PubMed...');
  for (const term of ['interventional cardiology', 'TAVR', 'structural heart']) {
    const search = await fetchPubMed(term, 7);
    const ids = search.esearchresult?.idlist || [];
    if (ids.length) {
      const details = await fetchPubMedDetails(ids);
      for (const id of ids) {
        if (!seenArticleIds.has(id) && details[id]) {
          seenArticleIds.add(id);
          const article = {
            id,
            title: details[id].title || 'Unknown',
            source: details[id].source || 'Unknown',
            pubdate: details[id].pubdate || 'Unknown',
            url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
          };
          allArticles.push(article);
          
          // Flag major journal articles
          if (majorJournals.some(j => article.source.includes(j))) {
            majorFindings.push({ type: 'article', data: article });
          }
        }
      }
    }
  }
  console.log(`  Found ${allArticles.length} articles`);
  
  // 3. RSS Feeds (ACC, AHA, ESC)
  console.log('📡 Checking RSS feeds...');
  const rssFeeds = [
    ['https://www.acc.org/rss/Clinical-Topics/Interventional-Cardiology.xml', 'ACC'],
    ['https://www.ahajournals.org/action/showFeed?type=etoc&feed=rss&jc=circ', 'Circulation'],
  ];
  
  for (const [url, name] of rssFeeds) {
    const items = await fetchRSSFeed(url, name);
    console.log(`  ${name}: ${items.length} items`);
    for (const item of items) {
      if (!seenArticleIds.has(item.url)) {
        seenArticleIds.add(item.url);
        allArticles.push(item);
      }
    }
  }
  
  // Generate Report
  console.log('\n📝 Generating report...');
  
  let md = `# 🫀 Weekly Cardiology Update\n\n`;
  md += `**Week of ${formatDate(startDate)} to ${formatDate(endDate)}**\n\n`;
  md += `---\n\n`;
  
  // Executive Summary
  md += `## 📊 Executive Summary\n\n`;
  md += `- **${allTrials.length}** new/updated clinical trials\n`;
  md += `- **${allArticles.length}** recent publications\n`;
  md += `- **${majorFindings.length}** major findings flagged\n\n`;
  
  // Major Findings (for email alert)
  if (majorFindings.length > 0) {
    md += `## 🚨 Major Findings This Week\n\n`;
    for (const finding of majorFindings.slice(0, 10)) {
      if (finding.type === 'trial') {
        md += `### 🔬 ${finding.data.title}\n`;
        md += `- Phase: ${finding.data.phase} | [NCT ${finding.data.id}](${finding.data.url})\n\n`;
      } else {
        md += `### 📄 ${finding.data.title}\n`;
        md += `- ${finding.data.source} | [PubMed](${finding.data.url})\n\n`;
      }
    }
  }
  
  // Trials Section
  md += `---\n\n## 🔬 Clinical Trials\n\n`;
  for (const trial of allTrials.slice(0, 20)) {
    md += `- **[${trial.id}](${trial.url})**: ${trial.title}\n`;
    md += `  - ${trial.phase} | ${trial.status} | ${trial.sponsor}\n\n`;
  }
  
  // Publications Section
  md += `---\n\n## 📚 Recent Publications\n\n`;
  for (const article of allArticles.slice(0, 20)) {
    md += `- **[${article.title}](${article.url})**\n`;
    md += `  - ${article.source} ${article.pubdate ? `(${article.pubdate})` : ''}\n\n`;
  }
  
  // Twitter Content
  md += `---\n\n## 🐦 Twitter Content Ideas\n\n`;
  for (const finding of majorFindings.slice(0, 5)) {
    if (finding.type === 'article') {
      md += `> 📄 New in ${finding.data.source}: "${finding.data.title.slice(0, 80)}..."\n`;
      md += `> ${finding.data.url}\n`;
      md += `> #CardioTwitter #Cardiology\n\n`;
    }
  }
  
  // Save report
  fs.writeFileSync(OUTPUT_FILE, md);
  console.log(`\n✅ Report saved: ${OUTPUT_FILE}`);
  
  // Return summary for cron notification
  const summary = {
    trials: allTrials.length,
    articles: allArticles.length,
    major: majorFindings.length,
    file: OUTPUT_FILE
  };
  
  console.log(`\n📊 Summary: ${summary.trials} trials, ${summary.articles} articles, ${summary.major} major findings`);
  
  // Output JSON for cron job to parse
  console.log(`\n::JSON::${JSON.stringify(summary)}::JSON::`);
}

main().catch(console.error);
