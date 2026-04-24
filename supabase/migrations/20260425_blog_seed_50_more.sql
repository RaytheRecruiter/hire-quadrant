-- PR X14: 50 more blog posts, role/seniority/industry/situation-specific.
-- Idempotent via ON CONFLICT (slug) DO NOTHING. Dollar-quoted bodies.

insert into blog_posts (slug, title, excerpt, body, category, published, published_at)
values

-- ============ ROLE-SPECIFIC (10) ============
('software-engineer-resume-template',
 'Software Engineer Resume: What to Include in 2026',
 'The exact structure that gets callbacks from FAANG and top startups.',
 $body$## Top strip: signal in 5 lines
Name, email, LinkedIn, GitHub, current location. Add a one-line headline: "Senior Backend Engineer, 8 years in distributed systems." Skip photos and objectives.

## Skills section: 5 categories, 18-24 items max
Languages / Frameworks / Cloud & Infra / Databases / Tools. More than that signals breadth without depth.

## Experience: verb + outcome + scale
"Rebuilt payment service from monolith to services, cut p99 from 320ms to 85ms, handled 10x traffic growth from 30K to 300K RPS."

## Open source is the new degree
Pin 3-5 repos with real commit history. A GitHub profile with 500+ meaningful commits beats a CS degree for most hiring managers.

## What to leave off
- Technologies you haven't used in 3+ years
- "Full-stack" alone as a skill
- AI-generated bullet points (recruiters spot them)$body$,
 'resume', true, now() - interval '1 day'),

('product-manager-interview-prep',
 'Product Manager Interview Prep: The 4-Round Framework',
 'What top tech PMs actually practice before onsites.',
 $body$## Round 1: Product sense
Expect "how would you improve X?" where X is a product you know. Framework: user segments → pain points → solution options → prioritization → metrics.

## Round 2: Analytical
"A key metric drops 20%. What do you do?" Structured answer: scope the metric, segment the drop, test hypotheses, propose fix. Numbers on the whiteboard.

## Round 3: Execution
"Walk me through a feature you shipped." Lead with the problem and the metric. Details on tradeoffs. Finish with what you'd do differently.

## Round 4: Leadership
"Disagreed with eng lead. How'd you resolve it?" STAR format. Show how you rebuilt trust afterward.

## The reverse-interview move
Ask the PM interviewer: "What's the hardest part of this team?" Their answer tells you whether you want the job.$body$,
 'interview', true, now() - interval '3 days'),

('data-scientist-portfolio',
 'The Data Scientist Portfolio That Gets Offers',
 'Three projects is enough. Here''s what each should look like.',
 $body$## Project 1: An end-to-end business problem
Pick a real business metric. Build a model. Deploy it (even to a Streamlit app). Write it up with hypotheses, methodology, and the counterfactual.

## Project 2: A technical depth piece
Go deep on one technique. Reproduce a paper. Extend it. Show you read research, not just tutorials.

## Project 3: A visualization or storytelling piece
One dataset, one insightful visualization, one compelling narrative. Hiring managers want to see you communicate, not just model.

## What to put on GitHub
Every notebook documented. Every README scannable in 30 seconds. No dead links. No "coming soon" placeholders.

## What not to do
Kaggle competitions as your only portfolio. Model-centric work without business framing. Five half-finished projects instead of three polished ones.$body$,
 'career', true, now() - interval '7 days'),

('ux-designer-portfolio-case-studies',
 'UX Designer Case Studies That Hire Themselves',
 'The structure senior design recruiters scan in 90 seconds.',
 $body$## 1. Problem, in context
Who was the user? What was their pain? What was the business goal? Three sentences max.

## 2. Constraints that mattered
Timeline. Team size. Technical constraints. Research access. These explain decisions later.

## 3. Process (the part that matters)
Research → synthesis → concepts → decisions. Show what you cut and why. Designers who show only final pixels look like stylists.

## 4. The decision moment
Every case study needs one "we almost went with X, but learned Y, so chose Z" moment. This is what separates designers from decorators.

## 5. Outcome with numbers
Conversion, completion rate, qualitative feedback. If there's no metric, say so — and explain what you'd measure next time.$body$,
 'career', true, now() - interval '14 days'),

