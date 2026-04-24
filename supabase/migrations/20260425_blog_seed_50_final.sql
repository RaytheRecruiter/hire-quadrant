-- PR X21: Third batch of 50 blog posts. Dollar-quoted bodies, idempotent.

insert into blog_posts (slug, title, excerpt, body, category, published, published_at)
values

-- ============ COMPENSATION DEEP-DIVES (10) ============
('understanding-total-comp',
 'Understanding Total Compensation',
 'Base is only one of five levers. Here is how to evaluate an offer holistically.',
 $body$## The five components
Base, bonus, equity, benefits, retirement. An offer with $180K base but no bonus or equity may pay less than $150K + 20% bonus + meaningful equity.

## Equity: paper vs real
Early-stage equity is expected value near zero. Growth-stage equity has a wide distribution. Public equity is liquid — treat as a 4-year bond at strike.

## Bonus structures
Individual bonus, company bonus, or both. Signing bonus usually has clawback clauses tied to 1-year minimum tenure.

## Benefits as real money
401k match (5-8% = $5K-$15K annually at average pay). Health premiums (employer-paid = $5K-$12K annually). Learning stipend, equipment, meals. Add it up.

## What most candidates miss
Vacation days. Sabbatical policy. Parental leave. 401k vesting schedule. These can matter more than $10K base once you factor lifetime value.$body$,
 'career', true, now() - interval '1 day'),

('compensation-by-city-2026',
 'Compensation Benchmarks by City in 2026',
 'SF, NYC, Austin, Seattle, Remote — what senior IC roles actually pay.',
 $body$## San Francisco Bay Area
Still the highest-paying market in the US for tech. Senior IC base $220K-$280K, total $350K-$500K with equity at growth-stage companies.

## New York City
Parity with SF at public companies, 10-15% below SF at startups. Finance pays premium for tech — quants can exceed $500K total.

## Seattle
Microsoft and Amazon anchor the market. Senior IC base $200K-$260K. Total comp 10-15% below SF on average.

## Austin
10-25% below SF for tech roles. Cost of living offsets much of the gap. Remote-friendly culture helps retain talent despite the discount.

## Remote (US)
Most remote-first companies pay "SF remote" (matching SF base) or "geo-adjusted" (typically 10-20% below SF). Read the offer carefully.$body$,
 'industry', true, now() - interval '8 days'),

('equity-valuation-startup',
 'Valuing Startup Equity Realistically',
 'Founders pitch dreams. Here is the math.',
 $body$## The formula
Your equity value = (your shares / total shares outstanding) × estimated exit value × (1 - dilution). Dilution for future rounds can be 20-40%.

## The honest distribution
Most venture-backed startups fail or return under 1x. Of the winners, 80% of the value goes to 20% of employees (early hires, top performers). Plan for zero.

## Strike price matters
If strike is high relative to current 409A, exercising early can be expensive. If it is low, early exercise with 83(b) can save massive taxes.

## Cliff and vesting
1-year cliff means 25% at year 1. Monthly after that. Leaving before cliff = zero. Leaving after 2 years = 50%.

## How to ask
Ask for: number of shares, total shares outstanding, current preferred price, last valuation date, vesting terms, acceleration clauses. Refusal to share signals misalignment.$body$,
 'career', true, now() - interval '16 days'),

('sign-on-bonus-negotiation',
 'Sign-On Bonus: What Candidates Get Wrong',
 'This lever is easier to move than base — and often overlooked.',
 $body$## Why companies prefer sign-ons
Sign-on bonus does not compound into base — it is one-time cost that closes a gap without raising their compensation bands.

## What to ask for
$15K-$40K for mid-to-senior IC. $50K-$100K+ for senior engineering management. More for executives. Sign-ons scale with seniority.

## Clawback clauses
Most have 1-year minimum tenure. Some have pro-rated clawback (leave at 6 months, owe back 50%). Read carefully.

## Trading leverage
If base is capped by company bands, offer to accept the base in exchange for a larger sign-on. Most companies can flex by $10K-$20K.

## Competing offer math
A sign-on bonus of $30K across 1 year is approximately $30K/year of extra comp in year 1. Use it to close short-term gaps while they lobby for base increases later.$body$,
 'career', true, now() - interval '24 days'),

('rsu-vs-options',
 'RSUs vs Stock Options: Which Is Better for You?',
 'Different instruments, different risks, different tax treatment.',
 $body$## RSUs
Restricted Stock Units. Vest over time. Taxed as income at vesting based on current share price. No exercise needed. Better for public companies.

## ISO (Incentive Stock Options)
Private-company options with favorable tax treatment if held long enough (1 year post-exercise + 2 years post-grant). Limit: $100K worth vest per year for ISO treatment.

## NSO (Non-Qualified Stock Options)
Taxed as ordinary income on exercise. Less favorable than ISOs but fewer restrictions.

## Risk profile
RSUs: predictable value tied to share price. ISOs: potentially much higher upside, but you must exercise and pay tax to capture it.

## What to ask for in negotiation
Public companies: RSU quantity. Private companies: strike price, current 409A, and whether they support early exercise with 83(b).$body$,
 'career', true, now() - interval '34 days'),

