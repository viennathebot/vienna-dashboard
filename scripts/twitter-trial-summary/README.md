# 🫀 Cardiology Trial Summarizer for Twitter

A tool for Dr. B (@ICPeteB) to find, summarize, and tweet about the latest cardiology trials.

## Features

- **Multi-source search**: JACC, Circulation, EuroIntervention, NEJM, ClinicalTrials.gov
- **Category filtering**: Interventional, Structural Heart, Heart Failure, Peripheral
- **Auto-formatting**: Generates ready-to-post tweets and threads
- **Dual output**: JSON for automation, Markdown for review
- **Twitter-optimized**: Hashtags, thread structure, character limits

## Quick Start

```bash
# Navigate to the script directory
cd /Users/vi/.openclaw/workspace/scripts/twitter-trial-summary

# Run with demo data (always works)
python cardio_trial_summarizer.py --demo

# View output
ls output/
```

## Usage

### Basic Commands

```bash
# Generate with demo data (for testing)
python cardio_trial_summarizer.py --demo

# Search past 3 days (default)
python cardio_trial_summarizer.py

# Search past 7 days
python cardio_trial_summarizer.py --days 7

# Output JSON only
python cardio_trial_summarizer.py --output json

# Output Markdown only
python cardio_trial_summarizer.py --output markdown
```

### Using with OpenClaw Agent

The most powerful way to use this tool is with the OpenClaw agent for live web searches:

1. Ask the agent to search for recent cardiology trials
2. The agent uses `web_search` and `web_fetch` to find real data
3. Results are formatted using this script's templates
4. Output is saved to the `output/` directory

Example prompt:
```
"Search for cardiology trials published in the last 48 hours and 
format them for Twitter using the trial summarizer script"
```

### Live Search Module

The `live_search.py` module generates optimized search queries:

```bash
# Show all search queries
python live_search.py --source all

# Get agent prompt format
python live_search.py --output prompt

# Search specific source
python live_search.py --source jacc --days 3
```

## Output Format

### JSON Structure

```json
{
  "generated_at": "2026-02-01T15:00:00",
  "days_searched": 3,
  "total_trials": 4,
  "trials": [
    {
      "trial_id": "abc123",
      "title": "RENOVATE-COMPLEX-PCI",
      "source": "JACC",
      "category": "interventional",
      "summary": "...",
      "key_findings": ["..."],
      "pros": ["..."],
      "cons": ["..."],
      "tweet_single": "🔬 RENOVATE: IVUS/OCT...",
      "tweet_thread": ["🧵 NEW: ...", "📊 ...", "..."],
      "hashtags": ["#CardioTwitter", "#PCI"]
    }
  ]
}
```

### Markdown Structure

The Markdown output includes:
- Trials grouped by category
- Full summaries with pros/cons
- Ready-to-copy tweet text
- Formatted threads with tweet numbering

## Categories

| Category | Keywords | Hashtags |
|----------|----------|----------|
| Interventional | PCI, CTO, stents, IVUS, OCT | #InterventionalCardiology #PCI |
| Structural Heart | TAVR, MitraClip, LAAO, Watchman, PFO | #StructuralHeart #TAVR |
| Heart Failure | HFrEF, HFpEF, SGLT2 | #HeartFailure #HF |
| Peripheral | PAD, CLTI, carotid | #PAD #VascularMedicine |

## Sources

| Source | URL | Focus |
|--------|-----|-------|
| JACC | jacc.org | All cardiology |
| Circulation | ahajournals.org | AHA journals |
| EuroIntervention | eurointervention.org | Interventional |
| NEJM | nejm.org | Major trials |
| ClinicalTrials.gov | clinicaltrials.gov | Results database |
| Twitter | #CardioTwitter | Expert discussions |

## Tweet Templates

### Single Tweet (< 280 chars)
```
🔬 TRIAL_NAME: Key finding in one sentence.
#CardioTwitter #Relevant #Hashtags
```

### Thread Format
```
1/5 🧵 NEW: [TRIAL] results are out!
[One-line summary of finding]
A thread 👇

2/5 📊 Study Design:
👥 Population: ...
💊 Intervention: ...
🆚 Comparator: ...
🎯 Primary endpoint: ...

3/5 📈 Key Findings:
1. Finding one
2. Finding two
3. Finding three

4/5 ⚖️ Pros & Cons:
✅ Pro 1
✅ Pro 2
⚠️ Con 1
⚠️ Con 2

5/5 💡 Bottom Line: [Takeaway]
🔗 [Link]
#CardioTwitter #Hashtags
```

## Automation with Cron

To run daily at 6 AM:

```bash
# Edit crontab
crontab -e

# Add line:
0 6 * * * cd /Users/vi/.openclaw/workspace/scripts/twitter-trial-summary && python cardio_trial_summarizer.py --demo >> output/cron.log 2>&1
```

Or use OpenClaw's cron feature:
```
/cron add "cardio-trials" "0 6 * * *" "Search for new cardiology trials and format for Twitter"
```

## File Structure

```
twitter-trial-summary/
├── cardio_trial_summarizer.py  # Main script
├── live_search.py              # Search query generator
├── README.md                   # This file
└── output/
    ├── trials_YYYYMMDD_HHMM.json
    ├── trials_YYYYMMDD_HHMM.md
    └── search_queries.json
```

## Customization

### Adding New Sources

Edit `SOURCES` dict in `cardio_trial_summarizer.py`:

```python
SOURCES["new_journal"] = {
    "name": "New Journal",
    "base_url": "https://newjournal.org",
    "search_url": "https://newjournal.org/search?q={query}",
}
```

### Adding New Categories

Edit `SEARCH_TOPICS` dict:

```python
SEARCH_TOPICS["electrophysiology"] = [
    "ablation trial",
    "AFib rhythm control",
    "leadless pacemaker",
]
```

### Modifying Tweet Templates

Customize the `format_trial_for_twitter()` method for different tweet styles.

## Roadmap

- [ ] Direct API integration with journal sites
- [ ] Twitter API posting (with approval workflow)
- [ ] AI-powered summary generation
- [ ] Expert opinion aggregation from Twitter
- [ ] Citation tracking and impact metrics

## Support

Created for @ICPeteB. Feedback welcome!