('devops-sre-interview',
 'DevOps & SRE Interview: Beyond "Explain a Kubernetes Pod"',
 'What senior platform teams actually test for.',
 $body$## Incident response under pressure
"Production is down. Walk me through the first 15 minutes." They want: triage, runbook check, rollback decision, stakeholder comms, root cause analysis. Not hero heroics.

## Distributed systems fluency
CAP theorem, consistency models, consensus algorithms, at-least-once vs exactly-once. You don't need to implement Raft — you need to explain tradeoffs.

## Observability maturity
Metrics vs logs vs traces. When each is the right tool. What you'd instrument in a greenfield service.

## Toil vs engineering
Senior SREs reduce toil. They automate. They push back on manual work. Interviewers look for this mindset.

## On-call philosophy
What's a healthy rotation? How do you prevent burnout? These questions separate teams worth joining from ones to avoid.$body$,
 'interview', true, now() - interval '21 days'),

('account-executive-resume',
 'Account Executive Resume: Numbers Front and Center',
 'Sales resumes live or die on quota attainment. Here''s how to frame it.',
 $body$## Lead with attainment
"President's Club 2023 · 142% of $1.8M quota." This is the first thing sales leaders read. Bury it and you lose the interview.

## Cycle length and ACV
"Avg cycle 42 days · Avg ACV $68K · 14 closes FY24." These three numbers frame your book of business better than any narrative.

## Territory context
New territory built from scratch is different from inherited book. Managed accounts vs hunter. Say which.

## Methodology competency
MEDDIC, Challenger, Sandler, Command of the Message — name what you actually use. Don't list all four unless you actually use all four.

## What not to include
Long bullets about "relationship building." Pipeline numbers without quota context. Words like "closer" or "hunter mindset" without evidence.$body$,
 'resume', true, now() - interval '28 days'),

('engineering-manager-first-90-days',
 'Engineering Manager: Your First 90 Days',
 'The move from IC to EM is the hardest career transition in tech.',
 $body$## Stop coding at scale
Your instinct will be to prove value by shipping features. Resist. Your job is now the team shipping, not you.

## 1:1 cadence, starting day one
Weekly 30-min with every direct report. Three standing questions: what's blocking you, what's energizing you, where do you want to grow.

## Understand the work
Shadow code reviews. Read every design doc. Attend every standup for two weeks. You can't support what you don't understand.

## Find your management style
You'll inherit one from your previous manager. Be deliberate about which pieces to keep. Read one management book a month.

## The first hard conversation
Will come within 60 days. Performance, compensation, or conflict. Don't avoid it — running toward it is the job now.$body$,
 'career', true, now() - interval '36 days'),

('cybersecurity-career-paths',
 'Cybersecurity Career Paths: Which Specialty Fits You',
 'GRC, red team, blue team, detection, appsec — which to pick and why.',
 $body$## Governance, Risk, Compliance (GRC)
High writing, high meetings, low technical depth. Great for people who enjoy frameworks, policies, and cross-functional work.

## Red Team / Offensive
Technical, hands-on, adversarial mindset. Penetration testing, exploit development, physical red teams. Long on-ramp; expect 3-5 years before senior.

## Blue Team / Detection Engineering
Pattern matching at scale. SIEMs, threat hunting, incident response. Shift work common at entry level; intellectual at senior.

## Application Security
Closest to engineering. Code review, threat modeling, SDL. Good path from software engineering.

## Which pays most
In 2026: AppSec > Detection Engineering > Red Team ≈ GRC. Certifications matter more at entry-level; expertise dominates by mid-career.$body$,
 'career', true, now() - interval '45 days'),

('marketing-manager-resume-portfolio',
 'Marketing Manager Resume + Portfolio: What Works Now',
 'Marketing is the most output-focused role. Your portfolio matters as much as your resume.',
 $body$## Resume: numbers, not activities
"Grew organic traffic from 12K → 85K monthly over 18 months through 240 published posts and 12 content partnerships." Not "Managed content marketing."

## Portfolio: 3-5 campaigns
Each with: audience, channel, creative, results. Include one that underperformed and what you learned.

## Channel specialization matters
"Marketing manager" is too broad. Are you SEO? Paid? Lifecycle? Brand? Own one channel as your hero skill and mention others as adjacent.

## Tools aren't skills
HubSpot, Marketo, Klaviyo — these belong in a sidebar, not bulleted as achievements.

## Why creative portfolio
Share examples: landing pages you wrote, ads you creative-directed, emails with subject lines and opens. Screenshots beat descriptions.$body$,
 'resume', true, now() - interval '55 days'),

('customer-success-manager-path',
 'Customer Success Manager: From SMB to Enterprise',
 'The career ladder most CSMs don''t see until it''s too late.',
 $body$## Tier 1: SMB CSM
Book of 200+ accounts, mostly reactive. Pay $60K-$90K. Great training ground for volume and speed.

## Tier 2: Mid-market CSM
30-60 accounts, mix of reactive and proactive. Pay $90K-$130K. Where most CSMs get stuck.

## Tier 3: Enterprise / Strategic CSM
5-15 accounts worth $500K+ each. Pay $140K-$200K. Needs exec presence, QBR facilitation, strategic consulting skills.

## The lateral: CS Ops
If you prefer systems to conversations, CS Ops owns metrics, tooling, playbooks. Different skill tree, same base pay, more technical.

## The jump: VP CS
Requires building the function, not just doing the work. Hiring, quota setting, cross-functional partnership with product + sales.$body$,
 'career', true, now() - interval '65 days'),