('negotiating-second-offer',
 'Using a Second Offer to Renegotiate',
 'The leverage move that works when used honestly.',
 $body$## When to use it
Only with a real competing offer. Bluffing gets caught — most companies verify or probe. Lying destroys your reputation in the ecosystem.

## The script
"Thank you for the offer. I wanted to be transparent — I have a competing offer at Company X for $Y total. I would prefer to join you. Is there flexibility?"

## What usually moves
Base: 5-10% bump. Sign-on: 50-100% increase. Equity: 10-25% increase if public, harder if private. Start date: almost always flexible.

## What does not move
Title level (usually set by headcount/band). Non-standard clauses. Remote policy. Vacation.

## The followup
Give them 48-72 hours to respond. Do not ghost the second offer — even if you take yours, respond professionally within a week.$body$,
 'career', true, now() - interval '44 days'),

('executive-severance-terms',
 'Executive Severance Terms You Must Get in Writing',
 'The most expensive thing executives forget to negotiate on entry.',
 $body$## Severance length
3-6 months at offer level is baseline for VPs. 6-12 months for C-level. Tied to base or total comp — negotiate total.

## Double-trigger acceleration
Equity accelerates fully if you are terminated within 12-24 months of acquisition. Industry standard for executives. Push back hard if absent.

## Good reason resignation
You can leave for cause (pay cut, role reduction, relocation) and keep severance. Without this clause, demotion to oblivion = quit without package.

## Non-compete and garden leave
Trade a long non-compete for paid garden leave. Usually better for you if the industry is small.

## The legal review
Spend $1K-$3K on an employment lawyer before signing any exec offer. The ROI is 10-100x when the exit happens.$body$,
 'career', true, now() - interval '54 days'),

('benefits-worth-negotiating',
 'Benefits Worth Negotiating (That Candidates Overlook)',
 'Base is hard. These levers are easier.',
 $body$## Extra vacation
1 week of extra vacation = ~2% of salary in value. Easier to grant than raising base. Ask.

## Learning and conference budget
$2K-$5K annual learning budget + 1 conference per year. Most companies say yes to this instantly.

## Equipment allowance
$2K-$3K one-time for laptop, monitor, ergonomic chair. Standard for remote roles.

## Parental leave top-up
If company policy is 12 weeks and you want 20, ask for a top-up. Many employers approve.

## Sabbatical clause
Some companies offer 4-8 weeks unpaid sabbatical after 3 or 5 years. Ask for it in writing if not default.

## The hidden ones
Home internet reimbursement. Wellness stipend. Therapy coverage. Dependent care FSA. These add up to $5K-$10K tax-advantaged value.$body$,
 'career', true, now() - interval '64 days'),

('when-base-pay-matters-most',
 'When Base Pay Matters More Than Equity',
 'Not every career stage rewards the equity gamble.',
 $body$## Early career
Take the base. You need cash flow to build runway, pay student loans, and take risks later. Equity lottery tickets compound nothing if you burn out.

## Mid-career with family
Base covers life. Equity may be 2-5 years out. Structure your life around guaranteed cash.

## Senior IC in growth stage
Here equity can dominate. Accept slightly lower base for materially more equity if the company is at product-market fit with real traction.

## Executive or pre-IPO
Equity dominates. Base covers living; equity funds the next decade if the exit works.

## The insurance principle
The more financially precarious you are, the more you should weight base over equity. Equity is gambling with upside — only gamble what you can afford to lose.$body$,
 'career', true, now() - interval '74 days'),

('annual-comp-review-prep',
 'Preparing for the Annual Comp Review',
 'How to maximize your raise without switching jobs.',
 $body$## Start 3 months early
Calibrate against market. Use Levels.fyi and paid tools. Document your impact all year, not in the 2 weeks before review.

## Build the case
Brag doc with 12-18 month record. Specific impact. Cross-team reviews from peers. Evidence of scope beyond your level.

## Name a number
Do not wait for them to offer. Say: "Based on market data and my impact, $X is aligned." Anchor high.

## Use offers as leverage only once
Getting outside offers every year burns trust. Use it once in 2-3 years if needed.

## What to do if underpaid
If your raise is <5% and market data suggests 15%+ gap, start interviewing. You can stay if they match, but most do not — at least not quickly.$body$,
 'career', true, now() - interval '85 days'),

-- ============ NICHE TECH ROLES (10) ============
('machine-learning-engineer-path',
 'Machine Learning Engineer: The Role vs Data Scientist',
 'They are not the same. Here is how to know which fits you.',
 $body$## Data Scientist
Analytical. Hypothesis-driven. Closer to product/business. Python + SQL + some stats. Output: insights, models, experiments.

## Machine Learning Engineer
Engineering-first. Production systems. Python + distributed systems + MLOps. Output: running models at scale.

## Compensation
ML Engineers pay 15-25% more than data scientists at most companies. Supply is tighter; scale of impact is higher.

## Skills overlap
Both need strong Python. Both need experimentation fundamentals. Diverge on software engineering depth (MLE) vs statistical depth (DS).

## Which to pick
If you enjoy building systems: MLE. If you enjoy research and business framing: DS. Some companies blur the lines — ask specific questions in interviews.$body$,
 'career', true, now() - interval '3 days'),

('platform-engineer-role',
 'What Platform Engineers Actually Do',
 'An engineering discipline that did not exist in 2015.',
 $body$## Platform engineers build for engineers
Internal tooling. CI/CD. Dev environments. Deployment systems. Observability. Feature flag systems. The scaffold that lets product teams ship faster.

## Why it is growing
As companies scale past 50-100 engineers, uncoordinated tooling becomes a tax. Platform teams centralize and reduce cognitive load.

## Skills
Backend engineering fundamentals. Kubernetes / containers. Terraform / IaC. Deep familiarity with developer workflows. Good communication (you are serving internal customers).

## Compensation
Senior platform engineers pay parity with or slightly above senior product engineers. Demand has outpaced supply since 2022.

## Career ceiling
Staff and Principal platform engineer roles exist at most large tech companies. Platform architect is a viable 15-year role.$body$,
 'career', true, now() - interval '12 days'),

