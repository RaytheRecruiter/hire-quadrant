-- PR X12: Seed 50 blog posts across career, resume, interview, hiring,
-- industry. Idempotent via ON CONFLICT (slug) DO NOTHING. Staggered
-- published_at across the last 6 months so the archive feels natural.

insert into blog_posts (slug, title, excerpt, body, category, published, published_at)
values

-- ============ CAREER (10) ============
('salary-negotiation-playbook',
 'The Salary Negotiation Playbook',
 'A step-by-step approach used by candidates who walk away with $15K–$40K more.',
 $body$## Know your floor and your ceiling
Before any conversation, pull comp data from three sources: Levels.fyi for tech, Glassdoor for breadth, and peers via Blind or DMs. Decide on a walk-away number and a target.

## Never give the first number
If pushed for a salary expectation early, reframe: "I want to find the right fit first — what's the range budgeted for this role?" This preserves your leverage.

## Anchor high with justification
When you do name a number, anchor at the top of the range and explain why. Reference your impact and market data, not your current salary.

## Negotiate the whole package
Base is one lever. Sign-on bonus, equity refresh, vacation, start date, remote flexibility, and title all carry value. Trade what they have for what you want.

## Get the offer in writing
Never accept verbally. Ask for the written offer, sleep on it, and respond within 48 hours.$body$,
 'career', true, now() - interval '2 days'),

('when-to-quit-your-job',
 'When to Quit Your Job (And How to Know)',
 'The warning signs most people ignore until it''s too late.',
 $body$## The Sunday scaries test
If Sunday nights feel like standing at the edge of a cliff, that's your body telling you what your mind is avoiding. One bad Sunday is a week; three months of bad Sundays is a career signal.

## Growth has stopped
Look back six months. If your skills, your scope, and your network haven't grown, you're in maintenance mode. Maintenance mode compounds negatively — you fall behind the market quietly.

## Your manager stops investing in you
Promotions cancelled. Feedback stops. 1:1s get shorter or move to async. Managers vote with their time.

## The financial trap
Don't quit without runway. The rule of thumb: 6 months of expenses banked if you're leaving to job-search, 9 if you're starting something.

## The two-list exercise
List everything that has to be true for you to stay, and everything that has to be true for you to go. When the "go" list hits 7+ items and the "stay" list is under 3, the decision is already made.$body$,
 'career', true, now() - interval '9 days'),

('building-a-90-day-plan',
 'Your First 90 Days in a New Role',
 'The framework that separates the promoted from the sidelined.',
 $body$## Days 1–30: Listen and Map
Your only goal is understanding. Interview every peer, every stakeholder, every report. Ask: what does success look like here in 6 months? What's broken? Where do people waste time? Don't propose anything.

## Days 31–60: Ship a Small Win
Find one problem you can solve in 2 weeks end-to-end. Not the biggest, the fastest. Ship it. Tell the story. Get momentum.

## Days 61–90: Propose the Bigger Bet
Now you've earned trust. Pitch one meaningful initiative — something that takes a quarter and has a measurable outcome. Write it as a 1-pager. Get alignment before committing.

## The documentation rule
Keep a running Google Doc of every decision you make and why. In 6 months when someone asks "why did you choose X?" you'll have the answer.

## The 360 check-in
At day 90, ask your manager and 3 peers for anonymous feedback. You're close enough to fix anything they surface, far enough in that they can judge honestly.$body$,
 'career', true, now() - interval '18 days'),

('navigating-promotion-denial',
 'You Didn''t Get the Promotion. Now What?',
 'How to turn a bruising "not this cycle" into leverage.',
 $body$## Don't react in 24 hours
The day you get the news, feel whatever you feel. Don't send the email. Don't update your resume. Give yourself a week.

## Get the gap in writing
Ask your manager: "What specifically would have moved this to a yes?" Get it concrete — not "leadership" but "lead two cross-team launches with written post-mortems." Then ask for a written commitment on the next cycle.

## Watch the signal vs the noise
If the gap is specific, addressable, and your manager is investing in you — stay and close it. If the gap is vague ("more impact") and your manager seems checked out — start interviewing.

## Internal transfer as leverage
Sometimes the promotion exists one team over. Talk to 3 other managers inside the company. You'd be surprised how often an L-next role is open somewhere else.

## The external offer gambit
If you're 70% sure you'll leave anyway, a real external offer often unlocks the internal promotion. Use with care — the relationship changes once you've shown a willingness to walk.$body$,
 'career', true, now() - interval '25 days'),

('remote-hybrid-onsite',
 'Remote, Hybrid, or On-Site: How to Choose',
 'The decision is less about geography and more about career stage.',
 $body$## What on-site actually gives you
Dense feedback, easier mentorship, and serendipity. Early-career employees underestimate how much they absorb by hearing senior people handle problems in real time.

## What remote actually gives you
Focused work time, geographic freedom, and — if the company is truly remote-first — written culture that captures decisions. In a half-remote company, remote employees lose out on promotions and politics.

## The hybrid trap
Hybrid is the worst of both worlds when leadership doesn't enforce it. You get the commute of on-site and the information gaps of remote. Great hybrid teams are deliberate: 2 anchor days, in-person design, async for everything else.

## Career stage matters most
First 3 years: lean on-site or strongly hybrid. Years 4–8: hybrid for network, remote for focus. Years 9+: remote usually wins.

## Interview the culture, not just the policy
Ask: "Who was last promoted? Were they remote or on-site?" The answer tells you everything about where the power lives.$body$,
 'career', true, now() - interval '35 days'),

('finding-a-mentor',
 'How to Find a Mentor (Without Asking "Will You Be My Mentor?")',
 'The awkward ask that kills most potential mentorships — and what to do instead.',
 $body$## Don't lead with the label
The phrase "will you be my mentor?" puts a huge commitment on someone who doesn't know you yet. Start smaller: one 30-min conversation about one specific question.

## Make the ask a favor they can say yes to
"I'm thinking about transitioning from IC to manager and your path resonated. Could I take 30 minutes of your time to hear how you made the jump?" That's a yes.

## Show up prepared
Send questions 24 hours ahead. Bring your writing. Be on time. The difference between a one-off conversation and an ongoing relationship is whether the mentor feels their time mattered.

## Follow up with receipts
After the conversation, email 3 days later: "I took your advice about X — here's what happened." That loop is what creates real relationships.

## Diversify your mentors
One person can't give you technical, political, career, and personal advice. Build a council of 3–5 people, each serving one facet.$body$,
 'career', true, now() - interval '45 days'),