-- ============ SENIORITY-SPECIFIC (10) ============
('new-grad-tech-job-search',
 'New Grad Tech Job Search: A 2026 Playbook',
 'The market is tighter. Here''s what actually works.',
 $body$## Apply early, apply widely
New grad roles often fill 6-9 months before start date. Start applying August-September for a June graduation. 80-150 applications is normal; don't let anyone shame you.

## Referrals matter 3x more now
Blind applications have <3% response rate. Referrals hit 15-25%. Spend an hour a day finding one warm intro.

## The portfolio advantage
Grads with 2-3 side projects with real users beat grads with GPA alone. A Next.js app with 20 users on it is worth more than a 3.9 GPA.

## Cast wider than top-tier
The bar at Stripe, Meta, and Google has never been higher. The learning at a well-funded Series B is almost as good with 10x your odds.

## The recruiter LinkedIn move
Follow 30 recruiters in tech. Comment on their posts genuinely. Half will recognize your name by the time you apply.$body$,
 'career', true, now() - interval '2 days'),

('junior-engineer-getting-promoted',
 'Junior Engineer: How to Get Promoted to Mid in 18 Months',
 'Deliberate moves that compress the promotion timeline.',
 $body$## Take on glue work strategically
Not every incident response is worth your time. But the first 2-3 are. Senior eng sees you as someone who cares about production.

## Pick one area to own
Don't be the "generalist junior." Pick one service, one surface area, or one tool. Be the person senior eng asks first.

## Write RFCs early
Juniors who write RFCs stand out. Even if 80% of your first draft gets rewritten, you've demonstrated thinking above grade.

## Ask for stretch projects
In 1:1s: "What's the thing you wish someone on the team owned but no one does?" Volunteer for that.

## Know the promotion rubric
Most teams have one written down. Read it. Map your current work to each line item. Gaps become your 6-month plan.$body$,
 'career', true, now() - interval '12 days'),

('mid-level-plateau',
 'Stuck at Mid-Level: How to Break Through',
 'Senior promotions require different skills than getting to mid.',
 $body$## The scope problem
Mid-levels execute on well-scoped problems. Seniors define scope. If you're still waiting for tickets, you're not performing as senior.

## The influence gap
Mid-levels write good code. Seniors change team direction. Influence comes from writing docs, running meetings, and raising the quality bar on others' work.

## Cross-team work
Seniors operate beyond their team. Find a cross-team project that has stalled. Pick it up. Ship it. That's a promotion packet.

## Mentor someone
You can't be senior without having made others better. Pick a junior. Run weekly pairings. Their trajectory becomes your evidence.

## Have the explicit conversation
Ask your manager: "What would it take for me to promote in the next cycle?" Specific, written, mutually agreed. Track weekly.$body$,
 'career', true, now() - interval '22 days'),

('senior-to-staff-engineer',
 'Senior to Staff: The Hardest Promotion',
 'Most engineers ceiling at senior. Staff requires a different game.',
 $body$## Stop optimizing for personal output
Staff engineers multiply teams. Your commits may drop 50% while your impact 3x's. That trade is the promotion.

## Pick a technical vision
"What should this team look like in 2 years?" Staff engineers answer this. They write the doc. They recruit supporters. They ship the plan.

## Write company-wide
Every staff engineer I know has a canonical document other teams reference. A design doc, a post-mortem, a playbook. One artifact, quoted for years.

## Navigate politics without losing respect
Staff often requires saying no to VPs diplomatically. The skill is making them feel heard while holding the line on what's right.

## Find your sponsor
A Principal or VP who advocates for you in calibration. Without sponsor, staff doesn't happen at most companies.$body$,
 'career', true, now() - interval '33 days'),

('executive-job-search',
 'Executive Job Search: Different Playbook',
 'VP and C-level roles are found, not applied to.',
 $body$## Most exec roles never hit job boards
Board-level networks, executive recruiters, and advisor circles surface 70%+ of exec openings. Your network is your search engine.

## Work with 2-3 retained search firms
Top firms (Spencer Stuart, Heidrick, Korn Ferry) control exec pipelines. Build relationships before you need them.

## Thought leadership as magnetism
Articles, podcasts, conference keynotes — exec opportunities come from people already having your name in their heads.

## The board route
A couple of board or advisor seats early signal readiness for bigger roles. Start 2-3 years before you want the exec jump.

## Exec comp is negotiated differently
Base matters less. Equity, severance protections, change-of-control clauses, board seat rights, founder premium — these are the real levers.$body$,
 'career', true, now() - interval '44 days'),