('technical-program-manager',
 'Technical Program Manager: The Role Behind the Launch',
 'Why big tech has thousands of them.',
 $body$## What they do
Drive cross-team technical programs that no single PM or engineering manager owns. Dependencies. Scope changes. Risks. Launches. Escalations.

## Where they shine
Programs that cross 3+ engineering teams. Regulatory or compliance projects. Platform migrations. Launch orchestration.

## Skills
Technical depth to follow the work. Strong program management (MS Project / Asana / Jira). Stakeholder management. Writing concise updates.

## Compensation
Similar to Product Management at most companies. Some companies (Google, Meta) pay premium for senior TPMs.

## Career path
Senior TPM → Staff TPM → Principal → Director of Program Management. Some pivot to Engineering Manager or Product at mid-career.$body$,
 'career', true, now() - interval '22 days'),

('developer-advocate-role',
 'Developer Advocate: Half Engineer, Half Marketer',
 'A growing role where technical depth meets communication.',
 $body$## What they do
Build external content — talks, tutorials, blog posts, demos. Engage the community on behalf of a product. Bring customer feedback back to product teams.

## Where it pays
Dev tools companies (Stripe, Twilio, Vercel, Netlify). Cloud platforms (AWS, GCP, Azure). API-first products (Plaid, Clerk, Auth0).

## Skills
Full-stack engineering. Writing. Public speaking. Empathy for the developer experience. Strong social media presence is a plus.

## Compensation
Senior DevRel pays $180K-$280K total at top companies. Content-focused roles lean lower; product-focused roles lean higher.

## Career path
Senior DevRel → Head of DevRel → VP DevRel or pivot to Product Management with a specialty in dev tools.$body$,
 'career', true, now() - interval '32 days'),

('site-reliability-engineer',
 'Site Reliability Engineer: Engineering Discipline for Operations',
 'The Google-invented role that reshaped ops across the industry.',
 $body$## What they do
Apply software engineering rigor to running production systems. Automate runbooks. Define SLOs. Eliminate toil. Own incident response.

## SRE vs DevOps
DevOps is a culture. SRE is a job title with specific responsibilities. Most large tech companies have SRE teams; smaller ones often have "platform" or "infrastructure" engineers doing the same work.

## Skills
Strong coding in Python or Go. Distributed systems fundamentals. Observability tooling (Prometheus, Grafana, Datadog). Incident command experience.

## Compensation
Senior SRE pays parity with senior product engineer, often slightly higher at companies where reliability is business-critical.

## The on-call question
Healthy SRE orgs have sustainable on-call (not more than 1 week in 4-6). Ask about pager frequency in interviews.$body$,
 'career', true, now() - interval '42 days'),

('security-engineer-role',
 'Security Engineer: A Role in Five Flavors',
 'Application security, product security, infrastructure security, detection, and IAM — all different jobs.',
 $body$## Application Security (AppSec)
Code reviews, threat modeling, security tooling integrated into CI/CD. Closest to software engineering.

## Product Security
Broader than AppSec — designing secure features, privacy by design, secure-by-default system patterns.

## Infrastructure Security
Securing the cloud, networks, servers. Firewall configs, IAM policies, vulnerability management.

## Detection Engineering
Building and tuning detection rules in SIEMs. Threat hunting. Incident response.

## Identity and Access Management
Deep specialty in authentication, authorization, SSO, privileged access management. Often highest-paid security specialty.

## Which pays most
AppSec and IAM at public companies pay $250K-$400K for senior engineers. Detection engineering pays $180K-$280K. Infra security lands in between.$body$,
 'career', true, now() - interval '52 days'),

('solutions-architect-path',
 'Solutions Architect: Engineering Role With Customer Exposure',
 'A hybrid role that pays well and opens many doors.',
 $body$## What they do
Advise enterprise customers on technical implementation of a product. Design architectures. Unblock integrations. Interface between sales engineers and customer engineering teams.

## Where it thrives
Enterprise SaaS (Salesforce, AWS, Azure, GCP, Databricks, Snowflake). Dev tools targeting large enterprises.

## Skills
Broad technical knowledge across stacks. Strong presentation and writing. Comfort in customer-facing meetings. Domain expertise in the product's industry.

## Compensation
Base $160K-$220K with variable $40K-$80K bonus tied to customer outcomes. Total comp can exceed $300K at top companies.

## Career pivots
SAs often pivot to product management, customer success leadership, or move into startup CTO roles at series A-B companies.$body$,
 'career', true, now() - interval '62 days'),

('data-engineer-role',
 'Data Engineer: The Plumbing That Makes Data Work',
 'The role that quietly holds every data-driven company together.',
 $body$## What they do
Build and maintain data pipelines. ETL / ELT. Data warehousing. Streaming. Data quality. Schema design. Cost optimization at scale.

## Skills
SQL fluency at expert level. Python for orchestration. Airflow / dbt. Spark or equivalent for big data. Cloud warehouse (Snowflake / BigQuery / Redshift).

## Data Engineer vs Analytics Engineer
Data engineers own infrastructure — pipelines, ingestion, storage. Analytics engineers own the modeling layer — dbt models, metrics, reporting.

## Compensation
Senior data engineers pay parity with senior backend engineers at data-forward companies. Often outpace pure backend at fintech and healthcare.

## Why it is rising
Companies realize their machine learning and analytics is only as good as their data. Investment in platform quality is up 3-5x vs 2018.$body$,
 'career', true, now() - interval '72 days'),