('side-projects-that-help',
 'Side Projects That Actually Help Your Career',
 'Most side projects are resume filler. These five categories move the needle.',
 $body$## Teach what you know
A blog post series, a conference talk, or a YouTube channel forces you to articulate what you know. Teaching compounds. Three years in, you're a recognized voice, not just a practitioner.

## Ship something people pay for
Even $50/month from 10 users teaches you more about product, billing, retention, and support than a year of internal work. It's also an unfakeable signal on your resume.

## Contribute to open source
Pick one library you use daily. Fix 3 small issues. Then pick a medium one. Maintainers notice, and the GitHub profile becomes its own resume.

## Build in a new stack
The best way to future-proof is to intentionally work outside your comfort zone once a quarter. If you're a backend dev, build a small Next.js app. If you're a designer, ship a tiny TypeScript CLI.

## What to avoid
Portfolios of 20 half-finished projects. Clones of popular apps with no twist. Side projects driven by "should" rather than genuine curiosity.$body$,
 'career', true, now() - interval '55 days'),

('career-pivot-after-ten-years',
 'Pivoting Careers After 10+ Years',
 'You don''t have to start over — you have to reframe what you already have.',
 $body$## Your experience is the asset, not the liability
Every year of experience outside your new field is a year of transferable skills: pattern recognition, stakeholder management, judgment. Younger candidates don't have these. Lead with them.

## The bridge role
Instead of jumping straight into the new field, find a hybrid role that uses your old skills in the new domain. Example: 10-year ops manager becomes an ops role at a fintech, then transitions to product 18 months in.

## Rebuild your narrative
Recruiters for the new field won't connect your past to the new role. Do that work for them. Every bullet on your resume should read: "Did X, which is directly relevant because Y."

## Underpriced pivots
Engineers going into developer tools. Teachers going into customer success at edtech. Lawyers going into product at legal tech. Accountants going into fintech PM. The common thread: domain expertise + adjacent skills.

## Time horizon
Plan for 12–18 months of transition. The pay hit in year one often recovers by year three, especially if the new field is growing faster.$body$,
 'career', true, now() - interval '70 days'),

('getting-noticed-in-a-big-company',
 'Getting Noticed in a 10,000-Person Company',
 'Good work alone won''t get you promoted. Here''s what will.',
 $body$## The meeting math
If your work is only visible in your team's weekly, 95% of the company doesn't know what you do. Volunteer for cross-team reviews, architecture committees, and all-hands demos.

## Own a narrative, not a project
Projects end. Narratives compound. "I'm the person who improves onboarding" is a narrative. "I shipped the welcome tour" is a project. Become synonymous with one recurring problem.

## Write internally
A monthly update posted in a company-wide channel, summarizing what your team shipped and learned, changes how people see you. It also forces clarity of thought.

## Find an executive sponsor
Your manager can promote you to the next level. An executive sponsor can unlock the level after that. Spend time with them, bring them wins, and be someone they want to bet on.

## Move around
At big companies, the fastest promotions often happen to people who change teams every 18–24 months. New managers, new scope, fresh perspective. Staying too long on one team can ceiling you.$body$,
 'career', true, now() - interval '85 days'),

('after-a-layoff',
 'What to Do the Week After a Layoff',
 'The first 7 days set the tone for the next 60.',
 $body$## Day 1: Don't apply to anything
Feel the feelings. Tell the people who matter. Do not spray-apply to 40 jobs in a panic. You'll get worse responses and the rejections will compound the emotional hit.

## Day 2–3: Audit the package
Severance, COBRA timeline, unused PTO payout, stock vesting cliff, outplacement resources, non-compete clause if any. Get answers in writing.

## Day 4: Update the surfaces
LinkedIn headline, resume, portfolio, and a short note for your network. Skip "open to opportunities" — write a 3-line note about what you want next. Specificity drives referrals.

## Day 5: Activate the 20
Make a list of 20 people who'd take your call today. Former managers, peers who moved on, mentors. Send each a personal note. Not a blast. Expect 12 replies, 6 conversations, and 2–3 intros within a week.

## Day 6–7: Pick a cadence
This job search is a full-time job. Block hours. 9–12 apply + network, 1–3 interview prep, 3–5 skill building. Leave weekends for recovery. Burnout during a search is real.$body$,
 'career', true, now() - interval '95 days'),

-- ============ RESUME (10) ============
('ats-friendly-resume',
 'ATS-Friendly Resume: What Actually Matters in 2026',
 'Most "ATS tips" are wrong. Here''s what the software really does.',
 $body$## What ATS actually does
Applicant tracking systems parse your file into fields (name, work history, education, skills), rank against job keywords, and surface to recruiters. They don't auto-reject based on formatting unless the parser fails completely.

## File format
PDF is now fine everywhere except a few government systems. DOCX is still safer if you're unsure. Never submit a Pages file or an image-heavy PDF.

## Keyword matching
Read the job description, identify 10–15 core nouns/phrases, and weave them into your resume naturally. Don't keyword-stuff — modern ATS uses TF-IDF and catches repetition.

## Layout rules
Single column. No tables for layout. Standard section headings (Experience, Education, Skills). Avoid text inside graphics. Use a readable font at 10–11pt.

## What doesn't matter
Color, a photo (outside US resume norms), a fancy sidebar, a stylized header graphic. The parser ignores all of it. Focus your effort on the bullets, not the design.$body$,
 'resume', true, now() - interval '4 days'),

('action-verbs-that-work',
 'The 30 Action Verbs That Outperform',
 'Hiring managers see "responsible for" 10,000 times a year. Stand out.',
 $body$## Stop using these
Responsible for. Helped. Worked on. Assisted with. Participated in. They signal passive involvement without measurable contribution.

## Verbs that show ownership
Launched, shipped, scaled, architected, owned, led, pioneered, founded. These signal you were on the hook for outcomes.

## Verbs that show impact
Reduced, increased, accelerated, eliminated, streamlined, consolidated, doubled, cut. Pair with a number immediately.

## Verbs that show judgment
Prioritized, negotiated, defended, chose, rejected, championed. These show you made hard calls, not just executed tickets.

## The formula that works
Verb + what you did + measurable outcome + timeframe or scope. Example: "Shipped new onboarding flow that lifted day-7 retention from 34% to 51% across 2M users in Q2."$body$,
 'resume', true, now() - interval '11 days'),

