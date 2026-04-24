-- PR X24: Fourth batch of 50 blog posts. Dollar-quoted bodies, idempotent.
-- Clusters: leadership, executive, niche industries, AI-era, job search tactics.

insert into blog_posts (slug, title, excerpt, body, category, published, published_at)
values

-- ============ LEADERSHIP & MANAGEMENT (10) ============
('building-a-team-from-scratch',
 'Building an Engineering Team From Scratch',
 'Your first five hires define the culture for the next five years.',
 $body$## Hire for trajectory, not title
Early hires should be people who could be two levels up in 18 months. Senior titles are less important than hunger and judgment.

## Pay above market for the first three
A 20% premium on the first three hires compounds into recruiting leverage. They will refer peers. They will be the bar for everyone after.

## Diversify from day one
Homogeneous early teams calcify. Deliberately mix backgrounds, experiences, and thinking styles. It is 10x harder to fix after hire 20.

## Write the job description yourself
Not copy-pasted from LinkedIn. Own the words. It forces you to clarify what the role actually is.

## First hire for the skill you are weakest in
Do not clone yourself. Hire the person who covers your biggest gap.$body$,
 'hiring', true, now() - interval '2 days'),

('retention-strategies-that-work',
 'Retention Strategies That Actually Work',
 'Ping pong tables do not retain anyone. Here is what does.',
 $body$## Manager quality is the top lever
People quit managers, not companies. Invest 2x more in manager training than you think you need.

## Career growth visible and attainable
If people cannot see how to reach the next level, they leave for companies where they can. Publish the ladder. Review quarterly.

## Comp ahead of market, not at it
Being 10% above market saves 40-60% of turnover cost. Invest in retention raises before offer negotiations.

## Real autonomy on real work
Hand over meaningful problems. Watch people choose to stay because they own something they are proud of.

## Remove top friction monthly
Ask each 1:1 what slowed them down this week. Fix the top 3 patterns each month. Organizational quality compounds.$body$,
 'hiring', true, now() - interval '13 days'),

('difficult-decisions-managers-avoid',
 'Difficult Decisions Managers Avoid (And Should Not)',
 'Every manager has 3-5 decisions they are delaying. Here is how to stop.',
 $body$## Firing the likable underperformer
Everyone knows they are underperforming. Delaying destroys team trust and morale. The kind move is the fast move.

## Passing someone over for promotion
If they are not ready, saying so directly is kinder than letting the cycle pass in silence. Specific, written gaps protect everyone.

## Cancelling a sacred project
If the data shows it is not working, stopping it is the right call. Sunk cost is not a strategy.

## Reorganizing a beloved team structure
Reorgs feel disruptive. But the real disruption is letting broken structures persist for years.

## Saying no to your boss
The quality of your no is the quality of your leadership. Saying yes to everything sets you up to fail on the things that matter.$body$,
 'hiring', true, now() - interval '24 days'),

('delegation-that-develops',
 'Delegation That Develops Your Team',
 'The difference between offloading and developing.',
 $body$## Offloading vs developing
Offloading: you hand over a task because you do not want to do it. Developing: you hand over a task the person cannot yet do, and coach them through it.

## Pick stretch, not safe
Give tasks slightly above the person's current level. Safe delegation teaches nothing.

## The delegation conversation
"I want you to own X. Here is what success looks like. I am available for unblocking. You decide the approach."

## Resist rescue
The hardest part is not stepping back in when they struggle. Struggle is learning. Rescue is sabotage.

## Review outcomes, not process
Judge on what they shipped and what they learned, not how they got there. Build autonomy by releasing control.$body$,
 'hiring', true, now() - interval '36 days'),

('running-great-retros',
 'Running Great Retros',
 'Most retros are theatre. Here is how to make them matter.',
 $body$## Separate facts from opinions
Start with data — shipped count, incidents, response times. Opinions without data lead to circular debates.

## The 5 whys
For every issue raised, ask "why" five times. Surface root cause, not the visible symptom.

## Action items with owners and deadlines
No action without a name and a date. Revisit at the next retro. Unowned action items become dead weight.

## Psychological safety first
The first 2-3 retros set the tone. If people get punished for honesty, future retros are useless. Protect the honest voice publicly.

## Retro on retros
Every 6 months, retro the retro format itself. Is it still generating value? If not, kill it or transform it.$body$,
 'hiring', true, now() - interval '48 days'),

('performance-improvement-plans',
 'Performance Improvement Plans: The Honest Take',
 'PIPs are rarely a path to improvement. Here is how to do them well anyway.',
 $body$## PIPs are almost always goodbyes
By the time someone is on a PIP, the manager has usually decided. Acknowledge this privately.

## That said — run the PIP well
Specific, measurable goals. 60-90 days. Weekly check-ins. Written feedback. The person deserves a real chance.

## What to give
Resources, coaching, scope protection. Do not set them up to fail. If they succeed, celebrate loudly.

## What to not give
Ambiguous criteria. Shifting goalposts. Silent treatment during the PIP. These signal bad faith and create legal risk.

## Most PIPs end in separation
Usually with severance and a respectful exit. Plan the generous offramp from day one of the PIP. The person will remember how you treated them — the team will too.$body$,
 'hiring', true, now() - interval '58 days'),