('product-designer-vs-ux',
 'Product Designer vs UX Designer: What Is the Difference?',
 'The titles blur. Here is what most companies mean.',
 $body$## Product Designer
End-to-end ownership. Research + design + prototyping + some engineering collaboration. Works directly with a product area.

## UX Designer
Research-focused in large companies. UX Designer at a 5-person startup often equals Product Designer at a 500-person company.

## Interaction Designer
Specialist role. Focus on the interaction layer — microinteractions, motion, states. Most common at FAANG-scale companies.

## Visual Designer
Also called brand designer. Owns the brand system, marketing assets. Separate from product design function.

## Which to pick
Product Designer is the most versatile and portable title. UX and UI variants are more specialized — useful in large design orgs, limiting at smaller companies.$body$,
 'career', true, now() - interval '82 days'),

('research-engineer',
 'Research Engineer: The Role That Spans Industry and Academia',
 'A hybrid path for people who like papers and production.',
 $body$## What they do
Prototype novel approaches from recent research. Productionize them. Keep the team on the research frontier. Often write papers.

## Where they work
AI research labs (OpenAI, Anthropic, DeepMind). Core ML teams at big tech. Quant research at hedge funds.

## Skills
Paper reproduction skill. Strong ML engineering. Writing research-quality code that also runs in production. Collaborative with PhD-level scientists.

## Compensation
Research Engineer roles pay $250K-$500K+ base at top labs. Total comp with equity can exceed $1M at frontier AI companies.

## Career path
Senior Research Engineer → Staff → Research Lead. Many transition into starting companies or joining as founding engineer at AI startups.$body$,
 'career', true, now() - interval '92 days'),