('listing-side-projects',
 'How to List Side Projects on Your Resume',
 'Done right, they land interviews. Done wrong, they signal unfocus.',
 $body$## Only list what's real
Deleting unfinished side projects is better than leaving them. A recruiter clicking a dead URL is a worse signal than a shorter resume.

## Separate section, 2–3 lines each
Don't bury side projects in a "Projects" paragraph. Give each a name, link, one-line description, and 1–2 bullets on what you built and what you learned.

## Lead with user impact if any
"Built X, now used by 400 teams at 12 companies" beats "Built X using React, TypeScript, and Postgres." Tech stack matters, outcomes matter more.

## Highlight uncommon skills
Side projects are where you demonstrate skills your day job doesn't give you. If you're a backend engineer with a live Next.js side project, that's a signal worth naming.

## When to leave them off
If you have 8+ years of experience, side projects can crowd out real work. Keep only the most recent or most relevant. At the senior level, your recent work carries the story.$body$,
 'resume', true, now() - interval '20 days'),

('explaining-resume-gaps',
 'How to Address Resume Gaps',
 'Layoffs, caregiving, burnout — how to frame time away without apologizing.',
 $body$## The market has changed
Recruiters in 2026 have seen layoffs, sabbaticals, and caregiving breaks at unprecedented scale. A 6–18 month gap needs a sentence, not a defense.

## Name it in the resume
A short line in the dates column: "2024–2025: Caregiving leave" or "2023–2024: Sabbatical — travel, OSS contributions." Better to address it than let it become a mystery.

## What not to do
Don't fabricate consulting work. Don't pad dates. Experienced recruiters catch this in reference checks and it ends the process.

## What to do during the gap
If the gap is ongoing, ship one thing publicly. A blog series, an OSS contribution, a conference talk, a small tool. This becomes the "what I did" story when asked.

## The interview answer
Keep it short, forward-looking, and confident: "I took 10 months to [reason]. I'm now fully ready to dive back in and what drew me to this role is [specific thing]." Then redirect.$body$,
 'resume', true, now() - interval '30 days'),

('one-page-vs-two-page',
 'One-Page vs Two-Page Resume',
 'The rule isn''t about pages. It''s about density.',
 $body$## The real rule
If every line earns its place, length matters less. A dense one-pager beats a bloated two-pager every time.

## When one page is right
0–10 years of experience. You haven't accumulated enough meaningful bullets to justify spillover. Forcing two pages means padding, and padding dilutes the strong work.

## When two pages is right
10+ years, or you're in academia, executive search, or a role where your portfolio of work carries weight. Two pages is an expectation, not a flag.

## The density test
Print your resume. Cover the top half with your hand. If the bottom half contains filler — bullets without numbers, phrases like "team player" — cut until only the essential remains.

## What to cut first
Bullets older than 10 years. Any role lasting less than 3 months unless it's strategically relevant. Technology lists that exceed 2 lines. Hobbies, unless they signal something recruiter-relevant.$body$,
 'resume', true, now() - interval '40 days'),

('quantifying-soft-skills',
 'Quantifying "Soft Skills" Without Sounding Fluffy',
 'Communication, leadership, collaboration — here''s how to make them measurable.',
 $body$## Leadership
Number of people managed directly. Headcount across multiple orgs. Budget owned. Initiatives sponsored across how many teams.

## Communication
Audience size you've presented to. Blog posts published and their reach. Internal documents referenced across the company. Podcast appearances or conference talks.

## Collaboration
Cross-team launches counted by team count. RFCs authored that affected multiple orgs. Meetings you facilitated weekly for how long.

## Mentoring
Number of direct reports promoted. Interns or apprentices trained. Recurring office hours and audience size.

## Influence
Decisions you changed without being the decision-maker. Org structures you proposed that shipped. Policies or rituals you introduced that persisted.$body$,
 'resume', true, now() - interval '50 days'),

('technical-resume',
 'The Technical Resume That Gets Engineering Offers',
 'What top-tier engineering recruiters actually scan for in the first 8 seconds.',
 $body$## Top of page: signal density
Name, contact, 2–3 lines that include current title, stack, and strongest credential. Recruiters decide in the first 8 seconds whether to read on.

## Skills section: 5 categories max
Languages. Frameworks. Infrastructure. Tools. Domains. More than 20 items total means you're listing things you touched once.

## Bullets: verb + outcome + scale
"Rebuilt payment service to handle 10x traffic (30K → 300K RPS) reducing p99 latency from 320ms to 85ms."

## Open source and side projects matter more than a degree
For engineers, a GitHub profile with real commits outweighs most credentials. Link it prominently.

## What to leave out
Technologies you haven't touched in 3+ years. Every single tool in your certs. Buzzwords like "synergy" or "innovative." Keep the resume as a filter for technical reality, not marketing.$body$,
 'resume', true, now() - interval '60 days'),

('resume-keywords-by-industry',
 'Resume Keywords That Actually Matter (By Industry)',
 'Generic keyword advice is useless. Here''s industry-specific guidance.',
 $body$## Software engineering
Real signals: specific languages, frameworks, cloud platforms (AWS/GCP/Azure), system design breadth. Dead signals: "full-stack" alone, "agile," "team player."

## Data roles
Real signals: SQL proficiency, specific modeling techniques, experimentation frameworks, dashboarding tools. Dead: "big data," "insights," "storytelling."

## Product management
Real signals: specific metrics you moved, users/revenue/retention numbers, discovery methods, prioritization frameworks. Dead: "passionate about products," "user-centric."

## Sales
Real signals: quota attainment %, ACV closed, cycle length reduced, ICP specificity. Dead: "relationship builder," "closer."

## Design
Real signals: shipped features with measurable impact, design systems owned, research methods employed. Dead: "creative," "passionate about UX," "thinker."$body$,
 'resume', true, now() - interval '75 days'),