('career-change-after-40',
 'Career Change After 40: Why It Works',
 'Midcareer pivots are easier than juniors think — if you frame it right.',
 $body$## Your age is an asset
20 years of pattern recognition is not a liability. Frame it as "I bring judgment that junior candidates can't." Most interviewers agree.

## The bridge role
Don't try to go from senior ops to junior dev. Find a role that uses your old skills in the new domain — ops at a fintech, PM at a healthtech, etc.

## Underprice the first role
Be willing to take a $20K-$40K cut to get the first role in the new field. Recover it within 24 months through rapid promotion.

## Skip the bootcamp narrative
Don't apologize for being a career switcher. Lead with why you chose this field, not that you're new to it.

## Age-proof industries
Govtech, biotech, climate, enterprise B2B, healthcare IT. These value experience more than consumer tech does.$body$,
 'career', true, now() - interval '56 days'),

('first-management-role',
 'Your First Management Role: Don''t Make These 3 Mistakes',
 'What new managers universally get wrong.',
 $body$## Mistake 1: Staying hands-on
The instinct to stay technical is strong. Resist. Your output is now the team's output. Coding yourself creates a bottleneck.

## Mistake 2: Trying to be liked
New managers default to friendliness over directness. This erodes respect fast. Candid + kind > friendly + vague.

## Mistake 3: Avoiding performance conversations
The first underperformance conversation is brutal. Every week you delay it compounds the problem. Have it on month 2, not month 6.

## What to do instead
Set expectations in writing. Give feedback weekly. Promote aggressively. Fire quickly when needed. Be the manager you wanted.

## The book shortlist
The Making of a Manager (Zhuo). High Output Management (Grove). Radical Candor (Scott). Read one per month for the first quarter.$body$,
 'career', true, now() - interval '68 days'),

('returning-to-work-after-leave',
 'Returning to Work After Parental Leave or Caregiving',
 'The transition is more predictable than it feels.',
 $body$## First 2 weeks: catch up
Don't try to solve everything. Read your Slack archive. Read your email archive. Take notes. Don't commit to anything new.

## Negotiate flexibility upfront
Hybrid schedule, earlier end-of-day, Friday remote — whatever you need. The best time to negotiate is before your first day back.

## Reset expectations honestly
You may not be at 100% for a quarter. That's fine. Most people aren't. Tell your manager what you're doing and why.

## Rebuild your network
Schedule 1:1 coffees with your 10 closest collaborators within month 1. The soft relationships rust faster than the hard ones.

## The return-to-work career boost
Most parents return with better time management, sharper prioritization, and lower tolerance for BS. These are leadership skills. Lean into them.$body$,
 'career', true, now() - interval '78 days'),

('visa-sponsorship-job-search',
 'Job Searching With Visa Sponsorship Needs',
 'The filter matters. Here''s how to navigate it.',
 $body$## Use the right filters
Indeed, LinkedIn, and HireQuadrant all let you filter by visa sponsorship. Start there. Don't spray at companies that won't sponsor.

## Target companies with H-1B history
USCIS H-1B data is public. Top sponsors file 500+ petitions a year. Medium sponsors 50-500. Under 50 means you're probably not their 51st this year.

## STEM OPT extension matters
If you're an F-1 on OPT, emphasize the extension. Three years of work authorization reads very differently than one.

## Lead with technical fit, not visa story
In first-round interviews, focus on the work. The visa comes up later. A recruiter who likes you will go to bat with their company.

## What to do if rejected for visa reasons
Ask about future openings. Apply again in 6 months. Many companies change visa policies year-to-year.$body$,
 'career', true, now() - interval '88 days'),

('internal-mobility-promotion',
 'Internal Mobility: Why It Often Beats External',
 'A lateral or promotion inside often outperforms jumping.',
 $body$## The trust premium
Inside, you have 3-5 years of trust built up. Externally, you restart. Trust accelerates promotions and compensation.

## Find the hungry manager
Every company has 2-3 teams that are understaffed, fast-growing, and hiring internally. Talk to those managers. Your existing reputation helps.

## The skip-level lunch
Once a quarter, find a chance to talk to your manager's manager. You want them knowing your name before the next calibration.

## Signal your interest early
In 1:1s: "I'd love to be considered for the next level next cycle. What do I need to build?" Explicit asks compound.

## When internal doesn't work
If your manager isn't advocating, your scope hasn't grown, or your calibration peers keep moving up ahead of you — start looking out.$body$,
 'career', true, now() - interval '98 days'),

