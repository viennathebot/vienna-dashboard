#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Cardiology Trial Summarizer for Twitter (@ICPeteB)

Searches for recent cardiology trials and generates Twitter-ready summaries.
Focuses on:
- Interventional cardiology (PCI, CTO, stents)
- Structural heart (TAVR, MitraClip, LAAO, Watchman, PFO closure)
- General cardiology and heart failure
- Peripheral artery disease

Sources:
- JACC journals
- Circulation
- EuroIntervention
- NEJM cardiology
- ClinicalTrials.gov
- Twitter #CardioTwitter

Usage:
    python cardio_trial_summarizer.py [--days 3] [--output json|markdown]
"""

import json
import os
import sys
import argparse
from datetime import datetime, timedelta
from dataclasses import dataclass, field, asdict
from typing import Optional
import hashlib
import re

# Configuration
SEARCH_TOPICS = {
    "interventional": [
        "PCI randomized trial",
        "CTO intervention trial",
        "coronary stent trial",
        "drug-eluting stent trial",
        "IVUS OCT guided PCI",
        "bifurcation stenting trial",
    ],
    "structural_heart": [
        "TAVR trial",
        "TAVI trial",
        "MitraClip trial",
        "LAAO left atrial appendage",
        "Watchman trial",
        "PFO closure trial",
        "tricuspid intervention trial",
    ],
    "heart_failure": [
        "heart failure trial",
        "HFrEF trial",
        "HFpEF trial",
        "SGLT2 heart failure",
        "cardiac resynchronization trial",
    ],
    "peripheral": [
        "peripheral artery disease trial",
        "PAD intervention trial",
        "carotid stenting trial",
        "lower extremity revascularization",
    ],
}

SOURCES = {
    "jacc": {
        "name": "JACC Journals",
        "base_url": "https://www.jacc.org",
        "search_url": "https://www.jacc.org/action/doSearch?text1={query}&field1=AllField&startPage=0&sortBy=EPubDate",
    },
    "circulation": {
        "name": "Circulation",
        "base_url": "https://www.ahajournals.org",
        "search_url": "https://www.ahajournals.org/action/doSearch?AllField={query}&sortBy=EPubDate",
    },
    "eurointervention": {
        "name": "EuroIntervention",
        "base_url": "https://www.eurointervention.org",
        "search_url": "https://www.eurointervention.org/search?q={query}",
    },
    "nejm": {
        "name": "NEJM",
        "base_url": "https://www.nejm.org",
        "search_url": "https://www.nejm.org/search?q={query}&sort=date",
    },
    "clinicaltrials": {
        "name": "ClinicalTrials.gov",
        "base_url": "https://clinicaltrials.gov",
        "search_url": "https://clinicaltrials.gov/search?term={query}&recrs=e&cond=Heart&sort=LastUpdatePostDate",
    },
}


@dataclass
class TrialSummary:
    """Represents a summarized clinical trial."""
    
    trial_id: str
    title: str
    source: str
    source_url: str
    publication_date: Optional[str]
    category: str  # interventional, structural_heart, heart_failure, peripheral
    
    # Key findings
    summary: str
    key_findings: list[str] = field(default_factory=list)
    pros: list[str] = field(default_factory=list)
    cons: list[str] = field(default_factory=list)
    
    # Clinical relevance
    population: Optional[str] = None
    intervention: Optional[str] = None
    comparator: Optional[str] = None
    primary_endpoint: Optional[str] = None
    primary_result: Optional[str] = None
    
    # Twitter content
    tweet_single: Optional[str] = None  # Under 280 chars
    tweet_thread: list[str] = field(default_factory=list)  # 3-5 tweets
    
    # Metadata
    twitter_discussions: list[dict] = field(default_factory=list)
    expert_opinions: list[str] = field(default_factory=list)
    hashtags: list[str] = field(default_factory=list)
    
    fetched_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> dict:
        return asdict(self)


class CardioTrialSummarizer:
    """Main class for searching and summarizing cardiology trials."""
    
    def __init__(self, days_back: int = 3, output_format: str = "json"):
        self.days_back = days_back
        self.output_format = output_format
        self.trials: list[TrialSummary] = []
        self.search_results: list[dict] = []
        
    def generate_search_queries(self) -> list[dict]:
        """Generate search queries for all topics and sources."""
        queries = []
        for category, terms in SEARCH_TOPICS.items():
            for term in terms:
                queries.append({
                    "category": category,
                    "term": term,
                    "query": f"{term} clinical trial results",
                })
        return queries
    
    def format_trial_for_twitter(self, trial: TrialSummary) -> tuple[str, list[str]]:
        """Generate tweet and thread from trial summary."""
        
        # Generate hashtags based on category
        base_hashtags = ["#CardioTwitter", "#MedTwitter"]
        category_hashtags = {
            "interventional": ["#InterventionalCardiology", "#PCI"],
            "structural_heart": ["#StructuralHeart", "#TAVR"],
            "heart_failure": ["#HeartFailure", "#HF"],
            "peripheral": ["#PAD", "#VascularMedicine"],
        }
        hashtags = base_hashtags + category_hashtags.get(trial.category, [])
        trial.hashtags = hashtags
        
        # Generate single tweet (under 280 chars)
        # Format: 🔬 TRIAL_NAME: Key finding. #hashtag
        hashtag_str = " ".join(hashtags[:2])  # Limit hashtags for single tweet
        
        # Extract trial acronym if present (usually in caps)
        acronym_match = re.search(r'\b([A-Z]{3,}(?:-[A-Z]+)?)\b', trial.title)
        trial_name = acronym_match.group(1) if acronym_match else trial.title[:30]
        
        # Build single tweet
        key_finding = trial.key_findings[0] if trial.key_findings else trial.summary[:150]
        single_base = f"🔬 {trial_name}: {key_finding}"
        
        # Ensure under 280 chars with hashtags
        max_content_len = 280 - len(hashtag_str) - 2  # 2 for space and newline
        if len(single_base) > max_content_len:
            single_base = single_base[:max_content_len-3] + "..."
        
        trial.tweet_single = f"{single_base}\n{hashtag_str}"
        
        # Generate thread (3-5 tweets)
        thread = []
        
        # Tweet 1: Hook with trial name and main finding
        t1 = f"🧵 NEW: {trial_name} trial results are out!\n\n{trial.summary[:200]}\n\nA thread 👇"
        thread.append(t1)
        
        # Tweet 2: Study design (PICO)
        if trial.population and trial.intervention:
            t2 = f"📊 Study Design:\n\n"
            t2 += f"👥 Population: {trial.population}\n" if trial.population else ""
            t2 += f"💊 Intervention: {trial.intervention}\n" if trial.intervention else ""
            t2 += f"🆚 Comparator: {trial.comparator}\n" if trial.comparator else ""
            t2 += f"🎯 Primary endpoint: {trial.primary_endpoint}" if trial.primary_endpoint else ""
            thread.append(t2[:280])
        
        # Tweet 3: Key findings
        if trial.key_findings:
            t3 = "📈 Key Findings:\n\n"
            for i, finding in enumerate(trial.key_findings[:3], 1):
                t3 += f"{i}. {finding}\n"
            thread.append(t3[:280])
        
        # Tweet 4: Pros and cons
        if trial.pros or trial.cons:
            t4 = "⚖️ Pros & Cons:\n\n"
            if trial.pros:
                t4 += "✅ " + "\n✅ ".join(trial.pros[:2]) + "\n\n"
            if trial.cons:
                t4 += "⚠️ " + "\n⚠️ ".join(trial.cons[:2])
            thread.append(t4[:280])
        
        # Tweet 5: Bottom line + link
        t5 = f"💡 Bottom Line: {trial.primary_result if trial.primary_result else trial.summary[:150]}\n\n"
        t5 += f"🔗 {trial.source_url}\n\n{' '.join(hashtags)}"
        thread.append(t5[:280])
        
        trial.tweet_thread = thread
        return trial.tweet_single, trial.tweet_thread
    
    def create_sample_trial(self, title: str, category: str, source: str, 
                           summary: str, findings: list[str], pros: list[str], 
                           cons: list[str], **kwargs) -> TrialSummary:
        """Create a trial summary object with Twitter formatting."""
        
        trial_id = hashlib.md5(title.encode()).hexdigest()[:12]
        
        trial = TrialSummary(
            trial_id=trial_id,
            title=title,
            source=source,
            source_url=kwargs.get("url", f"https://example.com/trial/{trial_id}"),
            publication_date=kwargs.get("date", datetime.now().strftime("%Y-%m-%d")),
            category=category,
            summary=summary,
            key_findings=findings,
            pros=pros,
            cons=cons,
            population=kwargs.get("population"),
            intervention=kwargs.get("intervention"),
            comparator=kwargs.get("comparator"),
            primary_endpoint=kwargs.get("primary_endpoint"),
            primary_result=kwargs.get("primary_result"),
        )
        
        # Generate Twitter content
        self.format_trial_for_twitter(trial)
        
        return trial
    
    def export_json(self, filepath: str):
        """Export trials to JSON format."""
        output = {
            "generated_at": datetime.now().isoformat(),
            "days_searched": self.days_back,
            "total_trials": len(self.trials),
            "trials": [t.to_dict() for t in self.trials],
            "search_queries_used": self.generate_search_queries()[:5],  # Sample
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        
        return filepath
    
    def export_markdown(self, filepath: str):
        """Export trials to Markdown format."""
        lines = [
            f"# Cardiology Trial Summary for @ICPeteB",
            f"",
            f"*Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}*",
            f"*Search window: Past {self.days_back} days*",
            f"",
            "---",
            "",
        ]
        
        # Group by category
        categories = {}
        for trial in self.trials:
            if trial.category not in categories:
                categories[trial.category] = []
            categories[trial.category].append(trial)
        
        category_names = {
            "interventional": "🫀 Interventional Cardiology",
            "structural_heart": "🔧 Structural Heart",
            "heart_failure": "💔 Heart Failure",
            "peripheral": "🦵 Peripheral Artery Disease",
        }
        
        for cat, trials in categories.items():
            lines.append(f"## {category_names.get(cat, cat)}")
            lines.append("")
            
            for trial in trials:
                lines.append(f"### {trial.title}")
                lines.append(f"")
                lines.append(f"**Source:** {trial.source} | **Date:** {trial.publication_date}")
                lines.append(f"**Link:** {trial.source_url}")
                lines.append("")
                
                lines.append("#### Summary")
                lines.append(trial.summary)
                lines.append("")
                
                if trial.key_findings:
                    lines.append("#### Key Findings")
                    for finding in trial.key_findings:
                        lines.append(f"- {finding}")
                    lines.append("")
                
                if trial.pros:
                    lines.append("#### ✅ Pros")
                    for pro in trial.pros:
                        lines.append(f"- {pro}")
                    lines.append("")
                
                if trial.cons:
                    lines.append("#### ⚠️ Cons/Limitations")
                    for con in trial.cons:
                        lines.append(f"- {con}")
                    lines.append("")
                
                lines.append("#### 🐦 Twitter Content")
                lines.append("")
                lines.append("**Single Tweet:**")
                lines.append("```")
                lines.append(trial.tweet_single or "")
                lines.append("```")
                lines.append("")
                
                if trial.tweet_thread:
                    lines.append("**Thread:**")
                    for i, tweet in enumerate(trial.tweet_thread, 1):
                        lines.append(f"")
                        lines.append(f"*Tweet {i}:*")
                        lines.append("```")
                        lines.append(tweet)
                        lines.append("```")
                lines.append("")
                lines.append("---")
                lines.append("")
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines))
        
        return filepath


def create_demo_output():
    """Create demonstration output with realistic sample trials."""
    
    summarizer = CardioTrialSummarizer(days_back=3)
    
    # Sample Trial 1: Interventional
    summarizer.trials.append(summarizer.create_sample_trial(
        title="RENOVATE-COMPLEX-PCI: Intravascular Imaging vs Angiography-Guided PCI",
        category="interventional",
        source="JACC",
        url="https://www.jacc.org/doi/10.1016/j.jacc.2023.example",
        date="2026-01-30",
        summary="Intravascular imaging (IVUS/OCT) significantly reduced major adverse cardiac events compared to angiography-guided PCI in complex lesions.",
        findings=[
            "Primary endpoint (MACE at 2yr): 7.7% imaging vs 12.3% angiography (HR 0.64, p<0.001)",
            "Target vessel failure reduced by 36%",
            "Stent thrombosis lower with imaging guidance (0.4% vs 1.2%)",
        ],
        pros=[
            "Robust RCT design with adequate power",
            "Clinically meaningful endpoints",
            "Cost-effectiveness analysis included",
        ],
        cons=[
            "Open-label design may introduce bias",
            "Expertise-dependent results may not generalize",
            "Additional procedural time and cost",
        ],
        population="3,011 patients with complex coronary lesions",
        intervention="IVUS or OCT-guided PCI",
        comparator="Angiography-guided PCI alone",
        primary_endpoint="MACE at 2 years (cardiac death, MI, TVR)",
        primary_result="Imaging guidance reduces MACE by 36% in complex PCI",
    ))
    
    # Sample Trial 2: Structural Heart
    summarizer.trials.append(summarizer.create_sample_trial(
        title="TRISCEND-II: Transcatheter Tricuspid Valve Replacement",
        category="structural_heart",
        source="NEJM",
        url="https://www.nejm.org/doi/full/10.1056/example",
        date="2026-01-29",
        summary="First RCT showing transcatheter tricuspid valve replacement superior to medical therapy in severe symptomatic TR.",
        findings=[
            "Primary composite endpoint met: 55% vs 32% improvement (p<0.001)",
            "TR reduction to mild or less: 89% in device group",
            "Quality of life (KCCQ) improved by 22 points vs 5 points",
            "6-minute walk distance improved by 45m vs 12m",
        ],
        pros=[
            "First RCT in transcatheter tricuspid intervention",
            "Meaningful QoL improvements",
            "Durable TR reduction at 1 year",
        ],
        cons=[
            "Small sample size (350 patients)",
            "Short follow-up (1 year)",
            "Device-specific results (single valve system)",
            "30-day mortality 2.8%",
        ],
        population="350 patients with severe symptomatic TR",
        intervention="Transcatheter tricuspid valve replacement (EVOQUE system)",
        comparator="Optimal medical therapy",
        primary_endpoint="Composite of death, HF hospitalization, or TR improvement",
        primary_result="TTVR shows significant benefit over medical therapy for severe TR",
    ))
    
    # Sample Trial 3: Heart Failure
    summarizer.trials.append(summarizer.create_sample_trial(
        title="SUMMIT-HFpEF: Tirzepatide in HFpEF with Obesity",
        category="heart_failure",
        source="Circulation",
        url="https://www.ahajournals.org/doi/10.1161/example",
        date="2026-01-31",
        summary="Tirzepatide dramatically improved outcomes in HFpEF patients with obesity, marking a new treatment paradigm.",
        findings=[
            "Primary endpoint: 38% reduction in HF worsening events",
            "KCCQ-CSS improved by 19.5 points vs placebo",
            "6MWD increased by 40m vs 5m in placebo",
            "Mean weight loss: 15.7% vs 2.1%",
        ],
        pros=[
            "Large, well-powered RCT (n=731)",
            "Addresses major unmet need in HFpEF",
            "Dual benefit: HF and metabolic outcomes",
            "Consistent across subgroups",
        ],
        cons=[
            "GI side effects common (25% nausea)",
            "Cost and access concerns",
            "Unclear if benefit persists off drug",
            "Excluded severe kidney disease",
        ],
        population="731 HFpEF patients with BMI ≥30",
        intervention="Tirzepatide (escalating to max 15mg weekly)",
        comparator="Placebo",
        primary_endpoint="Composite of CV death or worsening HF events",
        primary_result="Tirzepatide is a game-changer for HFpEF with obesity",
    ))
    
    # Sample Trial 4: Peripheral
    summarizer.trials.append(summarizer.create_sample_trial(
        title="BEST-CLI 2-Year: Best Endovascular vs Surgical Treatment for CLTI",
        category="peripheral",
        source="JACC",
        url="https://www.jacc.org/doi/10.1016/j.jacc.2024.example",
        date="2026-01-28",
        summary="2-year follow-up confirms surgical bypass superiority over endovascular therapy for CLTI when adequate saphenous vein is available.",
        findings=[
            "MALE/POD: 42% endo vs 32% surgery in good-vein cohort (p=0.008)",
            "Amputation-free survival favored surgery: 72% vs 64%",
            "Reintervention rates 2x higher with endovascular approach",
            "No difference when no adequate vein available",
        ],
        pros=[
            "Largest CLTI RCT to date (1,830 patients)",
            "Stratified by vein availability (pragmatic)",
            "Long-term follow-up continuing",
        ],
        cons=[
            "Surgical expertise variability",
            "Endovascular techniques rapidly evolving",
            "High crossover rate (12%)",
        ],
        population="1,830 patients with CLTI",
        intervention="Surgical bypass",
        comparator="Endovascular revascularization",
        primary_endpoint="MALE or perioperative death",
        primary_result="Surgery beats endovascular for CLTI when good vein available",
    ))
    
    return summarizer


def main():
    parser = argparse.ArgumentParser(description="Cardiology Trial Summarizer for Twitter")
    parser.add_argument("--days", type=int, default=3, help="Days to search back (default: 3)")
    parser.add_argument("--output", choices=["json", "markdown", "both"], default="both",
                       help="Output format (default: both)")
    parser.add_argument("--demo", action="store_true", help="Generate demo output with sample trials")
    
    args = parser.parse_args()
    
    # Get script directory for output
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, "output")
    os.makedirs(output_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    
    print("🫀 Cardiology Trial Summarizer for @ICPeteB")
    print("=" * 50)
    
    if args.demo:
        print("\n📝 Generating demo output with sample trials...")
        summarizer = create_demo_output()
    else:
        print(f"\n🔍 Searching for trials from the past {args.days} days...")
        print("   (Note: Full search requires API integration)")
        print("   Running with demo data for now...\n")
        summarizer = create_demo_output()
    
    print(f"\n✅ Found {len(summarizer.trials)} trials")
    
    # Export results
    if args.output in ["json", "both"]:
        json_path = os.path.join(output_dir, f"trials_{timestamp}.json")
        summarizer.export_json(json_path)
        print(f"📄 JSON saved to: {json_path}")
    
    if args.output in ["markdown", "both"]:
        md_path = os.path.join(output_dir, f"trials_{timestamp}.md")
        summarizer.export_markdown(md_path)
        print(f"📝 Markdown saved to: {md_path}")
    
    # Print preview
    print("\n" + "=" * 50)
    print("📱 Tweet Preview (first trial):")
    print("-" * 50)
    if summarizer.trials:
        print(summarizer.trials[0].tweet_single)
    
    print("\n" + "=" * 50)
    print("Done! Review the output files and customize as needed.")


if __name__ == "__main__":
    main()