('common-resume-mistakes',
 '11 Common Resume Mistakes That Cost You Interviews',
 'Quick audit — if any of these apply, you''re bleeding opportunity.',
 $body$## The objective statement
No recruiter reads objectives. Replace with a 2–3 line summary of what you do and what's next, or cut entirely.

## Generic bullets
If a bullet could appear on anyone's resume in your role, cut it. Specificity wins.

## Unprioritized skills list
Skills section in alphabetical order signals no judgment. Order by relevance to the job, then recency.

## Outdated contact info
An AOL email, no LinkedIn, a dead portfolio URL. The first impression is sloppiness.

## Typos
One typo is a flag. Three typos is a rejection. Read every word aloud before submitting. Ask a friend.

## Weak verb choices
Helped, worked on, assisted with — all signal passive involvement. Every bullet starts with a strong action verb.

## No metrics
A resume without numbers reads as opinion. Numbers read as fact.

## Chronology inverted
Most recent role at top, always. "Functional" resumes that hide timelines trigger recruiter suspicion.

## Fluff keywords
Synergy, ninja, guru, rockstar, passionate — cut every one.

## Hobbies that don't signal anything
"Hiking" and "reading" add nothing. "Founder of a 200-member running club" adds something.

## Resume longer than needed
Aim for density, not length. Every line should earn its place.$body$,
 'resume', true, now() - interval '90 days'),

('portfolio-vs-resume',
 'Portfolio vs Resume: When to Show What',
 'Designers, writers, and PMs ask this constantly. Here''s the answer.',
 $body$## For initial outreach: resume
Recruiters need to scan quickly. A link to an overwhelming portfolio in the first email dilutes focus. Send the resume with the portfolio linked in the header.

## For the first call: portfolio ready
Hiring managers want to see work. By the first conversation, have 2–3 case studies queued up — short, specific, ready to walk through in 5 minutes each.

## Case study structure
Problem (1 paragraph). Constraints (bullet points). Process (the interesting part — decisions, not just visuals). Outcome (with numbers).

## What to include
3–5 case studies max. Diverse problem types. Mix of solo and collaborative work. Include at least one where the work didn't fully succeed and explain what you'd do differently.

## What to leave off
Every project you've ever done. Case studies over 3 years old unless they're flagship work. Work you can't discuss due to NDA — either get permission or don't show.$body$,
 'resume', true, now() - interval '105 days'),

-- ============ INTERVIEW (10) ============
('behavioral-interview-playbook',
 'The Behavioral Interview Playbook',
 'Stop winging behavioral questions. Here''s the framework that works.',
 $body$## The STAR format, properly used
Situation (1 sentence context). Task (1 sentence what you owned). Action (3–4 sentences on what you did). Result (1–2 sentences with numbers). Most candidates drown in Situation and rush Result.

## Build your story bank
Write 8–10 stories from your career, each tagged with themes: conflict, leadership, failure, ambiguity, technical depth, stakeholder management. Interviewers rotate through these themes.

## Lead with Result for senior roles
Senior interviewers often prefer the reverse: "I led a migration that cut costs 40%. Here's the situation..." It respects their time.

## Pick stories that show growth
The strongest behavioral stories include a moment of wrong-turn or learning. "I was sure X was right. The data showed Y. I changed my mind and here's what I learned."

## Avoid the hero monologue
"I" is fine, but "we" lands better for collaborative work. Name specific teammates. Recruiters pattern-match on collaborative thinking.$body$,
 'interview', true, now() - interval '3 days'),

('technical-interview-prep',
 'Technical Interview Prep: 6 Weeks to Ready',
 'The structured study plan that beats random LeetCode.',
 $body$## Week 1: Diagnostic
Pick 10 medium LeetCode problems across arrays, trees, graphs, DP. Solve each in 45 min untimed. Note which categories you struggle with. Your study plan attacks those.

## Weeks 2–3: Pattern mastery
Study patterns, not individual problems. 15 core patterns (sliding window, DFS/BFS, heap, binary search, etc.) cover 80% of interview questions. For each, do 3–5 problems until the pattern is automatic.

## Week 4: System design
If the role is mid-level or senior, you need this. Work through Designing Data-Intensive Applications's key chapters, then drill 8 classic designs: URL shortener, news feed, rate limiter, typeahead, chat, payment system, distributed cache, metrics platform.

## Week 5: Mocks
Do 6–8 mock interviews with peers or services. Record yourself. Watch back. You'll hate it. Everyone does. It works.

## Week 6: Taper
Don't burn out the week before. Do 1 problem a day. Review your notes. Sleep. The calmer you walk in, the better you perform.$body$,
 'interview', true, now() - interval '13 days'),

('whiteboard-coding',
 'Whiteboard Coding: 8 Habits That Signal Senior',
 'The difference between good and senior in coding interviews isn''t speed.',
 $body$## Clarify before coding
Senior candidates spend 5+ minutes on constraints, edge cases, and scale. Juniors jump straight to code. The first 5 minutes earn more signal than the next 20.

## Narrate your thinking
Silent code is a black box. Narrate tradeoffs, why you're choosing one approach, what the risks are. The interviewer is evaluating your thought process as much as your answer.

## Name the complexity
Say the time and space complexity out loud before coding. Then revisit at the end. It shows you think about scale without prompting.

## Handle edge cases proactively
Empty input, single element, extreme values, duplicates, overflow. Listing these before coding signals care.

## Write clean code
Good variable names. No magic numbers. Consistent formatting. Senior candidates code as if the interviewer is a future code reviewer.

## Test your own code
Trace through with 1–2 examples before asking if it works. Catching your own bug is a strong signal.

## Ask "what if scale doubles?"
After the basic solution works, proactively discuss how it'd scale. Senior interviewers love this unprompted.

## Close cleanly
"My solution works in O(n log n) because… alternative was O(n²) which doesn't scale past 10K items… for production I'd also consider X." That's a senior finish.$body$,
 'interview', true, now() - interval '22 days'),

('system-design-interview',
 'System Design: From Panic to Pattern',
 'The 45-minute design interview, broken into a repeatable structure.',
 $body$## First 5 min: Requirements
Functional (what must it do?), non-functional (scale, latency, availability), and constraints. Write them on the board. Don't skip this — candidates who do get downleveled.

## Next 5 min: Back-of-envelope
Estimate DAU, QPS, storage growth. Shows you think at scale before you draw boxes.

## Minutes 10–25: High-level design
Start with a clean box diagram: client, load balancer, API servers, data stores. Then deepen the parts most relevant to the problem — usually the data layer and the write path.

## Minutes 25–35: Deep dive
Pick 1–2 components the interviewer seems curious about. Talk schema, indexing, consistency model, failure modes.

## Minutes 35–40: Bottlenecks and tradeoffs
Identify where this breaks at 10x scale. Cache strategy, sharding, async processing. Name the tradeoffs explicitly.

## Minutes 40–45: Wrap
Summarize the design in 3 sentences. Call out 1–2 things you'd add with more time.$body$,
 'interview', true, now() - interval '32 days'),