-- ============ INDUSTRY / SITUATION (10) ============
('tech-layoffs-what-next',
 'After a Tech Layoff: Your First 30 Days',
 'Layoffs suck. Here''s how to move through them without damage.',
 $body$## Week 1: Logistics and mindset
Severance details. Healthcare bridge. Unemployment filing. Don't start applying yet. Your rejections compound if you apply while emotionally raw.

## Week 2: Story and materials
Rewrite your resume. Update LinkedIn. Draft a 3-line "here's what I want next" message for your network.

## Week 3: Activate 20 people
Send personal notes to your 20 strongest professional relationships. Not a blast. Expect 3-5 real conversations within 10 days.

## Week 4: Begin applying
Focus on referrals first (5-10x better response rate). Cold apps are fine but set expectations low.

## Mental health matters
Tech layoffs hit your identity, not just your income. Therapy, a workout routine, a side project. Protect your discipline; lenders favor people who used the time well.$body$,
 'career', true, now() - interval '5 days'),

('startup-vs-big-tech',
 'Startup vs Big Tech: How to Decide',
 'The honest tradeoffs no one tells you until year 3.',
 $body$## Big Tech gives you
Infrastructure, mentorship, brand on your resume, predictable comp. Great for the first 3-5 years of a career or for financial stability.

## Startup gives you
Breadth of work, outsized responsibility, fast learning, direct impact. Worse pay unless the exit happens.

## The equity math
Pre-Series-A equity is usually worthless. Series B-C sometimes matters. Late-stage equity is effectively stock — sometimes less liquid.

## What breaks at each
Big Tech: promotion politics, org reorgs, slow product velocity. Startup: runway anxiety, founder mode, lack of process.

## The honest rule
Join a startup if you''d be happy working there even if the equity went to zero. The expected value of startup equity is usually close to zero.$body$,
 'industry', true, now() - interval '16 days'),

('healthcare-tech-careers',
 'Healthcare Tech Careers: The Growing Crossover',
 'Where healthcare domain meets software — and why it pays.',
 $body$## Why it's growing
The industry is digitizing 20 years late. Billions in private equity plus regulatory pressure means 10+ years of hiring ahead.

## Roles in high demand
EMR integration engineers. HIPAA-compliant infrastructure. Clinical product managers. Revenue cycle operations. Patient-engagement designers.

## The pay reality
Healthcare tech pays 10-20% less than pure tech, but the work is more meaningful to most candidates. The hybrid path (tech-first company serving healthcare) pays parity.

## Skills that transfer
Data engineering, security, platform engineering, product management. Clinical background is a multiplier, not a requirement.

## Companies to watch
Epic, Cerner, Veeva at the legacy end. Komodo, Abridge, Innovaccer among growth-stage. Ro, Hims, Included Health at the consumer end.$body$,
 'industry', true, now() - interval '26 days'),

('fintech-careers-2026',
 'Fintech Careers in 2026: What''s Hiring',
 'After the 2022 correction, which corners of fintech are back.',
 $body$## Payments infrastructure
Stripe, Adyen, Checkout, Airwallex — still hiring aggressively. Senior backend engineers and platform teams in particular.

## Capital markets tech
Modernization of trading, clearing, and settlement infra. Citadel Securities, Jane Street, Two Sigma pay top of market.

## Embedded finance
Companies building banking-as-a-service for non-fintech companies. Unit, Treasury Prime, Synapse survivors. Lots of backend + compliance hiring.

## Crypto's quiet comeback
The 2024-25 regulatory clarity let infrastructure (Circle, Chainalysis, Fireblocks) scale. Less hype, more engineering.

## What's not hiring
Consumer crypto. Buy-now-pay-later. Neobanks. These sectors are consolidating — be careful about Series B fintechs without profit path.$body$,
 'industry', true, now() - interval '38 days'),

('remote-job-search-strategy',
 'Remote Job Search: Where to Actually Look in 2026',
 'Remote listings have gotten noisier. Here''s how to filter.',
 $body$## Remote-first boards
We Work Remotely. Remote OK. Remotive. Arc. HireQuadrant''s remote filter. These have the best signal-to-noise.

## Filter for "remote-first," not "remote-friendly"
Companies that describe remote as "we also hire remote" often promote their in-office people first. Prefer companies where 80%+ are remote.

## The asynchronous culture test
Ask in interviews: "How much of your decision-making is written vs in meetings?" Written-heavy companies scale remote well.

## Timezone flexibility as a filter
"US-based remote" ≠ "EMEA remote." Read the fine print. Timezone overlap requirements make or break the fit.

## Red flags
Mandatory video-on all day. 9-to-5 tracking software. Company policy of monthly in-person. All signal shaky remote culture.$body$,
 'industry', true, now() - interval '50 days'),