('scaling-a-team-beyond-you',
 'Scaling a Team Beyond You',
 'The transition from IC hero to leader happens on one decision.',
 $body$## Stop being the smartest person in the room
If people always ask you for the answer, you are the bottleneck. Build the pattern of "what do you think we should do?"

## Document the decisions
Principles, defaults, frameworks. Written, shared. The team can operate without pinging you.

## Hire people better than you
At specific things. It is the only way to scale. Your job is orchestration, not execution.

## Make yourself optional
The goal: go on vacation for 2 weeks without the team missing a beat. If you cannot, your system is broken.

## The signal that it worked
When a direct report makes a decision you disagree with, and it turns out to be the right call. That is leadership. Own it.$body$,
 'career', true, now() - interval '68 days'),

('managing-up-effectively',
 'Managing Up Without Being Sycophantic',
 'The skill that separates stuck employees from promoted ones.',
 $body$## Understand their metrics
What is your boss measured on by their boss? Help them hit those. Your success flows from their success.

## Bring solutions, not problems
"X is broken. Here are three options. I recommend Y because Z. Unless you disagree, I will move forward." That is gold.

## Communicate proactively
Weekly updates, unsolicited. What shipped, what is blocked, what is coming. Saves them from needing to ask.

## Own your career growth
Ask explicitly for the scope, promotion, or exposure you want. Do not expect them to read your mind.

## Disagree directly, privately
Public disagreement burns capital. Private disagreement builds trust. Save your direct feedback for 1:1s.$body$,
 'career', true, now() - interval '78 days'),

('firing-a-friend',
 'Firing Someone You Consider a Friend',
 'The hardest thing in management. Here is how to handle it.',
 $body$## Acknowledge the conflict
The friendship matters. So does the team. Two things can be true: this is the right decision for the business and this will hurt.

## Warn early
If the friendship is deep and the performance gap is real, start honest conversations months before the formal decision. They deserve the chance.

## Decide, then move
Once the decision is made, do not drag it. Delay hurts them and the team.

## The conversation
Same as any firing — direct, short, respectful. But allow more time for them to process afterward. Friendships survive honesty; they rarely survive ambiguity.

## After
Stay available. A month later, reach out. Most friendships survive if you hold the line on honesty during the firing. They do not survive evasion.$body$,
 'hiring', true, now() - interval '88 days'),

('leading-through-uncertainty',
 'Leading Through Uncertainty',
 'Recessions, reorgs, launches that fail — leadership shows up when visibility is low.',
 $body$## Name what is known and unknown
"Here is what I know. Here is what I do not know yet. Here is when I will update you." Removes silence, which creates worst-case imagination.

## Overcommunicate in crisis
Double normal communication. Weekly becomes daily. People fill silence with anxiety — fill it with facts instead.

## Make small decisions visibly
In uncertain times, any confident decision builds trust. Skip perfect. Pick good. Commit publicly.

## Protect focus
Block big strategic initiatives during uncertainty. Focus on 1-2 things the team can ship in the next month. Momentum is oxygen.

## Preserve dignity
If layoffs come, lead the conversation. Severance generous. Outplacement real. How you exit people in a downturn is how your next hires judge you.$body$,
 'career', true, now() - interval '98 days'),

-- ============ EXECUTIVE / C-LEVEL (10) ============
('becoming-a-cto',
 'Becoming a CTO: The Path That Actually Works',
 'The job is almost nothing like being a principal engineer.',
 $body$## The engineering-to-CTO gap
Principal engineers ship. CTOs build the org that ships. Different skill stack: executive communication, fundraising support, hiring at scale.

## The two paths
Founder CTO: scale with the company from day one. Hired CTO: come in at Series B-C to professionalize engineering.

## What hired CTOs actually do
Recruit senior leadership (Directors, VPs). Own the technical narrative for investors and customers. Partner with CEO on strategy. Far less code review.

## Compensation
Startup CTO: 1-5% equity + $250K-$350K base. Public company CTO: $500K-$2M+ total comp.

## How to prepare
Write externally. Speak at conferences. Mentor founders. Build board presence 3-5 years before the CTO jump.$body$,
 'career', true, now() - interval '4 days'),

('becoming-a-ceo',
 'Becoming a CEO: Three Honest Paths',
 'Founder, promoted, or recruited. They train different people.',
 $body$## Founder CEO
You start the company. You are CEO by default. Hard to replicate — requires vision, capital, and luck. Hardest job in business.

## Promoted CEO
You joined as COO or Chief Product Officer, became CEO through transition. Often smoother: the board knows you, team trusts you.

## Recruited CEO
Board brings you in from outside. Highest variance. Some turnarounds work brilliantly; many fail because cultural grafts take years.

## What every CEO does
Capital allocation. Hiring and firing execs. Telling the story (to customers, employees, investors, press). Everything else is optional.

## What breaks new CEOs
Trying to stay close to product. Trying to keep old friends as direct reports. Trying to be everyone's favorite. None of these scale.$body$,
 'career', true, now() - interval '14 days'),

('vp-of-product-role',
 'VP of Product: What the Role Requires',
 'Not just a senior PM. A different job with different scoring.',
 $body$## Strategy over execution
VP of Product sets the roadmap. Does not own tickets. If you love being in Jira, this role will crush you.

## Three-way partnership
CEO sets company vision. CTO owns engineering. VP of Product translates vision into product bets + roadmap. Weak triangle = broken product.

## Hiring the team
PM hiring is your #1 job. The quality of your PM bench compounds. Generalist VPPs who cannot attract A-player PMs fail.

## Revenue partnership
Modern VP of Product partners with sales on enterprise deals, with marketing on GTM, with success on adoption. Not just shipping.

## How to prepare
Ship products with multi-team coordination for 3+ years. Run hiring loops. Own a P&L if you can. Write externally about product thinking.$body$,
 'career', true, now() - interval '26 days'),