('why-this-company',
 'How to Answer "Why This Company?" (Without Being Generic)',
 'The most underestimated question in interviews. Here''s how to nail it.',
 $body$## What generic sounds like
"I love your mission and product." Interviewer tunes out in 3 seconds.

## The three-layer answer
1. A specific thing you noticed about the company (product, engineering blog, recent announcement, culture signal). 2. Why that resonates with you personally. 3. What you'd bring to that.

## Example
"I read your engineering post on how you migrated from monolith to services over 18 months — the part about keeping feature development unblocked during migration matched a playbook I used at my last company. I'd love to work with a team that thinks about migrations as systems, not projects."

## Do your homework
30 minutes on the company's blog, LinkedIn posts, latest press. Identify one specific thing no other candidate will mention.

## Avoid the backhanded version
"Your competitors are struggling" is a red flag. Talk about what you're drawn to, not what others get wrong.$body$,
 'interview', true, now() - interval '40 days'),

('weakness-questions',
 'Answering Weakness Questions Without Cliché',
 '"I''m a perfectionist" is an interview killer. Try this instead.',
 $body$## What interviewers actually want
Self-awareness, the fact that you've thought about improvement, and evidence you've acted on it. They're not testing whether you're weak — they're testing whether you're self-reflective.

## The three-part formula
1. Name a real weakness. 2. Describe how it's shown up. 3. Share what you're actively doing about it.

## A real example
"I tend to stay heads-down on execution longer than I should instead of pulling stakeholders in early. At my last company, I shipped a project that solved the wrong problem because I didn't socialize the approach early enough. Now I send a design doc by week two on every project, even when I think I know the answer. It's slowed me down 10%, but killed the rework."

## Avoid the classics
"I work too hard." "I'm a perfectionist." "I care too much." These signal you're dodging the question.

## Weakness that works with your role
A PM admitting they sometimes over-rotate on data at the expense of speed. An engineer admitting they under-invest in writing. A designer admitting they can over-iterate. Role-adjacent weaknesses are credible and safe.$body$,
 'interview', true, now() - interval '52 days'),

('back-channel-references',
 'Back-Channel References: What Recruiters Check (And What to Do)',
 'Your interview performance matters. So does what people say about you when you''re not there.',
 $body$## What back-channel reference means
Beyond the official references you provide, recruiters ask mutual connections informally: what's it like to work with this person?

## Who gets checked
Candidates for senior, leadership, or high-stakes roles. Small ecosystems (startups, specific industries) — assume everyone is checking.

## What they ask
Judgment under pressure. Collaboration with peers. How they handled conflict. Whether they'd hire them again.

## How to protect yourself
Leave every job well. Even bad ones. Especially bad ones. The manager you didn't burn is the manager who gives the 30-second back-channel endorsement.

## Proactive strategy
Before a job search, check in with 8–10 former managers and peers. Not for references — just a warm "how are you?" The network that remembers you is the network that vouches for you.$body$,
 'interview', true, now() - interval '65 days'),

('remote-interview-best-practices',
 'Remote Interview Best Practices',
 'The candidate who looks good on camera has a real edge. Here''s the setup.',
 $body$## Camera at eye level
Webcams below eye level make you look smaller. Stack books under your laptop until the camera is level with your eyes.

## Lighting
Face a window or a soft light source. Never backlight. A $30 ring light changes how you come across on camera more than any other single investment.

## Audio matters more than video
Use wired headphones with a mic, or a standalone USB mic. Laptop mics pick up echo and fan noise. Bad audio is more fatiguing than bad video.

## Kill distractions
Quiet room. Phone on do-not-disturb. Browser down to one tab. A visible clock off-screen so you don't glance at the system clock.

## Watch the gaze
Looking at their face on your screen means looking away from the camera. Position the video window as close to the camera lens as possible, and practice looking at the lens during your answers.

## Test 10 minutes early
Open the link, check A/V, have a glass of water, review your notes. Don't start a remote interview already stressed from a tech issue.$body$,
 'interview', true, now() - interval '75 days'),

('final-round-interviews',
 'Surviving the Final Round',
 'The onsite (or its virtual equivalent) is not a repeat of earlier rounds.',
 $body$## The bar raises
Final rounds are evaluative at a different level — executive presence, strategic thinking, cultural alignment. Don't just prepare more technical depth.

## Research every interviewer
LinkedIn each one. Identify common ground, their career path, and 1–2 specific questions you'd ask them. Hiring managers notice when you've done this.

## The executive slot
The C-level or VP slot is a culture and judgment interview. They're asking: can this person represent us to customers, the board, the press? Prep your story, your values, your judgment on real tradeoffs.

## Pace yourself
A 5-hour onsite requires stamina. Eat before. Bring water. Take the bathroom break between slots — even if you don't need it, reset.

## The reverse-interview question
At every slot, have a different, thoughtful question ready. "What would I work on in the first 30 days?" and "What's the biggest risk to your team hitting its goals this year?" consistently land well.$body$,
 'interview', true, now() - interval '88 days'),

('following-up-after-interview',
 'How to Follow Up After an Interview',
 'The follow-up is a tool, not just a thank-you.',
 $body$## The 24-hour window
Send within 24 hours. After that, the interview is fading from their memory. Same-day is ideal.

## Per-interviewer, not a group email
One message to each person you spoke with. Reference a specific thing they said or asked — proves you were listening.

## What to include
1. Thank them specifically. 2. One or two sentences reinforcing why you're excited. 3. Address anything you didn't land in the interview. 4. Ask about next steps if you don't already know.

## The miss-reframe
If a question went poorly, the follow-up is your second chance. "I was thinking more about the scaling question — I'd also add X, which I didn't mention in the moment." Mature interviewers appreciate this.

## After no response
Wait 5 business days, then send a single polite nudge. After that, silence is the answer. Move on gracefully — the role could come back around in 2 years.$body$,
 'interview', true, now() - interval '100 days'),