('equity-compensation-explained',
 'Equity Compensation: What to Actually Ask For',
 'Stock grants, RSUs, ISOs, NSOs — here''s the playbook.',
 $body$## Know the vehicle
ISOs (incentive stock options) — favorable tax if held right. NSOs (non-qualified) — taxed as income on exercise. RSUs — taxed at vest, no exercise needed.

## The 4-year vesting norm
1-year cliff, then monthly. If they offer less generous, negotiate. If more generous (3 years, no cliff), that's a real win.

## Early exercise and 83(b)
If offered, consider exercising at grant and filing 83(b). Saves taxes if stock appreciates. Lose the money if company fails.

## The refresh question
"When can I expect a refresh grant?" Great companies refresh at year 2. Average companies refresh at year 3. Never-refresh companies ceiling your comp.

## Acceleration on termination
Double-trigger acceleration (on acquisition + termination) is standard for execs. Ask. Most companies will add it.$body$,
 'career', true, now() - interval '62 days'),

('remote-onboarding-first-week',
 'Your First Week at a Remote Job',
 'The difference between a smooth remote onboarding and a disaster.',
 $body$## Day 1: Calendar audit
Block focus hours. Accept only recurring meetings you need. Set working hours on Slack + calendar so people know when you're available.

## Day 2-3: Document the docs
Every company has knowledge scattered. Bookmark the 10 most important links. Create a personal onboarding doc as you learn.

## Day 4: 1:1s with everyone you'll touch
15-min intros with each person. Ask: what does your day look like? What do you wish more people knew about your work? Builds trust fast.

## Day 5: Ship something tiny
Even a doc update, a code comment fix, a process observation written up. Shipping in week 1 resets the internal narrative from "new person" to "producer."

## End of week 1: send a summary
One email to your manager: here's what I learned, here's what I plan to tackle in week 2, here are questions. Shows clarity and self-management.$body$,
 'career', true, now() - interval '74 days'),

('talent-density-hiring',
 'Hiring for Talent Density Over Headcount',
 'Why great teams hire slower and pay more.',
 $body$## The Netflix principle
Keep only people you'd enthusiastically rehire. Everyone else gets a severance and a strong reference. Ruthless, but it compounds.

## The math
One exceptional engineer outperforms three average ones on most work, with lower coordination cost. Pay the top of market; get the compounding effect.

## Interview bar at the point you stop compromising
The single most important hiring habit is saying no when you're 75% sure. Most bad hires come from "we need someone now" moments.

## The manager's hardest job
Not letting great teams dilute. When you're under-staffed and a mediocre candidate shows up, the short-term incentive is hire. The long-term cost is talent density erosion.

## Comp as retention
Losing a top engineer costs 2-3x their salary in productivity. Retain aggressively with pay-to-stay raises and sponsor their development.$body$,
 'hiring', true, now() - interval '84 days'),

('promotion-cycle-prep',
 'How to Prep for the Promotion Cycle',
 'The 3 months before calibration matter more than the previous 9.',
 $body$## Month -3: Gather the evidence
Start a brag doc. One bullet per week: impact, scope, influence. By calibration time you'll have 12+ concrete examples.

## Month -2: Get manager alignment
Explicit conversation: "Here's what I think I'm doing that maps to the next level. What am I missing?" Written, mutual.

## Month -1: Stakeholder feedback
Get 3-5 peers and skip-levels to send your manager unsolicited positive feedback. This shows up in calibration directly.

## Week of calibration: sit tight
Don't lobby. Don't stack meetings. Don't send a recap email. Your manager has the data — trust the process.

## If you don't get it
Ask for concrete gaps. Write them down. Get them agreed. Next cycle, bring the receipts.$body$,
 'career', true, now() - interval '96 days'),

('recruiter-outreach-response',
 'How to Respond to Recruiter LinkedIn Messages',
 'Most people ignore good messages. Here''s how to engage without committing.',
 $body$## The 60-second triage
Is the company real? Is the role level right? Is the pay range mentioned or implied? If all three check, respond.

## The response template
"Thanks for reaching out. I'm not actively looking but always open to hearing about strong opportunities. Could you share: compensation range, the specific team, and what's motivating this hire?"

## What that buys you
Most recruiters answer those three questions. You learn the real pay band and team context without committing.

## Keep warm even when not interested
"Not the right fit for me, but I'm happy to be helpful — do you have a job description I could share with my network?" Referral bonuses flow to you.

## The long-game benefit
Recruiters who know you remember you 2 years later when the right role opens. Be the person who responds graciously even when passing.$body$,
 'career', true, now() - interval '107 days'),