('cfo-role-tech-startups',
 'CFO Role in Tech Startups: What to Expect',
 'Finance rigor meets startup speed. Different from corporate CFO.',
 $body$## When to hire
Series A: probably not. Series B-C: yes. Late C onward: mandatory. Most startups over-hire here too early.

## Core responsibilities
Fundraising infrastructure (data rooms, models, metrics). Investor relations. Board reporting. Cash runway management. Increasingly: M&A.

## What they do not do
Bookkeeping. Day-to-day AP/AR. Those stay with Controller.

## Compensation
Series B CFO: $250K-$350K base + 0.5-1.5% equity. Public company CFO: $500K-$2M+ total.

## Path to CFO
Usually investment banking → FP&A → VP Finance → CFO. Some CPA paths. Founder-CFO is rare but common at deep-finance startups.$body$,
 'career', true, now() - interval '36 days'),

('first-100-days-as-exec',
 'First 100 Days as a New Executive',
 'The window when perception hardens for years.',
 $body$## Days 1-30: Listen
Every direct report, every peer, every key stakeholder. One-on-ones with specific questions: what is working, what is broken, what do you wish had changed yesterday.

## Days 31-60: Diagnose, do not fix
Write down what you heard. Share back. Make 1-2 easy wins. Do not launch your big initiative yet.

## Days 61-90: Propose the vision
Write the 12-month vision doc. Share widely. Solicit feedback. Commit to 2-3 priorities, not 15.

## Days 91-100: First real decision
A hire, a cut, a reorg, a strategy shift. Something that shows conviction. First decision sets tone for year 1.

## The common failure
Coming in too hot. Firing people in week 1. Launching pet projects before understanding. These signals accelerate departure within 18 months.$body$,
 'career', true, now() - interval '46 days'),

('joining-a-board',
 'Joining Your First Board',
 'The path to board seats is less prestigious than it looks.',
 $body$## The reality
Most first board seats are advisor seats at sub-Series-A startups. Pay: equity only, typically 0.1-0.5%. Commitment: 5-10 hours a month.

## Who gets invited
Subject-matter experts founders need. Former execs at companies they want to sell to. Diverse perspectives the cap table lacks.

## What you do
Help founders think. Intro to customers or investors. Occasional formal governance (meetings, minutes). Less interesting than TV suggests.

## Warning signs to decline
Founder who wants you for your name but not your input. Board-in-name-only setups. Too many existing advisors without cohesion.

## Career leverage
3-5 advisor seats is a great platform for eventually joining a real board or becoming an operator-investor.$body$,
 'career', true, now() - interval '56 days'),

('exec-public-speaking',
 'Executive Public Speaking: Low-Stakes to High',
 'Start internal. End at industry conferences. Do not skip steps.',
 $body$## Internal all-hands
Weekly or monthly. 5-10 minutes. Low stakes to practice structure and storytelling.

## Team offsites
15-30 minute fireside chat or keynote. Slightly higher audience, familiar faces. Test narrative arcs.

## Customer events
Webinars, customer dinners, analyst briefings. Higher stakes but audience is rooting for you.

## Industry conferences
Panel first. Fireside chat next. Keynote last. Build up by sharing the stage with experienced speakers for a few cycles.

## What actually matters
Less about polish, more about having something to say. Executives who speak well but say nothing are quickly dismissed. Bring a real point of view.$body$,
 'career', true, now() - interval '66 days'),

('exec-1-1s-with-board',
 '1:1s With Board Members: The Exec Playbook',
 'Three purposes, zero surprises.',
 $body$## The three purposes
1. Update them on what is working and broken. 2. Get their advice on a specific question. 3. Build the relationship for when you need them.

## No surprises rule
Boards hate surprises. Bad news gets delivered to lead investor 24-48 hours before board meeting. Never at the board meeting itself.

## The monthly update
2-page doc: financials, top wins, top risks, one ask. Short enough they read it. Long enough to cover what matters.

## Specific asks
"I need X intro." "I want your view on Y decision." "I am struggling with Z and would love 30 min." Do not be vague.

## The hardest one
The investor who has opinions but low context. Manage carefully — do not fight for every disagreement. Pick the hills that matter.$body$,
 'career', true, now() - interval '76 days'),

('exec-hiring-top-talent',
 'Executive Hiring: The $500K Hire',
 'What executives actually evaluate when hiring each other.',
 $body$## The reference call matters more than the interview
Every serious exec hire has 5-10 back-channel references. They are telling each other what you are like. Leave every job well.

## Judgment over competence
At exec levels, everyone is technically competent. The differentiator is judgment under ambiguity. Interviews probe for this.

## Executive presence
How you communicate. How you hold your ground. How you frame bad news. Executives evaluate each other on this constantly.

## Cultural fit with the exec team
Even exceptional execs fail if they do not mesh with peers. Boards watch this carefully in cross-interviews.

## Compensation conversations
Do not lowball exec candidates. They know the market. Your offer signals how seriously you want them. A weak first offer often loses the best candidates before they see version 2.$body$,
 'hiring', true, now() - interval '86 days'),