-- ============ HIRING (10) ============
('inclusive-job-descriptions',
 'Writing Inclusive Job Descriptions',
 'Small language choices shape who applies. Here''s what to change.',
 $body$## Drop the unicorn list
Long requirements lists disproportionately screen out women and underrepresented candidates who apply only when they meet 100% of criteria. 5–7 must-haves maximum.

## Ditch "rockstar" and "ninja"
These words correlate with less-diverse applicant pools. Replace with concrete role descriptions.

## Focus on outcomes, not pedigree
"Experience shipping user-facing features" beats "3+ years at a top-tier tech company." Pedigree filters out strong candidates from non-traditional paths.

## Salary transparency
Include a pay range. Candidates from underrepresented backgrounds are more likely to self-select out when ranges are hidden.

## Benefits that matter for inclusion
Parental leave, caregiving support, mental health benefits, flexible work, visa sponsorship. Listing these surfaces the candidates who need them.$body$,
 'hiring', true, now() - interval '5 days'),

('designing-screening-loops',
 'Designing a Screening Loop That Works',
 'Most interview loops measure interview ability, not job ability. Fix that.',
 $body$## Start from the job
List the 5 most important things the new hire will do in their first 6 months. Every loop stage should test one of those things. If a stage doesn't map to a real job skill, cut it.

## Limit to 4–5 stages
Recruiter screen → hiring manager → 2–3 role-specific interviews → decision. Longer loops lose top candidates to faster competitors.

## Structured, not free-form
Every interviewer uses the same questions and a shared rubric. Unstructured interviews have near-zero predictive validity for job performance.

## Work sample > hypothetical
Have them do something that looks like the job. A paid take-home. A live design exercise. A case study. It predicts performance far better than puzzle questions.

## Calibrate your interviewers
New interviewers shadow 3 loops before running their own. Calibrate bar by reviewing past hires: who was a hit, who wasn't, why.$body$,
 'hiring', true, now() - interval '15 days'),

('structured-interviews',
 'Why Structured Interviews Beat Free-Form (Every Time)',
 'The research has been consistent for decades. Most companies ignore it.',
 $body$## The data
Free-form interviews have a predictive validity of ~0.2 (barely better than random) for job performance. Structured interviews hit 0.5+. It's one of the largest effect sizes in HR research.

## What "structured" means
Same questions, same order, same rubric, same scoring scale. Every candidate gets the same experience.

## Build a question bank
For each competency you're testing, write 3–4 behavioral questions. Interviewers draw from the bank consistently. No free-wheeling.

## Rubric before the interview
Define what a 1, 3, and 5 looks like for each question. Score immediately after the interview before discussion with other interviewers. Discuss after to minimize anchoring.

## Why companies resist
It feels robotic. Interviewers miss the "vibe" assessment. But the vibe assessment is exactly where bias enters. Trust the process.$body$,
 'hiring', true, now() - interval '25 days'),

('reducing-hiring-bias',
 'Concrete Steps to Reduce Bias in Hiring',
 'Awareness isn''t enough. Process changes are.',
 $body$## Blind the resume screen
Remove names, graduation dates, and schools for the initial screen. Focus on experience and impact.

## Diverse interview panels
Every loop includes at least one interviewer who isn't from the hiring manager's demographic majority. Not for performative reasons — it materially changes decisions.

## Score independently first
Interviewers submit scores and written feedback before the debrief. This prevents the loudest voice from anchoring the room.

## Track conversion rates
By source, by demographic (where allowed), by stage. Where candidates drop out reveals where bias lives.

## Kill culture fit
Replace with "culture add" or "values alignment." Culture fit historically means "feels like us," which compounds homogeneity.$body$,
 'hiring', true, now() - interval '35 days'),

('candidate-experience',
 'Candidate Experience: Why It''s Worth Investing In',
 'Every rejected candidate is a potential future hire, customer, or reference.',
 $body$## The one-in-three rule
One in three candidates tells others about their interview experience — publicly, in Slack, on Glassdoor. Bad experiences get broadcasted.

## Fast decisions beat slow ones
Time-to-decide under 2 weeks correlates with acceptance rate. Every extra week reduces close rate.

## Communicate through silence
The worst candidate experience isn't a rejection — it's ghosting. Send a status update every 5 business days, even if there's no news.

## Rejections with humanity
Templated but personalized. Tell them why, if you can. Thank them for their time. Leave the door open for future roles. Candidates remember rejection quality more than any other signal.

## Offer experience
Offer letter within 48 hours of verbal acceptance. A welcome package. An intro call with the team before start date. The last mile matters.$body$,
 'hiring', true, now() - interval '48 days'),

('offer-negotiation-employer-side',
 'Offer Negotiation From the Employer Side',
 'How to make competitive offers that land.',
 $body$## Know your bands
Go into every offer knowing the band, the midpoint, and how high you can flex. Negotiating without a ceiling leads to inconsistency and resentment on your team.

## Lead with total comp
Present base + bonus + equity + benefits as one number. Candidates fixate on base when you don't.

## The first number
Start 10–15% above where you expect to land. Leaving negotiation room shows good faith.

## What to flex on
Sign-on bonus is cheaper than raising base. Extra vacation is cheaper than raising base. Title and level changes are harder to reverse than comp.

## When they're in another process
Ask directly: "Do you have a competing offer?" Then decide whether to match, beat, or walk. Don't guess.

## The exploding offer
Don't. 72-hour deadlines signal insecurity. A candidate who takes your offer because they had to rush will leave within a year.$body$,
 'hiring', true, now() - interval '60 days'),

('background-checks',
 'Background Check Best Practices',
 'The steps most companies get wrong, and the legal pitfalls to avoid.',
 $body$## Scope to the role
Run only what the job requires. Credit checks make sense for a CFO role, not for a designer. Over-checking risks FCRA violations and signals mistrust.

## Get written consent
FCRA requires clear, standalone disclosure and consent before the check. Buried in boilerplate is a legal risk.

## Pre-adverse action notice
If a report shows something concerning, you must give the candidate a copy and a reasonable window to dispute before acting. This trips many fast-moving companies.

## The ban-the-box laws
Dozens of states and cities now prohibit asking about criminal history until after a conditional offer. Check each state you're hiring in.

## Reasonable discretion
Criminal history shouldn't automatically disqualify. EEOC guidance requires an individualized assessment: nature of the offense, time passed, relevance to the role.$body$,
 'hiring', true, now() - interval '70 days'),

