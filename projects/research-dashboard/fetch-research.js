#!/usr/bin/env node
/**
 * Cardiology Research Fetcher
 * Pulls latest papers from PubMed, trials from ClinicalTrials.gov
 * Run: node fetch-research.js [topic]
 * 
 * Topics: tavr, mitraclip, pci, cto, watchman, hf, renal-denervation
 */

const https = require('https');
const fs = require('fs');

const PUBMED_SEARCH = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
const PUBMED_SUMMARY = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi';
const TRIALS_API = 'https://clinicaltrials.gov/api/v2/studies';

const TOPICS = {
    'tavr': 'transcatheter aortic valve replacement TAVR',
    'mitraclip': 'MitraClip transcatheter edge-to-edge repair TEER',
    'pci': 'percutaneous coronary intervention PCI',
    'cto': 'chronic total occlusion CTO coronary',
    'watchman': 'left atrial appendage closure LAAO Watchman',
    'hf': 'heart failure HFrEF GDMT',
    'renal-denervation': 'renal denervation hypertension',
    'structural': 'structural heart intervention',
    'interventional': 'interventional cardiology'
};

function fetch(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function searchPubMed(query, maxResults = 10) {
    console.log(`\n📚 Searching PubMed for: ${query}\n`);
    
    try {
        // Search for IDs
        const searchUrl = `${PUBMED_SEARCH}?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&sort=date&retmode=json`;
        const searchData = JSON.parse(await fetch(searchUrl));
        
        if (!searchData.esearchresult?.idlist?.length) {
            console.log('No results found');
            return [];
        }
        
        // Get summaries
        const ids = searchData.esearchresult.idlist.join(',');
        const summaryUrl = `${PUBMED_SUMMARY}?db=pubmed&id=${ids}&retmode=json`;
        const summaryData = JSON.parse(await fetch(summaryUrl));
        
        const articles = [];
        for (const id of searchData.esearchresult.idlist) {
            const article = summaryData.result[id];
            if (!article?.title) continue;
            
            articles.push({
                id,
                title: article.title,
                journal: article.source || 'Unknown',
                date: article.pubdate || 'Recent',
                authors: article.authors?.map(a => a.name) || [],
                url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
            });
            
            console.log(`• ${article.title.substring(0, 80)}...`);
            console.log(`  ${article.source} | ${article.pubdate}`);
            console.log(`  ${article.authors?.slice(0,2).map(a => a.name).join(', ')}${article.authors?.length > 2 ? ' et al.' : ''}`);
            console.log(`  → https://pubmed.ncbi.nlm.nih.gov/${id}/\n`);
        }
        
        return articles;
    } catch (e) {
        console.error('PubMed error:', e.message);
        return [];
    }
}

async function searchTrials(condition, maxResults = 5) {
    console.log(`\n🧪 Searching ClinicalTrials.gov for: ${condition}\n`);
    
    try {
        const url = `${TRIALS_API}?query.cond=${encodeURIComponent(condition)}&filter.overallStatus=RECRUITING&pageSize=${maxResults}&sort=LastUpdatePostDate:desc`;
        const data = JSON.parse(await fetch(url));
        
        if (!data.studies?.length) {
            console.log('No recruiting trials found');
            return [];
        }
        
        const trials = [];
        for (const study of data.studies) {
            const info = study.protocolSection;
            const trial = {
                nctId: info?.identificationModule?.nctId,
                title: info?.identificationModule?.briefTitle,
                status: info?.statusModule?.overallStatus,
                phase: info?.designModule?.phases?.[0],
                enrollment: info?.designModule?.enrollmentInfo?.count,
                url: `https://clinicaltrials.gov/study/${info?.identificationModule?.nctId}`
            };
            
            trials.push(trial);
            
            console.log(`• ${trial.title?.substring(0, 80)}...`);
            console.log(`  ${trial.nctId} | ${trial.phase || 'N/A'} | ${trial.status}`);
            console.log(`  Enrollment: ${trial.enrollment || 'N/A'}`);
            console.log(`  → ${trial.url}\n`);
        }
        
        return trials;
    } catch (e) {
        console.error('Trials error:', e.message);
        return [];
    }
}

async function main() {
    const topic = process.argv[2] || 'interventional';
    const query = TOPICS[topic] || topic;
    
    console.log('═'.repeat(60));
    console.log('🔬 CARDIOLOGY RESEARCH FETCHER');
    console.log('═'.repeat(60));
    console.log(`Topic: ${topic}`);
    console.log(`Query: ${query}`);
    console.log('═'.repeat(60));
    
    const articles = await searchPubMed(query + ' 2024 2025 2026');
    const trials = await searchTrials(query.split(' ')[0]);
    
    // Save results
    const results = {
        timestamp: new Date().toISOString(),
        topic,
        query,
        articles,
        trials
    };
    
    const outputPath = `${__dirname}/latest-${topic}.json`;
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to: ${outputPath}`);
    
    console.log('\n' + '═'.repeat(60));
    console.log(`Summary: ${articles.length} papers, ${trials.length} active trials`);
    console.log('═'.repeat(60));
}

main().catch(console.error);