('coo-role-in-tech',
 'The COO Role in Modern Tech Companies',
 'From operational enforcer to #2 partner. The shape of the role has shifted.',
 $body$## The modern COO
Less about factory efficiency, more about scaling the operating rhythm — hiring, cross-functional coordination, go-to-market operations, finance integration.

## Two flavors
Internal COO: owns people, ops, finance, legal. External COO: also owns go-to-market, partnerships, BD. Depends heavily on CEO gaps.

## Compensation
Series B-C COO: $275K-$400K base + 1-3% equity. Public tech COO: $500K-$1.5M+ total.

## Who succeeds
Former VP of Ops. Former chiefs of staff. Ex-consulting with deep operating experience. Typically 10+ years operating before COO.

## The career risk
COO is often the last-stop before CEO. If not promoted to CEO in 3-5 years, lateral moves are rare and often involve stepping backward.$body$,
 'career', true, now() - interval '80 days'),

-- ============ NICHE INDUSTRIES (10) ============
('govtech-career-path',
 'GovTech Career Path: Why It Is Hotter Than You Think',
 'Modernizing public services is a 20-year opportunity.',
 $body$## What govtech is
Software and services for federal, state, and local governments. Modernization of 20-40 year old systems. Adjacent: defense tech, civic tech.

## Growth drivers
Federal spending on IT modernization ($100B+ annually). State-level benefits modernization. Public pressure for better service delivery.

## Compensation
Contractor roles at primes (Booz Allen, Leidos, SAIC): $130K-$250K. Modern govtech startups (Palantir, Unqork, Nava): $180K-$350K.

## Companies to watch
Palantir, Anduril, Nava, US Digital Response, Skylight, Deep Water Point, Carahsoft, 18F. Smaller pure-play govtech startups raising $10-50M rounds regularly.

## How to enter
Many enter via contracting. Pure commercial-to-govtech is rarer. Acquire FedRAMP/FISMA/security clearance familiarity to broaden optionality.$body$,
 'industry', true, now() - interval '7 days'),

('biotech-engineering-careers',
 'Software Engineering in Biotech',
 'Software is eating biology. Here is what the roles look like.',
 $body$## Where engineers work in biotech
Drug discovery platforms. Lab automation. Clinical trial software. Bioinformatics pipelines. Genomics data platforms. EHR integration.

## Top employers
Ginkgo, Recursion, Insitro, Nautilus, Benchling, Schrödinger, LabCorp, Verily. Many well-funded Series C+ biotech software plays.

## Skills that transfer
Python fluency. Distributed systems. Cloud infrastructure. Data pipelines. Most do not require wet-lab experience — curiosity about biology helps.

## Compensation
Senior engineers: $200K-$300K total. 10-20% below pure tech but comparable at the top biotech unicorns.

## The work is meaningful
Most biotech engineers cite mission as the top retention factor. If pure tech work feels hollow, this is a compelling alternative.$body$,
 'industry', true, now() - interval '18 days'),

('climate-tech-careers',
 'Climate Tech Careers: Where the Growth Is',
 'Post-IRA policy tailwinds meet urgent demand. 10-year hiring runway.',
 $body$## The subsectors
Energy storage, grid software, carbon accounting, electrification, nuclear, clean fuels, direct air capture.

## Top employers hiring software talent
Tesla, Rivian, Stripe Climate, Watershed, Persefoni, Octopus Energy, Form Energy, Commonwealth Fusion. 100+ well-funded startups actively hiring.

## What moves compensation
Climate-hardware companies pay 5-15% below pure-tech. Climate-software companies pay parity. Senior ICs routinely earn $250K-$400K total at funded startups.

## How to enter
Fastest path: apply directly to climate startups with your existing stack. Skip retraining unless you specifically want hardware or grid infrastructure specialties.

## Who hires
YC, Lowercarbon, Energy Impact Partners, Breakthrough Energy Ventures back most of the growth. Their portfolios are an active hiring signal.$body$,
 'industry', true, now() - interval '29 days'),

('edtech-after-the-bubble',
 'EdTech After the Bubble',
 'The post-2022 correction. Here is what still works.',
 $body$## What died
Consumer edtech without retention. Bootcamps with bad placement. Coding-for-kids apps. 2U-style OPMs. Most over-funded.

## What survived
Workforce upskilling (Coursera, Udemy for Business). K-12 SaaS (Clever, PowerSchool). Language learning specialty (Duolingo). Corporate L&D tools.

## What is growing
AI tutoring (Khanmigo, MagicSchool). Language models for teachers. Institutional research tools. Workforce certification.

## Compensation
Senior engineers: $180K-$260K total. Below pure tech, but often with purpose premium. Entry-level edtech is sparse.

## Pivots out
Many 2021-era edtech engineers have pivoted to generic SaaS or AI tools companies. The skills transfer cleanly.$body$,
 'industry', true, now() - interval '40 days'),

('defense-tech-careers',
 'Defense Tech: The Silicon Valley Comeback',
 'After decades of neglect, defense tech is the new darling.',
 $body$## Why now
Geopolitics. Post-2022 urgency. Silicon Valley money flowing into defense primes and startups. Anduril became a case study.

## Companies hiring
Anduril, Shield AI, Skydio (some defense), Palantir, SpaceX, Vannevar Labs, Hadrian. Growth from Series B onward is huge.

## Compensation
Top defense startups pay parity with top commercial tech. Senior engineers: $250K-$400K total.

## Clearance gap
Many roles require or accelerate with active secret/TS clearance. If you can get one, your optionality 2x.

## Who stays
Engineers with mission conviction. Those who find commercial tech hollow. Many hires include former military or intelligence community.$body$,
 'industry', true, now() - interval '51 days'),