('remote-hiring',
 'Remote Hiring: Patterns That Work',
 'Hiring across timezones isn''t the same as on-site hiring plus Zoom.',
 $body$## Timezone is the first filter
Be clear up front about overlap requirements. "Remote, but 4+ hours of overlap with US Pacific" saves weeks of misalignment.

## Async work sample
For remote roles, include an async component in the loop. A written exercise the candidate completes on their own time. Tests async communication — the core skill for remote work.

## Slower decisions, tighter process
Without hallway conversations, the written feedback in your ATS matters more. Invest in better notes.

## Onboarding is 2x harder remote
Hiring is only the start. Budget 3x the onboarding time you'd use for on-site. Assign a buddy. Schedule intentional 1:1s across the team.

## Pay geography
Decide the policy early: pay by role (regardless of location) or adjust by location. Both are defensible. Switching mid-stream erodes trust.$body$,
 'hiring', true, now() - interval '82 days'),

('culture-add-not-culture-fit',
 'Culture Add, Not Culture Fit',
 'One small word change reshapes the talent you attract.',
 $body$## Culture fit is a trap
It rewards hiring people who look and think like the team already there. Over years, this calcifies culture and ceilings growth.

## Culture add, defined
Does this person share our core values AND bring something we don't have? Judgment, experience, perspective. A culture add hire strengthens the team, a culture fit hire just extends it.

## Separating values from style
Core values (e.g. "deliver excellent work, treat each other with respect") should be non-negotiable. Style (pace, communication preferences, energy) should be where you add diversity.

## Interview differently
Ask: "When have you disagreed with a team consensus? What did you do?" "What's a lesson from your past that this team probably hasn't internalized yet?" These surface add, not fit.

## Measure the change
Track team composition over 12 months after adopting culture add. Expect more generative disagreement, slightly slower initial decisions, better outcomes.$body$,
 'hiring', true, now() - interval '92 days'),

('firing-with-empathy',
 'Firing With Empathy',
 'Most managers are bad at this. It costs them — and the person they''re letting go.',
 $body$## Give the warning
Performance-based terminations should almost never be a surprise. If the person is surprised, your feedback process failed. A written improvement plan with specific, measurable milestones protects everyone.

## Decide, then move quickly
Once you've decided, drag creates anxiety and poisons the team. Aim for decision-to-conversation within a week.

## The conversation itself
Keep it under 15 minutes. State the decision in the first 30 seconds. Acknowledge the effort. Share the severance and logistics. Don't negotiate the decision.

## Generosity matters
Severance, extended healthcare, a strong LinkedIn recommendation where truthful, transition support. The market watches how you let people go.

## Tell the team
Same day. Brief but honest. Answer one round of questions, then close. Don't over-explain — it erodes trust in your confidentiality.$body$,
 'hiring', true, now() - interval '108 days'),

-- ============ INDUSTRY (10) ============
('tech-hiring-trends-2026',
 'Tech Hiring Trends: What''s Changing in 2026',
 'Six shifts shaping how engineering, product, and design roles are filled.',
 $body$## 1. Skills-based hiring accelerates
Fewer job postings require degrees. More require specific demonstrated outcomes. Portfolios and work samples outweigh pedigree.

## 2. Compressed interview loops
Top candidates won't sit through 8-stage loops anymore. Companies moving fastest are condensing to 3–4 high-signal stages.

## 3. AI interview tooling
AI is now summarizing interviews, scoring rubrics, and flagging inconsistencies. Candidates, meanwhile, are using AI to prep answers. The arms race is on.

## 4. Remote hiring plateaus
After the pandemic boom, fully remote roles have plateaued. Hybrid is winning. Companies mandating RTO are losing talent to competitors that didn't.

## 5. Salary transparency expands
Ten states now require posted ranges. Expect federal legislation before 2028.

## 6. The senior/junior gap
Junior hiring froze in 2024 and is slowly thawing. Senior candidates are in a seller's market. Companies are solving with apprenticeships and internal mobility.$body$,
 'industry', true, now() - interval '6 days'),

('fractional-executive-rise',
 'The Rise of the Fractional Executive',
 'Why more startups are hiring CMOs and CFOs for 10 hours a week.',
 $body$## What changed
Fractional isn't new, but it's exploded since 2023. Seed-to-Series-A startups that couldn't afford senior talent can now hire it 10–20 hours a week.

## Which functions fit
Fractional works best for strategy-heavy, lower-velocity roles: CFO, CMO, CPO (for early-stage), head of ops. It works worst for hands-on building functions.

## Pricing norms
$5K–$15K/month for 10–20 hours per week. Top operators charge $20K+. Compared to a $300K full-time hire, this is $60K–$180K annualized — meaningful savings.

## Pitfalls
Fractional leaders can't own a team deeply. Attrition risk is higher (they have 3–5 clients). Onboarding takes longer as a percentage of their time.

## When to transition to full-time
Most fractional arrangements end when the company reaches Series A/B and can afford a full-time leader. The best fractional becomes an advisor or board member.$body$,
 'industry', true, now() - interval '17 days'),

('return-to-office-debate',
 'Return to Office: What the Data Says in 2026',
 'Three years of data, debated in thousands of boardrooms. Here''s the synthesis.',
 $body$## Productivity data is mixed
Both sides have studies backing them. The more rigorous ones suggest remote hurts less-experienced workers, helps experienced workers, and on average is a wash.

## Innovation data leans on-site
Multiple studies show in-person teams generate more spontaneous collaborations and patents. Remote teams outperform on execution of well-defined work.

## Retention is clear
Mandating RTO for companies previously remote causes 10–25% attrition, disproportionately among senior women and caregivers. Companies that did it often regretted it.

## The culture split
Tech and creative industries: remote/hybrid is becoming the default. Finance, consulting, biotech labs: largely on-site.

## What actually matters
The best outcomes aren't driven by location policy — they're driven by intentionality. Teams that are deliberate about when to gather and when to work async outperform, regardless of format.$body$,
 'industry', true, now() - interval '27 days'),