-- ============ PRACTICAL GUIDES (10) ============
('linkedin-profile-optimization',
 'LinkedIn Profile Optimization: 2026 Checklist',
 'Specific changes that lift recruiter inmails 3-5x.',
 $body$## Headline: role + value prop
"Senior Backend Engineer · building payment systems at 10K+ RPS scale." Not "Software Engineer at Company X."

## About section: first 3 lines matter
LinkedIn cuts off at 250 characters. Your first 3 lines are what recruiters see. Make them land.

## Experience: rewrite with impact
Bullet points from your resume, but more narrative. "Led X, resulting in Y, which mattered because Z."

## Skills: top 5 locked in
LinkedIn now lets you "pin" top skills. Pin the 5 that match the role you want next, not what you do today.

## Activity: weekly signal
Comment on 2-3 posts a week in your target industry. Build recognition with recruiters and hiring managers passively.$body$,
 'career', true, now() - interval '8 days'),

('cold-email-hiring-managers',
 'Cold Emailing Hiring Managers: What Works',
 'Warm intros aren''t available. Here''s how cold actually works.',
 $body$## The subject line
"Quick question about [specific team thing]" outperforms "Applying for [role]." You want curiosity, not an auto-filed rejection.

## First paragraph: show you did the work
Reference something specific — a blog post, talk, GitHub repo, recent launch. Not "I saw you're at Company X."

## Second paragraph: your relevant story
90 seconds max, text. Specific outcome + specific transferable skill. Not a resume in paragraph form.

## Third paragraph: the ask
"Could I get 15 minutes to discuss if there's a fit?" Or "Could you forward this to the right recruiter?" Specific and low-commitment.

## Response rate expectations
2-5% response rate for cold emails. 15-25% for warm intros. Send to 50 before expecting momentum.$body$,
 'career', true, now() - interval '19 days'),

('salary-benchmarking-tools',
 'Salary Benchmarking: Where the Real Data Lives',
 'The three sources top candidates actually use.',
 $body$## Levels.fyi
Best for tech compensation. Real self-reported data from verified employees. Breaks out base, bonus, equity by level and location.

## H1B salary data (public)
USCIS publishes H1B wage data — searchable by company and role. No fluff, no hype, actual filed salaries.

## Negotiation-focused paid tools
Rora, Candor, Fishbowl premium tiers. If you're about to negotiate a $30K delta, a $300 tool pays for itself.

## What Glassdoor is useful for
Pay ranges at major companies. Less useful: specific role comp in startups (too sparse).

## The 10-friend rule
Text 10 people at companies you're interviewing with. Ask: "What would you expect for level X in city Y in 2026?" Calibrates against all the tools.$body$,
 'career', true, now() - interval '30 days'),

('asking-good-interview-questions',
 'The 12 Best Questions to Ask Your Interviewer',
 'The right questions separate you from 95% of candidates.',
 $body$## About the role
- What does success look like in the first 6 months?
- What's the most pressing problem the team is facing right now?
- What would I be owning end-to-end vs contributing to?

## About the team
- What's a recent technical decision the team made you're proud of?
- How does the team handle disagreement?
- Who was the last person promoted from this team?

## About management
- How do you like to give feedback?
- What's something you've changed your mind about recently?
- What's keeping you up at night about the team?

## About the company
- What are the biggest risks to the business hitting next year's goals?
- Why do great people leave?
- What's the best and worst part of working here?$body$,
 'interview', true, now() - interval '42 days'),

('reference-check-prep',
 'Reference Check Prep: A Candidate''s Guide',
 'Your references are a signal — but you control most of it.',
 $body$## Pick references who sell hard
Former managers who would actively campaign for you. Peers who''ve seen your best work. Avoid references who give lukewarm endorsements — they read as red flags.

## Brief them beforehand
Call each reference. Remind them of specific projects. Tell them what the new role involves. They'll hit the highlights aligned to the job.

## Three stories to arm them with
One about impact. One about collaboration. One about a challenge you navigated. Fresh stories > old stories, even from years ago.

## What recruiters actually ask
"Would you hire them again?" "What are their development areas?" "Who else should we talk to?" Prep your references for each.

## Back-channel references
Assume they're happening for senior roles. Leave every job well. The manager you didn't burn is the back-channel that lands you the offer.$body$,
 'interview', true, now() - interval '53 days'),