('legaltech-growing',
 'LegalTech Careers: The Quietly Growing Sector',
 'Law firms are big. Legal software is small. The arbitrage is obvious.',
 $body$## Why it works
$600B legal industry globally. Less than 1% spent on technology. Every law firm is a candidate customer.

## Companies to watch
Harvey (AI legal), Spellbook, Ironclad, Clio, Evisort, Icertis, Relativity. All hiring aggressively as AI eats contract review.

## AI tailwind
Every legal AI tool wants engineers who understand LLMs. Less about knowing law; more about product quality for a tough audience.

## Compensation
Senior engineers: $220K-$350K. Top AI legal startups pay closer to frontier AI companies.

## Entry paths
Pure engineering backgrounds are welcome. Legal experience is a plus but not required. Domain learning curve is 3-6 months.$body$,
 'industry', true, now() - interval '62 days'),

('insurtech-careers',
 'InsurTech: Past the Hype, Into the Grind',
 'The 2020-2021 SPAC wave crashed. The real opportunity remains.',
 $body$## What crashed
Lemonade, Root, Hippo, Metromile, Oscar. All public now, mostly underwater. Consumer insurance is harder than Silicon Valley thought.

## What is building
B2B insurance infrastructure. Embedded insurance. Claims automation. Commercial insurance modernization.

## Companies to watch
Clara, Coalition (cyber insurance), Kin, Cowbell, Next Insurance, Vouch. Plus infra plays like Corvus and At-Bay.

## Compensation
Senior engineers: $180K-$280K. Below pure tech at the mid-tier, at-parity at the leaders.

## Stability vs growth
Insurance is mature. Growth is slower but more predictable. Great for people who want stable compounding over startup volatility.$body$,
 'industry', true, now() - interval '72 days'),

('proptech-in-2026',
 'PropTech in 2026: Real Estate Tech After the Cooling',
 'The housing market reshaped the landscape. What is worth working on.',
 $body$## What died
Zillow Offers (iBuying). Opendoor has survived but trimmed. WeWork. Katerra. Most construction tech without differentiation.

## What is growing
Commercial RE data (CoStar, VTS). Rental platforms (Roofstock, Azibo). Insurance-adjacent (Lemonade landlord, Kin). Property management SaaS (AppFolio, RealPage).

## Compensation
Senior engineers: $170K-$260K. Below pure tech. Often justified by work-life balance and slower pace.

## Tailwinds
Aging real estate technology stacks. Regulatory complexity requires software. Institutional capital entering single-family rental at scale.

## Who should join
Engineers who want domain depth over hype. 5-10 year career bets, not quick exits.$body$,
 'industry', true, now() - interval '83 days'),

('agtech-careers',
 'AgTech Careers: The Underrated Sector',
 'Agriculture is huge, under-digitized, and desperately needs engineers.',
 $body$## The size
$5 trillion global market. Less than 2% spent on technology. Massive structural opportunity.

## Subsectors
Precision ag (climate-tech-adjacent). Farm management software. Alternative proteins. Supply chain traceability. Vertical farming infrastructure.

## Companies to watch
Farmers Business Network, Indigo Ag, Climate Corp (Bayer), Plenty, Bowery Farming, Pivot Bio, Planet Labs (ag imagery).

## Compensation
Senior engineers: $170K-$260K. Less than pure tech, but real mission work.

## Talent gap
AgTech struggles to attract top engineering talent because of location (often rural or mid-tier cities) and pace. Remote-first companies are the workaround.$body$,
 'industry', true, now() - interval '94 days'),

('space-tech-and-aerospace-software',
 'Space Tech and Aerospace Software Careers',
 'SpaceX reset expectations. The downstream opportunities are everywhere.',
 $body$## Why it is growing
Launch costs down 10x in 15 years. Satellite constellations cheap enough for startups. Software eats aerospace.

## Companies hiring software
SpaceX, Rocket Lab, Planet, Astranis, Varda, ABL, Slingshot, Muon Space. Plus software-focused like Cesium, Loft Orbital, Xona.

## Skills needed
Real-time systems. Simulation. ML for orbital mechanics. Ground station software. Traditional web engineers can also find roles in product and internal platforms.

## Compensation
Senior engineers at SpaceX-tier: $180K-$260K total. Smaller space startups: $150K-$230K. Well below pure tech, compensated by mission.

## Clearance
Some roles require US citizenship (ITAR). Others do not. Filter early to avoid wasted interview cycles.$body$,
 'industry', true, now() - interval '104 days'),

-- ============ AI-ERA CAREERS (10) ============
('prompt-engineering-role',
 'Is Prompt Engineer a Real Role?',
 'Hyped in 2023. Consolidated in 2025. Here is the reality.',
 $body$## The original hype
2023: "Prompt engineering" as a specialty commanding $300K salaries with no coding required. Mostly wrong.

## What actually happened
The role consolidated into existing titles: ML engineer, AI product engineer, applied AI engineer. Pure prompt engineering died as a standalone role.

## What is a real career
Applied AI engineering. Write production-quality code that integrates LLMs. Evaluation frameworks. Data pipelines. Specialized model tuning.

## Compensation
At frontier AI labs: $300K-$700K total for senior engineers. At applied AI companies: $200K-$400K.

## The actual skills
Strong software engineering + evaluation + model behavior intuition. Prompt crafting is ~10% of the job; the rest is engineering.$body$,
 'career', true, now() - interval '5 days'),

