#!/usr/bin/env python3
"""
Live Search Module for Cardiology Trial Summarizer

This module provides functions to search for real trial data from various sources.
It's designed to be called from the main summarizer or can run standalone.

Usage:
    python live_search.py --source all --days 3
    
For use with OpenClaw agent (recommended):
    The agent can use web_search and web_fetch tools to populate search results,
    then pass them to the summarizer for formatting.
"""

import json
import os
import re
from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import Optional


@dataclass
class SearchResult:
    """Raw search result before processing."""
    title: str
    url: str
    snippet: str
    source: str
    date_found: Optional[str] = None


# Search query templates optimized for each source
SEARCH_QUERIES = {
    "jacc": [
        'site:jacc.org "randomized" "trial" cardiology',
        'site:jacc.org TAVR OR TAVI trial results',
        'site:jacc.org PCI stent trial',
        'site:jacc.org heart failure trial',
    ],
    "circulation": [
        'site:ahajournals.org/journal/circ "randomized trial"',
        'site:ahajournals.org heart failure clinical trial',
        'site:ahajournals.org interventional cardiology trial',
    ],
    "nejm": [
        'site:nejm.org cardiology trial',
        'site:nejm.org heart failure randomized',
        'site:nejm.org structural heart disease trial',
    ],
    "eurointervention": [
        'site:eurointervention.org trial',
        'site:eurointervention.org PCI randomized',
    ],
    "clinicaltrials": [
        'site:clinicaltrials.gov "results posted" cardiology',
        'site:clinicaltrials.gov heart failure "primary completion"',
    ],
    "twitter_cardio": [
        '#CardioTwitter trial results',
        '#CardioTwitter breaking study',
        'cardiology twitter trial presentation',
    ],
    "general": [
        'cardiology clinical trial results 2026',
        'interventional cardiology randomized trial latest',
        'structural heart disease trial results',
        'TAVR MitraClip Watchman trial new',
        'PCI CTO intervention trial recent',
    ],
}


def generate_search_queries(sources: list[str] = None, days: int = 3) -> list[dict]:
    """Generate search queries for specified sources."""
    
    if sources is None or "all" in sources:
        sources = list(SEARCH_QUERIES.keys())
    
    queries = []
    for source in sources:
        if source in SEARCH_QUERIES:
            for query in SEARCH_QUERIES[source]:
                queries.append({
                    "source": source,
                    "query": query,
                    "days_filter": days,
                })
    
    return queries


def parse_trial_from_snippet(result: SearchResult) -> dict:
    """Extract trial information from a search result snippet."""
    
    trial_info = {
        "title": result.title,
        "url": result.url,
        "source": result.source,
        "raw_snippet": result.snippet,
    }
    
    # Try to extract trial acronym (usually in caps)
    acronym_match = re.search(r'\b([A-Z]{3,}(?:-[A-Z0-9]+)*)\b', result.title)
    if acronym_match:
        trial_info["acronym"] = acronym_match.group(1)
    
    # Try to extract key statistics from snippet
    # Look for percentages
    percentages = re.findall(r'(\d+\.?\d*)\s*%', result.snippet)
    if percentages:
        trial_info["mentioned_percentages"] = percentages
    
    # Look for hazard ratios
    hr_match = re.search(r'HR\s*[=:]?\s*(\d+\.?\d*)', result.snippet, re.IGNORECASE)
    if hr_match:
        trial_info["hazard_ratio"] = hr_match.group(1)
    
    # Look for p-values
    p_match = re.search(r'p\s*[=<]\s*(\d+\.?\d*)', result.snippet, re.IGNORECASE)
    if p_match:
        trial_info["p_value"] = p_match.group(1)
    
    # Look for patient counts
    n_match = re.search(r'[nN]\s*=\s*(\d+[,\d]*)', result.snippet)
    if n_match:
        trial_info["patient_count"] = n_match.group(1).replace(",", "")
    
    # Categorize based on keywords
    text_lower = (result.title + " " + result.snippet).lower()
    
    if any(kw in text_lower for kw in ["pci", "stent", "cto", "intervention", "angioplasty"]):
        trial_info["category"] = "interventional"
    elif any(kw in text_lower for kw in ["tavr", "tavi", "mitraclip", "watchman", "laao", "pfo", "structural"]):
        trial_info["category"] = "structural_heart"
    elif any(kw in text_lower for kw in ["heart failure", "hfref", "hfpef", "sglt2", "entresto"]):
        trial_info["category"] = "heart_failure"
    elif any(kw in text_lower for kw in ["peripheral", "pad", "cli", "limb", "carotid"]):
        trial_info["category"] = "peripheral"
    else:
        trial_info["category"] = "general_cardiology"
    
    return trial_info


def format_for_agent_prompt(queries: list[dict]) -> str:
    """Format queries as a prompt for the OpenClaw agent to execute."""
    
    prompt = """
## Cardiology Trial Search Task

Please search for recent cardiology trial results using these queries and sources.
For each result found, extract and summarize the key information.

### Search Queries to Execute:

"""
    for i, q in enumerate(queries[:10], 1):  # Limit to 10 queries
        prompt += f"{i}. **{q['source']}**: `{q['query']}`\n"
    
    prompt += """

### For each relevant trial found, extract:
1. Trial name/acronym
2. Publication source and date
3. Key findings (primary endpoint results)
4. Study population and size
5. Main conclusions

### Then format as:
- Single tweet (under 280 chars)
- Thread (3-5 tweets)
- List of relevant hashtags

Save results to the output directory in both JSON and Markdown formats.
"""
    return prompt


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Live Search for Cardiology Trials")
    parser.add_argument("--source", default="all", 
                       help="Source to search (jacc, circulation, nejm, all)")
    parser.add_argument("--days", type=int, default=3, help="Days to search back")
    parser.add_argument("--output", default="queries", choices=["queries", "prompt"],
                       help="Output format")
    
    args = parser.parse_args()
    
    sources = [args.source] if args.source != "all" else None
    queries = generate_search_queries(sources, args.days)
    
    if args.output == "prompt":
        print(format_for_agent_prompt(queries))
    else:
        print(f"Generated {len(queries)} search queries:\n")
        for q in queries:
            print(f"  [{q['source']}] {q['query']}")
    
    # Save queries to file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(script_dir, "output", "search_queries.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump({
            "generated_at": datetime.now().isoformat(),
            "queries": queries,
        }, f, indent=2)
    
    print(f"\nQueries saved to: {output_path}")


if __name__ == "__main__":
    main()