('skills-based-hiring',
 'Skills-Based Hiring: Reality vs Hype',
 'Every company says they''re doing it. Few actually are.',
 $body$## What's changed
IBM, Google, Deloitte, and Bank of America have all reduced degree requirements. Job postings requiring degrees are down ~20% since 2020.

## What hasn't changed
In practice, most companies still filter on pedigree. Removing "BA required" from the posting doesn't change what recruiters shortlist.

## What actually works
Skills assessments early in the funnel. Work samples as filter. Structured interviews that score on demonstrated competency, not background. Committed companies measure it quarterly.

## For candidates
Skills-based postings are a signal but not a guarantee. Apply, but also look at the team's actual composition via LinkedIn — that tells you whether it's real.

## The long arc
This will keep accelerating. Degree requirements will be the exception by 2030 in most tech and creative roles. In regulated industries (medical, legal, aviation), they'll persist.$body$,
 'industry', true, now() - interval '38 days'),

('ai-in-recruiting',
 'AI in Recruiting: What''s Real, What''s Hype',
 'A practical look at what AI can actually do in the hiring pipeline.',
 $body$## What AI is good at now
Resume parsing, candidate sourcing at scale, interview scheduling, note-taking and summarization, sending follow-up emails, generating first-draft job descriptions.

## What AI is bad at now
Final-round assessments. Cultural evaluation. Anything requiring judgment on ambiguous work samples. Any context requiring nuance beyond the prompt.

## The bias problem
AI models inherit the biases of the data they were trained on. Amazon famously killed an AI hiring tool because it discriminated against women. Regular audits are now the norm for responsible deployments.

## The candidate side
Candidates use AI too. For resumes, cover letters, even interview prep. The market is an AI vs AI conversation that humans still arbitrate.

## Regulatory horizon
EU AI Act and NYC Local Law 144 both require disclosure and bias audits of automated employment decision tools. Expect US federal rules in the next 24 months.$body$,
 'industry', true, now() - interval '50 days'),

('four-day-workweek',
 'The Four-Day Workweek: After the Experiments',
 'Three years of pilots. What actually happened.',
 $body$## The big studies
61 UK companies ran a 6-month pilot in 2022. 92% extended the four-day week. Productivity held, retention improved, burnout fell. Follow-ups in 2024 showed similar results across Spain, Portugal, and Iceland.

## Who it works for
Knowledge work with clear outputs. Software, design, writing, consulting. Roles where the workweek was already padded with low-value meetings.

## Who it's harder for
Customer support, operations, healthcare. Anything with 24/7 coverage requirements. Even here, pilots are finding creative rotation schedules.

## The 32-hour reality
Most successful implementations cut meetings aggressively. Standups move async. Deep work expands. People report the time savings come from less work, not faster work.

## For candidates
More companies are advertising this. Ask in interviews: "Is this a real 4-day week or a compressed 5-day week?" They're very different.$body$,
 'industry', true, now() - interval '62 days'),

('salary-transparency-laws',
 'Salary Transparency Laws: State by State',
 'What''s legally required and what''s coming next.',
 $body$## Currently required (posting ranges)
Colorado, California, New York, Washington, Maryland, Hawaii, Illinois, Minnesota, Connecticut, Nevada, Vermont. More expected each year.

## Nuances to know
Some require the range upfront, some on candidate request, some only for in-state roles, some for remote roles offered to in-state candidates.

## What "good faith range" means
A range based on what you'd actually pay, not a $50K–$500K pseudo-range. Regulators are starting to enforce.

## Employer adjustments
Companies that previously hid ranges are discovering internal inequities when ranges go public. This is triggering large comp adjustments — some companies have budgeted $10M+.

## For candidates
You now have data you didn't before. Use it in negotiations. Also note: ranges favor candidates on the lower end of experience — you'll see the ceiling, and can ask for it if you can justify.$body$,
 'industry', true, now() - interval '74 days'),

('gig-economy-growth',
 'The Gig Economy''s Quiet Growth in Knowledge Work',
 'Contract, freelance, and project-based work is growing faster than full-time.',
 $body$## Bigger than headlines suggest
The gig economy is no longer just rideshare. High-end knowledge work — consulting, design, engineering, product management on a project basis — is growing faster than full-time employment.

## Why workers like it
Higher hourly rates. Schedule control. Variety. Ability to work for multiple companies simultaneously.

## Why workers dislike it
No health benefits. No unemployment insurance. No equity. Income volatility. Self-employed tax complexity.

## Why employers like it
Flexibility. No severance exposure. Access to talent that won't come in-house. Scale up/down by project.

## The regulatory battleground
The W-2/1099 line is being aggressively contested. California AB5 is the bellwether. Expect more enforcement — and more carve-outs — in the next 24 months.$body$,
 'industry', true, now() - interval '86 days'),

('remote-first-companies',
 'Remote-First Companies: What They Do Differently',
 'It''s not about having a Slack account. It''s operating principles.',
 $body$## Written everything
Decisions, designs, and debates happen in docs and RFCs, not meetings. New hires can ramp by reading, without needing a meeting schedule.

## Small meetings, written outcomes
Every meeting has a written doc before and a written summary after. Meetings are for decisions, not status.

## Timezone overlap norms
The best remote-first companies keep 4+ hours of overlap between any two teammates. Beyond that, async is the expectation.

## Offsite rhythm
Two to four in-person gatherings a year. These are when the trust and relationships get built that async communication relies on.

## Manager investment
Remote-first companies invest 2x as much in manager training. Without hallway feedback, the formal feedback process has to do all the work.$body$,
 'industry', true, now() - interval '98 days'),

('early-career-pipeline',
 'The Early-Career Pipeline Crisis',
 'Junior hiring slowed in 2024–25. The downstream effects will hit for years.',
 $body$## What happened
From 2023 onward, companies cut junior hiring aggressively. New grads from 2024 faced the toughest market in a decade.

## Why it matters in 3 years
Juniors become mid-levels. Mid-levels become seniors. Skipping a cohort creates a gap that persists for years. Companies that cut hardest will have the thinnest mid-level bench in 2027.

## The AI acceleration argument
Some argue AI can replace junior work. The evidence is mixed — AI helps but doesn't fully substitute. Companies that assumed it could are already hiring back.

## Apprenticeships are rising
6–12 month structured programs with paid training and a clear conversion path. Companies like Multiverse and Holberton are scaling. Expect this model to replace some college-to-corporate paths.

## For candidates early in careers
The first role matters less than it did. Mobility is higher. Build a portfolio publicly, find a mentor, and plan for 2–3 different roles in your first 5 years.$body$,
 'industry', true, now() - interval '110 days')

on conflict (slug) do nothing;