('ai-engineer-vs-mle',
 'AI Engineer vs ML Engineer: The 2026 Distinction',
 'The titles blur. The jobs differ.',
 $body$## ML Engineer (traditional)
Build, train, deploy ML models from scratch. Strong statistical foundations. PyTorch/TensorFlow deep expertise. Distributed training.

## AI Engineer (LLM-era)
Build products on top of existing LLMs. API integration. RAG systems. Evaluation pipelines. Less model training, more system design.

## Compensation
Similar at most companies. Frontier AI labs pay MLEs more (closer to research scientist compensation).

## Which role you are in
If your day is mostly model architecture and training: MLE. If your day is mostly LLM product integration and evaluation: AI Engineer.

## Convergence
Over time, the two roles are blending. By 2027, expect most "AI Engineer" roles to also require deeper model customization skills.$body$,
 'career', true, now() - interval '17 days'),

('working-at-ai-research-lab',
 'Working at an AI Research Lab',
 'What it is like inside the frontier companies.',
 $body$## The companies
Anthropic, OpenAI, Google DeepMind, Meta FAIR, Mistral. Tier 2: xAI, Cohere, AI21.

## Compensation
Research Engineers: $300K-$800K+. Research Scientists: $400K-$1M+. Staff Engineers: $500K-$1.5M. Frontier labs have reshaped tech compensation.

## The work
Long-horizon research combined with tight shipping loops. Depending on the role: prototyping frontier capabilities, scaling systems, alignment research, or productization.

## Who gets hired
Research Scientists: PhD + publications. Research Engineers: strong ML engineering + paper-reproduction skill. Staff Engineers: senior infra backgrounds at scale.

## What you trade off
Equity upside is real but uncertain. Work-life balance varies wildly. Pace is intense. Compensation is unambiguously the highest in tech.$body$,
 'career', true, now() - interval '28 days'),

('applied-ai-startup',
 'Joining an Applied AI Startup',
 'The sweet spot for most engineers excited about AI.',
 $body$## What applied AI startups do
Build vertical products on top of foundation models. Legal (Harvey). Marketing (Jasper, Copy.ai). Sales (Gong.ai). Customer support (Intercom Fin).

## Why they are hiring
Every AI startup is scaling product engineering. Need senior ICs who can ship AI-powered products end-to-end.

## Compensation
Senior engineers: $230K-$400K total. Well-funded ones (Harvey, Perplexity, Glean) approach frontier-AI-lab compensation.

## Skills
Strong software engineering + LLM integration + evaluation. Most roles do not require deep ML training expertise.

## Warning signs
"AI first" in the pitch but no real differentiation. Thin wrappers on OpenAI APIs. Companies that cannot explain their moat in 2 sentences are at high acquisition or death risk.$body$,
 'industry', true, now() - interval '38 days'),

('ai-product-manager',
 'AI Product Manager: A New Specialization',
 'The PM who can ship AI products is in sharp demand.',
 $body$## What is different about AI PM
Product with stochastic output. Accuracy tradeoffs. Evaluation frameworks. Prompt iteration cycles. User expectation management for "AI magic."

## What is the same
User research. Prioritization. Metrics. Shipping discipline. AI PMs who skip fundamentals fail.

## Compensation
Senior AI PMs at top companies: $220K-$400K total. Often 15-25% premium over traditional PMs.

## Who is hiring
Every enterprise SaaS adding AI features. Every AI-native startup at Series A+. Many traditional tech companies (Microsoft, Google, Meta) adding AI to existing products.

## Path in
For traditional PMs: focus on one AI feature at your current company. Ship it. Learn the evaluation patterns. Your next role can be pure AI PM.$body$,
 'career', true, now() - interval '49 days'),

('developer-tools-ai-era',
 'Developer Tools in the AI Era',
 'Cursor, Copilot, Claude Code. The category that reshaped daily work.',
 $body$## The new category winners
Cursor ($100M+ ARR). GitHub Copilot. Claude Code. Cognition (Devin). Each changed how engineers work.

## What they pay
Senior engineers at top AI dev tools companies: $280K-$500K total. Top researchers: $400K-$1M.

## What you actually build
Inference optimization. Context engineering. IDE integration. Evaluation platforms. Model orchestration.

## Why it is the hottest space
Every engineer is a potential customer. The feedback loop from your own team is immediate. The products reshape how 30M developers work.

## Who joins
Engineers who are obsessive about their own workflow. Researchers who want to see their work in production within weeks. Product engineers who love technical audiences.$body$,
 'industry', true, now() - interval '60 days'),

('ai-safety-and-alignment-careers',
 'AI Safety and Alignment Careers',
 'A new research discipline with serious funding and serious stakes.',
 $body$## Who hires
Anthropic (pioneered the category). OpenAI safety team. DeepMind safety. Apollo Research. METR. Center for AI Safety. Redwood Research.

## The work
Technical interpretability. Alignment research. Red-teaming. Evaluations. Policy research.

## Compensation
Research scientists: $400K-$800K+ at frontier labs. Engineers: $250K-$500K. Nonprofit safety research pays less but offers deep mission.

## Entry paths
PhD in ML or adjacent fields. Technical background + strong writing. MATS fellowship and similar programs are common entry routes.

## Why it matters
If you believe AI is the most consequential technology of our lifetime, working on making it go well has compounding personal meaning.$body$,
 'career', true, now() - interval '70 days'),