-- ============ REMOTE WORK SPECIFICS (10) ============
('setting-up-home-office',
 'Setting Up a Home Office That Actually Works',
 'A decade of remote work lessons distilled into a budget plan.',
 $body$## The essentials ($800-$1500)
Good desk (standing preferred). Ergonomic chair. External monitor (27" minimum). Quality webcam at eye level. Wired headset with mic.

## The nice-to-haves ($500-$1500)
Second monitor. LED ring light or soft light source. Acoustic panels if echo is a problem. Mechanical keyboard. Vertical mouse.

## What most people skimp on
Chair (body pays for a year of a cheap chair). Audio (video conversations are 50% harder with bad mic). Lighting (you look washed out or shadowy in meetings).

## What you do not need
A custom Pelton-style rig. Gaming-tier PC if you are not gaming. $3K cameras. Fancy backdrops.

## Company reimbursement
Most remote-first companies reimburse $500-$2500 for home office setup. Ask in interviews.$body$,
 'career', true, now() - interval '6 days'),

('async-work-practices',
 'Async Work Practices That Actually Scale',
 'Timezone overlap is not a remote work solution — async is.',
 $body$## Default to writing
Decisions in docs. Context in RFCs. Status in written updates. Voice conversations only when writing has failed.

## The 24-hour rule
If a decision does not need to be made in 24 hours, make it async. Async decisions compound better: new team members can read the history.

## Respect response windows
Set expected response times per channel. Slack DM: 4 hours during your workday. Email: 24 hours. Docs: 2 business days for reviews.

## Recorded over live
Loom or similar for demos, walkthroughs, feedback. Watchers can 2x speed, pause, refer back. Live calls are 1x, one-time, ephemeral.

## The cost of poor async
Orgs that skip async end up with a meeting culture that burns 20-30% of engineer time. Good async saves that entire tax.$body$,
 'career', true, now() - interval '15 days'),

('remote-promotion-strategy',
 'Getting Promoted While Remote',
 'Harder than in-person but not impossible.',
 $body$## Visibility is the main bottleneck
Without hallway chats, your manager's manager may not know you. Fix this with structured visibility: RFCs, public channel updates, recorded demos.

## Pick visible projects
Cross-team migrations. Observability improvements. Public-facing launches. Projects where outcome is broadcast to the org.

## Write weekly updates
Post in a public channel. "This week shipped X, learned Y, next week Z." Builds a paper trail and passive visibility.

## Travel strategically
2-3 in-person visits per year to HQ or team offsites. Maximize time with leadership during visits. Offer to give talks or demos.

## The promotion packet
Fully remote promotion packets need to be self-contained. Include links to artifacts, public feedback, metrics. Assume the committee does not know you personally.$body$,
 'career', true, now() - interval '25 days'),

('remote-team-dynamics',
 'Building Trust in Remote Teams',
 'The practices that separate functional remote teams from dysfunctional ones.',
 $body$## Team rituals matter more, not less
Weekly all-hands. Show-and-tells. Team retros. These substitute for the informal trust-building that happens in-person.

## Cameras on for 1:1s and small meetings
Large all-hands: off is fine. 1:1s and team retros: strongly prefer cameras. Facial cues are a high-bandwidth signal that trust compounds on.

## Virtual coffee schedule
Some companies pair random teammates for 30-min non-work chats once a month. Low effort, meaningful outcome.

## Conflict resolution in writing first
When tension arises, write a doc before jumping on a call. Writing forces clarity and removes reactive emotion.

## Off-sites are non-negotiable
2-4 per year at minimum for remote teams. Skipping them causes trust debt that shows up 12-18 months later as friction.$body$,
 'career', true, now() - interval '35 days'),

('remote-vs-in-person-salary-gap',
 'Remote vs In-Person Salary Gap: The Honest Numbers',
 'Studies and anecdotes — what the real delta is in 2026.',
 $body$## Pure remote-first companies
Often pay "SF remote" or similar single-band. No location penalty. Candidate gets SF pay regardless of zip code.

## Hybrid companies with RTO policies
Typically pay 10-20% below SF for non-HQ employees. This gap is growing as RTO mandates expand.

## Remote employees at hybrid companies
Caught in the middle. Often paid geo-adjusted for their location. Some companies classify remote as "satellite" with different pay scales.

## Contract vs full-time
Remote contractors can earn premium rates without locale adjustment, but lose benefits. Full-time remote locks in benefits but with location discount.

## How to capture the premium
Target truly remote-first companies: GitLab, Automattic, Buffer, Stripe, Shopify. Avoid "remote-friendly" — that usually means second-class.$body$,
 'industry', true, now() - interval '45 days'),

('hybrid-schedule-tips',
 'Making a Hybrid Schedule Work',
 'Hybrid is the dominant model in 2026. Here is how to optimize for it.',
 $body$## Anchor days matter
2-3 mandatory office days a week. Everyone on the team there same days. Collaboration happens then.

## Async days for focus
2-3 WFH days a week. Deep work. Low meetings. Protect these aggressively.

## What gets done when
Office days: meetings, whiteboard sessions, pairing, lunches. WFH days: writing, deep coding, long-form thinking.

## Avoid the commute trap
Do not take 90 minutes of meetings on your WFH day. You will hate it. Block time for what only WFH gives you.

## The middle-ground problem
Hybrid fails when leadership is not deliberate. Good hybrid teams publish a team rhythm. Mediocre teams let it drift and lose both remote and in-person benefits.$body$,
 'career', true, now() - interval '55 days'),

('remote-working-hours-boundaries',
 'Remote Work: Setting Boundaries That Stick',
 'The default without boundaries is overwork. Here is how to hold the line.',
 $body$## Block your calendar for off-hours
Set your working hours explicitly. Block evenings, lunch, mornings. Respect your own calendar blocks.

## No Slack on phone outside hours
Remove the Slack notification from your phone after 6pm. Even better: sign out of Slack on personal devices entirely.

## A physical transition
End-of-day walk. Close the laptop and put it in a drawer. Physical separation teaches your brain the workday is done.

## Vacation that is actually off
Out-of-office message. Slack notifications off. Laptop untouched. One-week vacation is worth 2-3 weeks of checked-in "vacation."

## The escalation protocol
Agree with your manager: what constitutes an emergency that is worth contacting you off-hours. If nothing does, say so. Most managers agree.$body$,
 'career', true, now() - interval '65 days'),

('digital-nomad-tax-reality',
 'The Digital Nomad Tax Reality',
 'Working from anywhere is not always legal. Here is what to check.',
 $body$## US citizens
You owe US taxes on worldwide income regardless of where you live. Foreign Earned Income Exclusion (up to ~$120K) applies if you meet physical-presence tests.

## Employer permanent establishment risk
Working in a country for extended periods can create tax liability for your employer. Some companies prohibit it; some cap days per country.

## Popular nomad countries
Portugal D7. Spain Digital Nomad Visa. Estonia e-Residency. UAE Virtual Working Program. Each has rules.

## The 183-day trap
Spending 183+ days in most countries triggers tax residency. You might owe local income tax in addition to US tax.

## Practical advice
Do not go full nomad without consulting an international tax accountant ($1K-$2K). Unpaid back taxes across countries are the #1 nomad nightmare.$body$,
 'career', true, now() - interval '75 days'),

('hiring-fully-remote-first-time',
 'Hiring Your First Fully Remote Employee',
 'For managers used to in-person teams.',
 $body$## Onboarding takes 2x longer
Block 3 weeks on their calendar for structured onboarding. Pair them with a buddy. Check in 2x/week for the first month.

## Tool fluency matters more
Notion, Linear, Slack, Google Docs — the speed at which a new hire adopts your tools correlates strongly with their productivity.

## Written norms over verbal
Document your team's working norms in a doc. When does standup happen? What gets decided async vs sync? Where are docs stored? Remote hires have zero context to inherit.

## 1:1s get priority
Weekly 1:1s minimum for the first 6 months. Async updates supplement, they do not replace, face-to-face feedback.

## Retain by investing
Remote hires who feel invested in stay. Fund their conferences, learning, offsite travel. Ambient benefits matter more when you cannot feel the office culture.$body$,
 'hiring', true, now() - interval '85 days'),

('remote-meeting-fatigue',
 'Fighting Remote Meeting Fatigue',
 'Most remote teams over-meet. Here is how to reclaim your calendar.',
 $body$## The weekly audit
Review every recurring meeting monthly. Cancel anything without a clear decision-making purpose.

## Replace standups with async updates
Written standups in Slack channel. Takes 2-3 minutes to write. Takes 5 minutes daily to read. Saves 15-30 minutes of video time per person.

## Decline without explanation
You do not owe a detailed explanation for declining meetings that are not essential. "Conflict" is sufficient.

## Meeting-free blocks
Block at least 2 half-days per week for deep work. Protect them like vacation.

## The 25-minute default
Set all meetings to 25 or 50 minutes instead of 30/60. Gives buffer time. Makes people think twice about scheduling a full hour.$body$,
 'career', true, now() - interval '100 days'),

-- ============ JOB MARKET BY ROLE (10) ============
('is-swe-market-bouncing-back',
 'Is the Software Engineer Market Bouncing Back?',
 'After the 2023-24 freeze, here is what is hiring and what is not.',
 $body$## Senior engineers are hot again
Companies correcting from junior-only hiring are now aggressively filling senior gaps. Senior backend and platform roles have 5-10 recruiters reaching out weekly.

## Junior market still tough
Entry-level tech roles are still down 30-40% from 2022. New grads should cast wider, accept more lateral moves, and plan for 3-5x the rejection rate of 2021.

## AI specialists command premium
ML engineers and AI infrastructure specialists are earning 25-40% premiums vs pure backend. Frontier AI companies (Anthropic, OpenAI) can pay 2-3x for top talent.

## Dev tools companies hiring
Vercel, Linear, Supabase, Retool, and peers are actively hiring. Typically senior ICs.

## What is not hiring
Crypto consumer. Ad tech. BNPL. These sectors are consolidating — be cautious about roles there.$body$,
 'industry', true, now() - interval '2 days'),

('pm-market-2026',
 'Product Manager Market in 2026',
 'PM roles are the first cut and last rehired. Here is where they are landing.',
 $body$## Technical PMs in demand
AI, ML, platform, infrastructure PMs are in highest demand. Companies want PMs who can credibly discuss model architecture and data pipelines.

## Consumer PM roles compressed
Consumer product teams have shrunk at most companies. Compensation is flat year-over-year for 2023 and 2024.

## Growth PM hot
Conversion optimization, lifecycle, experimentation — Growth PM roles pay a 15-25% premium at high-growth companies.

## B2B / Enterprise PM stable
Enterprise SaaS PM roles have been most insulated from layoffs. Slower growth but more predictable.

## What employers filter for
Specific metric wins. Technical depth. Stakeholder management evidence. Generalist PMs without specialization struggle.$body$,
 'industry', true, now() - interval '11 days'),

('designer-market-shift',
 'Designer Market Shift: From Brand to Product',
 'Pure visual / brand roles are down. Product design with PM crossover is up.',
 $body$## What is up
Staff product designers who can own end-to-end features. Designers who write and ship. AI-prompt-fluent designers at AI tool companies.

## What is down
Pure visual designers. Brand-only designers. Junior UI roles (AI automated a lot of the craft work here).

## Where the money is
Design Engineers (can write production React + own design systems). Senior Product Designers at late-stage startups.

## Skills gap
Designers who did not learn to code 2020-2023 are struggling. Figma alone is no longer enough. Prototyping with code is table stakes.

## Entry-level reality
New grad design roles are 50% harder to get than in 2021. Bootcamp graduates especially struggle. Portfolio matters more than ever.$body$,
 'industry', true, now() - interval '21 days'),

('sales-tech-layoffs-recovery',
 'Tech Sales After the Layoffs',
 'AE and BDR hiring is recovering faster than engineering.',
 $body$## Where demand is
Cybersecurity sales (exploding). Compliance and GRC platforms. AI infrastructure and observability. All paying top-of-market.

## Where supply is tight
Seasoned enterprise AEs with $1M+ ACV experience. Most startups are competing for the same 500-1000 people.

## BDR reality
BDR roles have shifted fully to sourced outbound with heavy SDR support. Expect to hold the role 12-18 months before AE promotion.

## SMB AE compensation
$60K-$90K base / $120K-$180K OTE. Mid-market AE: $100K-$140K / $200K-$300K OTE. Enterprise AE: $140K-$200K / $300K-$500K+ OTE.

## The RevOps premium
Revenue Operations roles are growing 2x faster than direct sales roles. $150K-$250K for senior ICs.$body$,
 'industry', true, now() - interval '31 days'),

('data-science-consolidation',
 'Data Science Market Consolidation',
 'The 2020-2022 boom is over. Here is what remains.',
 $body$## Generalist data scientists squeezed
The "data scientist who does everything" role has fragmented. Companies now hire specialists: ML engineers, analytics engineers, research scientists.

## Analytics engineering growing
dbt has created a new category. Analytics engineers blend SQL + data modeling + business partnership.

## Research scientist role consolidating
Only the top AI labs and research-heavy orgs hire pure research scientists. Most DS roles are applied.

## Compensation reality
Flat to slightly down for pure DS roles. Up 20-30% for MLE and analytics engineering specializations.

## Where to reposition
From DS to: MLE (if strong coding), AE (if strong SQL + business), Product Analyst (if strong stakeholder management).$body$,
 'industry', true, now() - interval '42 days'),

('devops-sre-job-market',
 'DevOps / SRE Hiring in 2026',
 'Steady demand, slow growth, specific skills in demand.',
 $body$## Steady, not booming
DevOps / SRE roles have been less volatile than product/frontend roles. Modest growth year-over-year.

## In high demand
Kubernetes expertise with real scale experience. Platform engineering backgrounds. Multi-cloud and cost optimization skills.

## Supply gaps
Security-conscious SREs. SREs who can code production-level Go or Rust. FinOps-specialized engineers.

## Compensation
Senior SRE: $200K-$280K total at most public companies. Staff SRE: $280K-$400K. Principal SRE: $400K+.

## Career ceiling
SRE → Staff → Principal path is well-defined at large companies. Pivot to EM is common around Staff level.$body$,
 'industry', true, now() - interval '52 days'),

('technical-writing-roles',
 'Technical Writing: A Resilient Role',
 'Under-appreciated, increasingly valuable, steady hiring.',
 $body$## Growing at dev tools companies
Stripe, Twilio, Vercel, Railway — dev-first companies are hiring technical writers aggressively as docs become the primary onboarding surface.

## Compensation
Senior technical writers: $120K-$170K at most companies. $140K-$200K at dev tools companies specifically.

## Skills matter
Writing clarity. Domain expertise in developer tooling. Git fluency. Increasingly: ability to build demo apps and run real tests of docs.

## Entry paths
Former engineers who prefer writing. Former technical support or solutions engineers. Bootcamp-trained career switchers with prior writing experience.

## Career path
Senior TW → Docs Manager → Head of Content. Some pivot to Product Management at dev-first companies where docs and product are tightly fused.$body$,
 'career', true, now() - interval '62 days'),

('finance-and-accounting-tech',
 'Finance and Accounting Roles in Tech',
 'Operator roles that get overlooked by candidates focused on "tech" jobs.',
 $body$## Why they matter
Every tech company has a finance team. Accountants, analysts, FP&A, Treasury, Controller, CFO — career ladder exists at every stage.

## Compensation in tech
Senior FP&A at Series C/D startups: $140K-$200K total. Senior Controller at public tech: $200K-$280K. VP Finance: $300K-$500K.

## Skills that transfer
Finance people with SQL + Python do 10x the work of Excel-only finance people. Invest in scripting.

## Path from Big 4
3-5 years at Deloitte/PwC/EY/KPMG into Senior Accountant at a tech company is a well-trodden path. Significant pay bump.

## Where to grow fast
Startups Series B-C. You operate as a team of 2-3 instead of 50. Learn faster. Equity upside. Downside: less formal training.$body$,
 'industry', true, now() - interval '72 days'),

('marketing-roles-2026',
 'Marketing Roles in 2026: What Is Hiring',
 'Brand is down. Growth and content are up.',
 $body$## Content marketing steady
SEO and content marketing remain steady. Especially at B2B SaaS where inbound leads are the main channel.

## Growth marketing premium
Growth marketers who can own conversion, lifecycle, and experimentation command 20-30% more than brand marketers.

## Marketing engineering on the rise
Marketers who can write SQL, build dashboards, automate workflows with no-code tools are increasingly valued. $180K-$280K at growth-stage startups.

## Brand roles compressed
Pure brand and creative roles are down 30-40% from 2022. Brand is now folded into product marketing or growth at most startups.

## PMM steady
Product Marketing Managers at B2B companies remain in steady demand. $140K-$220K for senior roles.$body$,
 'industry', true, now() - interval '82 days'),

('hr-people-ops-2026',
 'HR and People Ops Roles in 2026',
 'After layoff waves, HR is rebuilding more strategically than ever.',
 $body$## Why it is shifting
Post-layoff HR is focused on workforce planning, internal mobility, and retention rather than aggressive hiring. Skill needs have shifted.

## In demand
People Analytics (combine HR data with SQL/Python). Workforce Planning Managers. Compensation Managers. DEI Program Managers with measurable frameworks.

## Compensation
Senior People Ops Manager: $130K-$180K. People Analytics: $160K-$220K. VP People: $250K-$450K.

## Skills gap
HR folks who cannot work in data tools. Modern HR requires SQL, Excel modeling, and some basic automation fluency.

## Career arc
People Ops Specialist → Manager → Director → VP People. Or pivot to HRBP (HR Business Partner) if you prefer generalist breadth over specialization.$body$,
 'industry', true, now() - interval '92 days'),

-- ============ WORKPLACE EXPERIENCE (10) ============
('first-1-1-with-new-manager',
 'Your First 1:1 with a New Manager',
 'Frame it right and you set up 6 months of trust.',
 $body$## Come prepared
Research them on LinkedIn. Know their career path, their team, their previous manager. Skip generic questions.

## The opening
"I want to be useful to you quickly. What would make me a great person on this team in 3 months?"

## The ask for context
"What are you optimizing for right now? What do you wish this team did differently?"

## The expectation setting
"How do you like to get updates from me? Weekly written? Daily Slack? 1:1 only?"

## The commit
End with a concrete deliverable in 2 weeks. Shows you are already moving. Sets a baseline for future reviews.$body$,
 'career', true, now() - interval '7 days'),

('surviving-reorg',
 'Surviving a Reorg',
 'What to do in the first 2 weeks after the announcement.',
 $body$## Do not panic-interview
First instinct is to update resume and start applying. Resist for 2 weeks. The reorg often settles into something livable.

## Meet your new manager immediately
Ask for a 30-min 1:1 in week 1. Ask: what is staying? What is changing? What is expected of me?

## Rewrite your story for the new context
Your projects, impact, and role may read differently in the new org. Update your brag doc with reorg-compatible framing.

## Watch for real signals
Who is getting scope? Who is losing scope? The reorg reveals political priorities. Use them to navigate.

## When to leave
If the new org clearly deprioritizes your function, start interviewing at week 3-4. Reorgs often presage layoffs in 3-6 months.$body$,
 'career', true, now() - interval '18 days'),

('difficult-coworker-playbook',
 'Managing a Difficult Coworker',
 'Not every problem needs an HR escalation.',
 $body$## Start with curiosity
Assume positive intent first. Ask to understand their perspective. "Help me understand your thinking on X."

## Then direct feedback
If curiosity does not resolve it, give direct feedback 1:1. "When X happened, I felt Y. I would prefer Z."

## Document everything
Dates, specific behaviors, your response. Not for HR necessarily — for your own clarity on whether it is a pattern.

## Loop in your manager
Before escalating, tell your manager. They may have context you lack. They should be aware before external stakeholders are.

## HR as last resort
HR exists to reduce legal risk for the company, not to advocate for you. Use only when the behavior is clearly crossing a line — harassment, discrimination, theft.$body$,
 'career', true, now() - interval '29 days'),

('negotiating-remote-exception',
 'Negotiating a Remote Exception When RTO Is Mandatory',
 'Even companies with RTO mandates grant exceptions. Here is how to ask.',
 $body$## The framing
Lead with reason: caregiving, partner relocation, medical, disability. Business reasons ("I am more productive at home") rarely work.

## Document the productivity case
If your role is output-measurable, show the numbers. Screenshots of commits, shipped projects, customer calls.

## The willingness to compromise
Offer 2 days on-site per month. Monthly team visits. Travel for in-person events. Flexibility signals good faith.

## Formalize in writing
Get the exception in writing from your manager and HR. Verbal exceptions evaporate when policies tighten.

## What to avoid
Weaponizing accommodations you do not have. Publicly complaining about RTO. Both burn reputation fast.$body$,
 'career', true, now() - interval '38 days'),

('dealing-with-burnout',
 'Recognizing and Recovering from Burnout',
 'The signs most people ignore for 6 months too long.',
 $body$## Early signs
Sunday dread compounds. You stop doing activities you used to enjoy. Email becomes a chore. Small tasks feel impossible.

## Mid-stage
Cynicism about work. Loss of motivation even for rewarding projects. Physical symptoms: headaches, bad sleep, body tension.

## Late-stage
Health impacts. Depressed mood. Complete disengagement. Cannot make decisions even for life outside work.

## Recovery tactics
Take the week off (not just weekend). Reduce scope aggressively with your manager. Therapy helps. Physical exercise helps measurably.

## Structural fixes
Sometimes burnout signals the need to change roles or companies. Heroic individual recovery rarely works against a fundamentally toxic workplace.$body$,
 'career', true, now() - interval '49 days'),

('asking-for-a-raise',
 'Asking for a Raise (Without a Competing Offer)',
 'The approach that works when you do not have external leverage.',
 $body$## Start with evidence
Build the case: market data, your impact in the last 12 months, scope you have taken on beyond your level.

## Ask directly
"Based on my work and market data, I am requesting a base increase to $X. What do I need to do to make that happen?"

## Be patient
Most companies cannot approve raises outside cycles. Ask in a 1:1, then follow up in 2-3 weeks with your manager.

## What often works
Specific, documented impact. Comparison to peer market rates. Moderate ask (10-15%), not a wild one.

## What rarely works
Tenure alone ("I have been here 3 years"). Personal need ("my rent went up"). Threats to quit without a backup plan.$body$,
 'career', true, now() - interval '58 days'),

('giving-good-feedback',
 'Giving Feedback That Actually Lands',
 'The most-requested and worst-practiced management skill.',
 $body$## Context + specific behavior + impact
"In yesterday's review meeting, when you interrupted the designer twice, the rest of the team stopped contributing."

## Actionable suggestion
"Next time, let them finish and then share your concerns. I think you will get better outcomes."

## Timing: early, private, direct
Same day if possible. 1:1 or DM. Direct but not confrontational.

## Not all feedback is critique
Positive feedback lands the same way: specific, timely, private. "The doc you wrote yesterday saved the team 3 hours."

## Build the loop
Feedback is a practice, not an event. Give a small piece every week. Once a year performance review is too late for most issues.$body$,
 'hiring', true, now() - interval '68 days'),

('running-effective-1-on-1',
 'Running Effective 1:1s (As a Manager)',
 'The 30 minutes that shape your team more than any other meeting.',
 $body$## Let them drive
Your direct report owns 70% of the agenda. Their blockers, their questions, their career.

## Three standing questions
What is blocking you? What is energizing you? Where do you want to grow in the next 6 months?

## Cancel when in doubt
Canceling a 1:1 you do not need is fine. Canceling one every week signals you do not care.

## Do not skip feedback
Every 1:1 should include at least one piece of feedback, positive or constructive. Silence on feedback is the worst signal.

## Notes that compound
Keep a running doc per report. Six months later you have a pattern of their growth, goals, and concerns.$body$,
 'hiring', true, now() - interval '78 days'),

('annual-performance-review-survival',
 'Surviving Your Annual Performance Review',
 'The 3 moves that turn a lukewarm review into leverage.',
 $body$## Do not debate the score
Even if you disagree, do not argue in the meeting. Thank them for feedback. Ask what you can do differently.

## Get specifics in writing
"Could you share 2-3 specific examples where I fell short?" Written specifics protect you in future cycles.

## Lock in next cycle goals
Leave the review with 3-5 written goals. Tied to promotion criteria. Documented by both you and your manager.

## Calibrate vs the market
If the review is lukewarm, interview elsewhere. You either confirm the company is underpaying/undervaluing you, or you confirm the review is fair.

## The follow-up 1:1
Two weeks after the review, check in on your goals. Shows you took it seriously. Builds accountability.$body$,
 'career', true, now() - interval '88 days'),

('quitting-with-grace',
 'How to Quit Gracefully',
 'Your last 2 weeks shape your reputation more than your last 2 years.',
 $body$## Resign in person or on a call
Not Slack. Not email. Your manager deserves 5 minutes of your time.

## Keep it short
"I have accepted another opportunity and my last day will be X." Do not vent. Do not negotiate. Do not over-explain.

## Write the transition doc
What you own. Where it is documented. Open threads. Who should inherit what. Leave the team better.

## Help with backfill interviews
If asked, help interview your replacement. Builds goodwill that outlasts the job.

## Stay in touch
Send LinkedIn connections to people you actually respect. Former coworkers are your most reliable future network.$body$,
 'career', true, now() - interval '105 days')

on conflict (slug) do nothing;
