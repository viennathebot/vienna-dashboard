#!/usr/bin/env node
/**
 * Cardiology Trials Last 30 Days
 * Fetches trending/recent cardiology trials from ClinicalTrials.gov
 * and generates summaries for social media content
 */

const https = require('https');
const fs = require('fs');

const DAYS_BACK = 30;
const OUTPUT_FILE = process.argv[2] || '/Users/vi/.openclaw/workspace/output/cardiology-trials-summary.md';

// Calculate date range
const endDate = new Date();
const startDate = new Date();
startDate.setDate(startDate.getDate() - DAYS_BACK);

const formatDate = (d) => d.toISOString().split('T')[0];

// ClinicalTrials.gov API v2
const searchTerms = [
  'interventional cardiology',
  'TAVR',
  'PCI',
  'structural heart',
  'MitraClip',
  'Watchman',
  'coronary intervention'
];

async function fetchTrials(term) {
  return new Promise((resolve, reject) => {
    const query = encodeURIComponent(term);
    const url = `https://clinicaltrials.gov/api/v2/studies?query.term=${query}&filter.advanced=AREA[StartDate]RANGE[${formatDate(startDate)},${formatDate(endDate)}]&pageSize=10&format=json`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ studies: [] });
        }
      });
    }).on('error', reject);
  });
}

async function fetchRecentFromPubMed() {
  return new Promise((resolve, reject) => {
    const query = encodeURIComponent('interventional cardiology clinical trial');
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${query}&reldate=30&datetype=pdat&retmax=20&retmode=json`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ esearchresult: { idlist: [] } });
        }
      });
    }).on('error', reject);
  });
}

async function fetchPubMedDetails(ids) {
  if (!ids.length) return [];
  return new Promise((resolve, reject) => {
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.result || {});
        } catch (e) {
          resolve({});
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('🫀 Fetching cardiology trials from last 30 days...\n');
  
  const allTrials = [];
  const seenIds = new Set();
  
  // Fetch from ClinicalTrials.gov
  for (const term of searchTerms) {
    console.log(`  Searching: ${term}`);
    try {
      const result = await fetchTrials(term);
      if (result.studies) {
        for (const study of result.studies) {
          const id = study.protocolSection?.identificationModule?.nctId;
          if (id && !seenIds.has(id)) {
            seenIds.add(id);
            allTrials.push({
              id,
              title: study.protocolSection?.identificationModule?.briefTitle || 'Unknown',
              status: study.protocolSection?.statusModule?.overallStatus || 'Unknown',
              phase: study.protocolSection?.designModule?.phases?.join(', ') || 'N/A',
              conditions: study.protocolSection?.conditionsModule?.conditions || [],
              interventions: study.protocolSection?.armsInterventionsModule?.interventions?.map(i => i.name) || [],
              startDate: study.protocolSection?.statusModule?.startDateStruct?.date || 'Unknown',
              sponsor: study.protocolSection?.sponsorCollaboratorsModule?.leadSponsor?.name || 'Unknown',
              url: `https://clinicaltrials.gov/study/${id}`
            });
          }
        }
      }
    } catch (e) {
      console.log(`    Error: ${e.message}`);
    }
  }
  
  console.log(`\n📊 Found ${allTrials.length} unique trials\n`);
  
  // Fetch PubMed articles
  console.log('📚 Fetching recent PubMed publications...');
  const pubmedSearch = await fetchRecentFromPubMed();
  const pubmedIds = pubmedSearch.esearchresult?.idlist || [];
  const pubmedDetails = await fetchPubMedDetails(pubmedIds.slice(0, 15));
  
  const articles = [];
  for (const id of pubmedIds.slice(0, 15)) {
    const detail = pubmedDetails[id];
    if (detail) {
      articles.push({
        id,
        title: detail.title || 'Unknown',
        source: detail.source || 'Unknown',
        pubdate: detail.pubdate || 'Unknown',
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
      });
    }
  }
  
  console.log(`📚 Found ${articles.length} recent publications\n`);
  
  // Generate markdown report
  let md = `# Cardiology Trials & Research - Last 30 Days\n\n`;
  md += `*Generated: ${new Date().toLocaleDateString()}*\n\n`;
  md += `---\n\n`;
  
  // Top trials section
  md += `## 🔬 Recent Clinical Trials (ClinicalTrials.gov)\n\n`;
  
  const topTrials = allTrials.slice(0, 15);
  for (const trial of topTrials) {
    md += `### ${trial.title}\n`;
    md += `- **NCT ID:** [${trial.id}](${trial.url})\n`;
    md += `- **Status:** ${trial.status}\n`;
    md += `- **Phase:** ${trial.phase}\n`;
    md += `- **Sponsor:** ${trial.sponsor}\n`;
    if (trial.conditions.length) {
      md += `- **Conditions:** ${trial.conditions.slice(0, 3).join(', ')}\n`;
    }
    if (trial.interventions.length) {
      md += `- **Interventions:** ${trial.interventions.slice(0, 3).join(', ')}\n`;
    }
    md += `\n`;
  }
  
  // PubMed section
  md += `---\n\n## 📚 Recent Publications (PubMed)\n\n`;
  
  for (const article of articles) {
    md += `- **[${article.title}](${article.url})**\n`;
    md += `  - ${article.source} (${article.pubdate})\n\n`;
  }
  
  // Social media snippets
  md += `---\n\n## 🐦 Twitter/X Content Ideas\n\n`;
  
  if (topTrials.length > 0) {
    md += `### Trial Highlights\n\n`;
    for (const trial of topTrials.slice(0, 5)) {
      md += `> 🔬 New trial: "${trial.title.slice(0, 100)}${trial.title.length > 100 ? '...' : ''}"\n`;
      md += `> Phase: ${trial.phase} | Status: ${trial.status}\n`;
      md += `> ${trial.url}\n`;
      md += `> #CardioTwitter #InterventionalCardiology\n\n`;
    }
  }
  
  // Write output
  const outputDir = require('path').dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(OUTPUT_FILE, md);
  console.log(`✅ Report saved to: ${OUTPUT_FILE}`);
  console.log(`\n📊 Summary: ${allTrials.length} trials, ${articles.length} publications`);
}

main().catch(console.error);