('eval-engineer-role',
 'The Eval Engineer: A New Specialty',
 'Every AI product company needs this role. Few know how to hire for it.',
 $body$## What they do
Build evaluation frameworks for AI systems. Dataset curation. Benchmark creation. Regression detection. Continuous evaluation in production.

## Why it matters
Without evals, you cannot improve. Most AI product teams hit an invisible ceiling because their evals are weak or non-existent.

## Skills needed
Strong software engineering. Experimental mindset. Intuition for model behavior. Data infrastructure fluency.

## Compensation
Senior eval engineers at AI product companies: $220K-$380K. Scarce enough that titles inflate quickly.

## How to move into it
Volunteer for the evaluation track at your current company. Ship a real eval framework. That is your portfolio for the next role.$body$,
 'career', true, now() - interval '80 days'),

('data-labeling-operations',
 'Data Labeling Operations: A Quiet Career',
 'The unglamorous work that underpins every AI system.',
 $body$## What it is
Operations leadership for data labeling. Managing Scale AI or in-house annotators. Quality control. Workflow design. Cost optimization.

## Why it matters
Garbage in, garbage out. Every frontier lab spends tens of millions on labeling operations. Quality leadership scales directly with model quality.

## Compensation
Operations Managers: $140K-$200K. Directors at top AI labs: $250K-$400K.

## Skills
Operations rigor. Vendor management. Data quality intuition. Written process discipline.

## Who hires
Frontier AI labs. Scale AI and peers. Robotics companies. Applied AI companies with proprietary data moats.$body$,
 'career', true, now() - interval '90 days'),

('ai-vs-human-for-various-roles',
 'Which Roles AI Is Actually Replacing (and Which It Is Not)',
 'A 2026 honest assessment.',
 $body$## Replaced or compressed
Junior copywriting. Entry-level graphic design. Tier-1 customer support. Basic paralegal work. Many junior coding tasks.

## Augmented, not replaced
Senior engineering. Senior product management. Senior design. Senior sales. AI makes them 2-3x more productive, not obsolete.

## Largely unchanged
Executive decision-making. Trust-heavy relationships. Physical labor. Regulated professional services. Most skilled trades.

## Where jobs grow
AI tooling. Applied AI engineering. AI-adjacent operations. Prompt and eval work. Security / trust / safety as AI deployment scales.

## For candidates
If your work is heavily AI-automatable, the career-protection move is not resisting — it is leveling up into roles AI makes more valuable.$body$,
 'industry', true, now() - interval '102 days'),

-- ============ JOB SEARCH TACTICS (10) ============
('job-boards-that-still-work',
 'Job Boards That Still Work in 2026',
 'LinkedIn is saturated. Here is what outperforms.',
 $body$## General
LinkedIn (still the default, despite noise). Indeed (volume). HireQuadrant (curated reviews + filter quality).

## Tech-specific
HackerNews Who Is Hiring (monthly thread). Wellfound (formerly AngelList Talent). YC Work at a Startup.

## Remote
We Work Remotely. Remote OK. Remotive.

## Niche
Otta (European tech). Welcome to the Jungle (Europe). Arc. Dribbble (design). Stack Overflow Jobs (sadly wound down 2024).

## Referral platforms
Paro. Hunter. TeamBlind internal referrals. Often higher signal-to-noise than public boards.$body$,
 'career', true, now() - interval '6 days'),

('finding-jobs-not-posted',
 'Finding Jobs That Are Not Posted',
 'The "hidden job market" is real. Here is how to access it.',
 $body$## 70% of jobs are filled without a public posting
Executive hiring overwhelmingly. Senior IC hiring increasingly. Referral and network-driven.

## The hiring-manager-search move
LinkedIn search "hiring" + target company + target team. Hiring managers often post informally about open roles before HR approves postings.

## The warm intro strategy
Find 10 people at target companies. Not hiring managers — engineers or PMs. Ask for 15-min coffee/call. Conversations lead to referrals.

## The "I am looking" announcement
Post publicly when you are searching. On LinkedIn, on X, in Slack communities. People forward leads to candidates they know are looking.

## The secret backchannel
Founders network heavily. If you are interested in Series A companies, engaging with founder X/Twitter + replying thoughtfully opens doors.$body$,
 'career', true, now() - interval '15 days'),

('cold-outreach-that-works',
 'Cold Outreach to Hiring Managers',
 'The format that gets 20%+ response rates.',
 $body$## Use their work as the hook
Reference a specific thing they shipped. A talk they gave. A post they wrote. Generic praise gets ignored.

## Be specific about you
Instead of "I am a software engineer," write "I scaled the payment service at X from 30K to 300K RPS." Specificity signals substance.

## Keep it short
3 paragraphs max. Under 150 words. A hiring manager who has to scroll is a hiring manager who closed the tab.

## Ask for conversation, not a job
"Would 15 minutes work to discuss if there is a fit?" The ask is low-friction. They can say yes without commitment.

## The follow-up
If no response in 7 days, send one follow-up. Something light. "Wanted to make sure my first email did not get buried." That is it. No more after that.$body$,
 'career', true, now() - interval '25 days'),