('after-verbal-offer-before-written',
 'After a Verbal Offer: The 72-Hour Playbook',
 'The gap between verbal yes and signed paper is where most money moves.',
 $body$## Never accept on the call
Even if excited, say: "This is great. Can you send the written offer so I can review the details?"

## The 24-hour review
Once the offer arrives, take 24 hours before responding. Read every line. Check equity vesting terms, sign-on clawback, non-compete language.

## Competing offers as leverage
"I have a competing offer at Company X for $Y. Is there flexibility on base or equity?" Genuine offers only — bluffing gets caught.

## The things they'll flex on
Sign-on bonus. Start date. Extra vacation. Title level. Remote flexibility. Base + equity are harder; ask anyway.

## The 48-hour commit
Most companies give 3-5 days. Use 48 hours. Excessive delay signals disengagement. Too fast and you left money on the table.$body$,
 'interview', true, now() - interval '64 days'),

('declining-offer-gracefully',
 'How to Decline a Job Offer Gracefully',
 'Your reputation persists. Here''s how to leave the door open.',
 $body$## Decline by phone if possible
Email is fine, but a 5-min call with the recruiter or hiring manager lands more human. Especially if you''ve interviewed multiple rounds.

## The three-part message
1. Sincere thanks for the time invested. 2. The decision and brief honest reason. 3. Optional door-open note.

## What to actually say
"Thank you for the offer — I've thought about it carefully and I'm going to accept a different role. The team at Company X was exceptional, and I'd love to stay in touch."

## Don't over-explain
Reasons beyond one sentence invite negotiation. Keep it brief.

## The door-left-open bonus
Two years from now, the right role might open at their company. Graceful decliners get referred and re-approached. Burners don't.$body$,
 'interview', true, now() - interval '76 days'),

('negotiating-non-compete-clauses',
 'Negotiating Non-Compete Clauses',
 'What's enforceable, what's not, and what to ask for.',
 $body$## The legal landscape is shifting
Federal non-compete ban was partially struck down, but state-level enforcement varies wildly. California: near-zero enforceable. New York, Washington: tightening. Texas, Florida: strong.

## Always negotiate the scope
Time (cut from 2 years to 6 months), geography (cut from "anywhere" to specific states), industry (narrow to actual competitors).

## The garden leave exchange
Some employers will replace a non-compete with paid garden leave. This is often better for you.

## Non-solicit vs non-compete
Non-solicit (can't recruit former colleagues) is usually enforceable and reasonable. Non-compete is where the real fight is.

## When to push back
If you're senior IC or leadership, a broad non-compete can cost you $500K+ in opportunity cost. Worth the friction to negotiate down.$body$,
 'career', true, now() - interval '87 days'),

('applying-to-100-jobs',
 'Applying to 100 Jobs: A Structured Approach',
 'Spray-and-pray doesn''t work. Here''s the volume approach that does.',
 $body$## Tiering matters
Tier 1 (dream, 10 jobs): customized resume, cover letter, 3-5 warm intros per. Tier 2 (strong fit, 30 jobs): lightly customized resume, referral when possible. Tier 3 (volume, 60 jobs): standard resume, direct apply.

## The 2-hour tier-1 standard
Each tier-1 application: 30 min research, 30 min customized resume, 30 min cover letter, 30 min warm intro outreach. 2 hours. 10 of these = 20 hours total.

## Weekly cadence
2 tier-1, 6 tier-2, 12 tier-3 per week. 20 applications weekly. Review response rate weekly.

## The follow-up system
Day 7: LinkedIn connect with recruiter. Day 14: email follow-up. Day 21: move on. Don''t waste cycles on silence.

## When you hit 100 applications
Review stats: response rate by tier, interview rate by company size, offers by referral vs cold. Adjust where you're spending time based on actual conversion.$body$,
 'career', true, now() - interval '99 days'),

('interview-thank-you-email-template',
 'Interview Thank-You Email: The 5-Line Template',
 'Most thank-yous are forgettable. This one lands.',
 $body$## Line 1: Specific thanks
"Thank you for taking time to talk about the Senior Platform Engineer role today." Not "Thank you for your time." Specificity shows care.

## Line 2: Callback to a specific topic
"Our discussion about the migration strategy from monolith to services was particularly interesting — I hadn''t thought about the shadow traffic approach."

## Line 3: Reinforce your fit
"I left the conversation more excited about the role, particularly the opportunity to [specific thing you'd work on]."

## Line 4: Address a miss (if any)
"On reflection, I wanted to add a thought about the scaling question — I should have mentioned that at my previous role we handled similar constraints by [thing]."

## Line 5: The soft close
"Happy to answer any follow-up questions. Looking forward to next steps."$body$,
 'interview', true, now() - interval '110 days')

on conflict (slug) do nothing;