('job-search-timeline-reality',
 'Job Search Timeline: What Is Normal',
 'Calibrate your expectations to reality, not optimism.',
 $body$## 2026 reality by seniority
New grad: 3-6 months. Mid-level IC: 2-4 months. Senior IC: 2-3 months. Staff+: 1-3 months (but fewer openings). Executive: 3-9 months.

## By seniority and market
Hot market + strong network: 30-60 days. Soft market + cold searching: 4-8 months. Prepare for the worst case so you are not surprised.

## The funnel
Applications: 100-200 at mid-career. Responses: 15-25%. First rounds: 8-15. Onsites: 3-6. Offers: 1-3. Closed: 1.

## What slows it down
No warm intros. Unfocused target. Incomplete portfolio. Weak resume. Address these before applying more.

## What speeds it up
Being top-of-mind when a role opens. LinkedIn optimized. Weekly coffee with 2-3 people in your industry. Being known as available.$body$,
 'career', true, now() - interval '36 days'),

('staying-in-active-search',
 'Staying Sane in an Active Job Search',
 'The emotional reality no one talks about.',
 $body$## Rejection is not personal
But it feels personal. Accept that you will feel rejected 10-50+ times. Build rituals that let you move through it.

## Daily structure
Morning: applications and outreach. Midday: interviews. Afternoon: skill building or networking. Evening: off. Treat it like a job.

## Weekly reset
Friday afternoon: pause. Review what worked. What did not. Adjust Monday's plan. Sunday off entirely.

## Therapy helps
Job search burnout is real. An unemployment crisis compounds fast. Therapy is cheap insurance against spiraling.

## The long tail of a search
Most offers come in the last 2 weeks of the search. Do not give up in month 3 — you might be one good week from a great offer.$body$,
 'career', true, now() - interval '47 days'),

('interviewing-while-employed',
 'Interviewing While Employed: Staying Discreet',
 'Practical logistics to avoid disrupting your current role.',
 $body$## Calendar management
Lunch hours for recruiter screens. PTO for onsites. Do not take interviews in company conference rooms.

## Technology separation
Personal laptop for applications. Personal email. Personal phone for contacts. Do not use work systems for job search.

## LinkedIn "open to work"
Use the recruiter-only version. Your current employer will not see it, but recruiters can.

## References
Ask references not to confirm to your current manager. Most recruiters respect this request.

## The leakage risk
It happens. Prepare a 30-second story for why you are looking. "Exploring opportunities" is fine. Never badmouth current role — word spreads.$body$,
 'career', true, now() - interval '57 days'),

('multiple-offers-how-to-decide',
 'Multiple Offers: The Framework',
 'Good problem to have. Most people still make bad choices.',
 $body$## Rank by 3-year expected value, not year 1
Base comp is visible. Equity is uncertain. Career trajectory is the long game. Optimize for where you will be in 3 years.

## Rank by people
Who will you work with daily? Who will your manager be? Joining a great team at 90% compensation beats a mediocre team at 100%.

## Rank by momentum
Is this company growing? Will there be room for internal mobility in 18 months? Stagnant companies ceiling you.

## Avoid the auction trap
Bidding wars usually end with the candidate picking the worst fit. Discipline your decision criteria before offers arrive.

## Sleep on it
Do not decide the day the offer comes. Even for the best job ever. 48 hours of reflection tests conviction.$body$,
 'career', true, now() - interval '68 days'),

('writing-a-cover-letter-that-works',
 'Writing a Cover Letter That Actually Helps',
 'Most cover letters hurt. Here is what a good one does.',
 $body$## When to write one
Always when required. Sometimes even when not. For senior roles at smaller companies, a strong cover letter meaningfully moves the needle.

## Three-paragraph structure
Paragraph 1: Why this company specifically, with evidence you did your homework. Paragraph 2: Your 2-3 most relevant accomplishments. Paragraph 3: What you want to learn / contribute next.

## Avoid
Opening with "I am applying for X." Corporate platitudes. Generic praise. "I am a great fit" without evidence.

## Include
A specific quote or artifact from the company (engineering post, recent launch, product video). Signals 5 minutes of research.

## Length
One page max. Under 400 words. If you cannot make the case in 400 words, you do not know the case.$body$,
 'career', true, now() - interval '79 days'),

('follow-up-cadence',
 'Follow-Up Cadence: When to Push, When to Wait',
 'The rhythm that keeps you on their mind without being annoying.',
 $body$## After applying: silence is normal for 7 days
If you have a contact, LinkedIn-connect that person with a short personalized note. If not, wait.

## Recruiter screen: follow up 24 hours later
Thank-you email. Reference specific things discussed. Explicitly state interest.

## After onsite: 24-hour follow-up per interviewer
Individual emails. Reference the conversation. Add one small piece of useful content.

## Awaiting decision: weekly touch base is fine
Short. Professional. "Checking in on status — still interested." Do not chase daily.

## After 3 weeks of silence: move on
Send one final note. "Assuming timing was not right. Please keep me in mind for future roles." Keeps door open.$body$,
 'career', true, now() - interval '90 days'),

('rebranding-your-experience',
 'Rebranding Your Experience for a New Field',
 'How to make a pivot believable on paper.',
 $body$## Lead with the transferable skills
Not the industry. "10 years of operations leadership" rebrands easily. "10 years at X specific insurance company" does not.

## Rewrite bullets for the new audience
Every bullet on your resume should map to the new field. If it does not, cut it or reframe it.

## Portfolio projects bridge the gap
One serious side project in the new field is worth more than 3 years of old experience. Ship something.

## Interview prep in new vocabulary
Learn the frameworks, acronyms, and tooling of the new field. Sound native, even if your experience is not.

## The first role is a bridge
Accept that your first role in a new field pays less than your peak in your old field. Plan to recover in 18-24 months.$body$,
 'career', true, now() - interval '101 days')

on conflict (slug) do nothing;
