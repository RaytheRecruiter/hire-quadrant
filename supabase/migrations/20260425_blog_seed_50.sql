-- PR X12: Seed 50 blog posts across career, resume, interview, hiring,
-- industry. Idempotent via ON CONFLICT (slug) DO NOTHING. Staggered
-- published_at across the last 6 months so the archive feels natural.

insert into blog_posts (slug, title, excerpt, body, category, published, published_at)
values

-- ============ CAREER (10) ============
('salary-negotiation-playbook',
 'The Salary Negotiation Playbook',
 'A step-by-step approach used by candidates who walk away with $15K–$40K more.',
 E'## Know your floor and your ceiling\nBefore any conversation, pull comp data from three sources: Levels.fyi for tech, Glassdoor for breadth, and peers via Blind or DMs. Decide on a walk-away number and a target.\n\n## Never give the first number\nIf pushed for a salary expectation early, reframe: "I want to find the right fit first — what''s the range budgeted for this role?" This preserves your leverage.\n\n## Anchor high with justification\nWhen you do name a number, anchor at the top of the range and explain why. Reference your impact and market data, not your current salary.\n\n## Negotiate the whole package\nBase is one lever. Sign-on bonus, equity refresh, vacation, start date, remote flexibility, and title all carry value. Trade what they have for what you want.\n\n## Get the offer in writing\nNever accept verbally. Ask for the written offer, sleep on it, and respond within 48 hours.',
 'career', true, now() - interval '2 days'),

('when-to-quit-your-job',
 'When to Quit Your Job (And How to Know)',
 'The warning signs most people ignore until it''s too late.',
 E'## The Sunday scaries test\nIf Sunday nights feel like standing at the edge of a cliff, that''s your body telling you what your mind is avoiding. One bad Sunday is a week; three months of bad Sundays is a career signal.\n\n## Growth has stopped\nLook back six months. If your skills, your scope, and your network haven''t grown, you''re in maintenance mode. Maintenance mode compounds negatively — you fall behind the market quietly.\n\n## Your manager stops investing in you\nPromotions cancelled. Feedback stops. 1:1s get shorter or move to async. Managers vote with their time.\n\n## The financial trap\nDon''t quit without runway. The rule of thumb: 6 months of expenses banked if you''re leaving to job-search, 9 if you''re starting something.\n\n## The two-list exercise\nList everything that has to be true for you to stay, and everything that has to be true for you to go. When the "go" list hits 7+ items and the "stay" list is under 3, the decision is already made.',
 'career', true, now() - interval '9 days'),

('building-a-90-day-plan',
 'Your First 90 Days in a New Role',
 'The framework that separates the promoted from the sidelined.',
 E'## Days 1–30: Listen and Map\nYour only goal is understanding. Interview every peer, every stakeholder, every report. Ask: what does success look like here in 6 months? What''s broken? Where do people waste time? Don''t propose anything.\n\n## Days 31–60: Ship a Small Win\nFind one problem you can solve in 2 weeks end-to-end. Not the biggest, the fastest. Ship it. Tell the story. Get momentum.\n\n## Days 61–90: Propose the Bigger Bet\nNow you''ve earned trust. Pitch one meaningful initiative — something that takes a quarter and has a measurable outcome. Write it as a 1-pager. Get alignment before committing.\n\n## The documentation rule\nKeep a running Google Doc of every decision you make and why. In 6 months when someone asks "why did you choose X?" you''ll have the answer.\n\n## The 360 check-in\nAt day 90, ask your manager and 3 peers for anonymous feedback. You''re close enough to fix anything they surface, far enough in that they can judge honestly.',
 'career', true, now() - interval '18 days'),

('navigating-promotion-denial',
 'You Didn''t Get the Promotion. Now What?',
 'How to turn a bruising "not this cycle" into leverage.',
 E'## Don''t react in 24 hours\nThe day you get the news, feel whatever you feel. Don''t send the email. Don''t update your resume. Give yourself a week.\n\n## Get the gap in writing\nAsk your manager: "What specifically would have moved this to a yes?" Get it concrete — not "leadership" but "lead two cross-team launches with written post-mortems." Then ask for a written commitment on the next cycle.\n\n## Watch the signal vs the noise\nIf the gap is specific, addressable, and your manager is investing in you — stay and close it. If the gap is vague ("more impact") and your manager seems checked out — start interviewing.\n\n## Internal transfer as leverage\nSometimes the promotion exists one team over. Talk to 3 other managers inside the company. You''d be surprised how often an L-next role is open somewhere else.\n\n## The external offer gambit\nIf you''re 70% sure you''ll leave anyway, a real external offer often unlocks the internal promotion. Use with care — the relationship changes once you''ve shown a willingness to walk.',
 'career', true, now() - interval '25 days'),

('remote-hybrid-onsite',
 'Remote, Hybrid, or On-Site: How to Choose',
 'The decision is less about geography and more about career stage.',
 E'## What on-site actually gives you\nDense feedback, easier mentorship, and serendipity. Early-career employees underestimate how much they absorb by hearing senior people handle problems in real time.\n\n## What remote actually gives you\nFocused work time, geographic freedom, and — if the company is truly remote-first — written culture that captures decisions. In a half-remote company, remote employees lose out on promotions and politics.\n\n## The hybrid trap\nHybrid is the worst of both worlds when leadership doesn''t enforce it. You get the commute of on-site and the information gaps of remote. Great hybrid teams are deliberate: 2 anchor days, in-person design, async for everything else.\n\n## Career stage matters most\nFirst 3 years: lean on-site or strongly hybrid. Years 4–8: hybrid for network, remote for focus. Years 9+: remote usually wins.\n\n## Interview the culture, not just the policy\nAsk: "Who was last promoted? Were they remote or on-site?" The answer tells you everything about where the power lives.',
 'career', true, now() - interval '35 days'),

('finding-a-mentor',
 'How to Find a Mentor (Without Asking "Will You Be My Mentor?")',
 'The awkward ask that kills most potential mentorships — and what to do instead.',
 E'## Don''t lead with the label\nThe phrase "will you be my mentor?" puts a huge commitment on someone who doesn''t know you yet. Start smaller: one 30-min conversation about one specific question.\n\n## Make the ask a favor they can say yes to\n"I''m thinking about transitioning from IC to manager and your path resonated. Could I take 30 minutes of your time to hear how you made the jump?" That''s a yes.\n\n## Show up prepared\nSend questions 24 hours ahead. Bring your writing. Be on time. The difference between a one-off conversation and an ongoing relationship is whether the mentor feels their time mattered.\n\n## Follow up with receipts\nAfter the conversation, email 3 days later: "I took your advice about X — here''s what happened." That loop is what creates real relationships.\n\n## Diversify your mentors\nOne person can''t give you technical, political, career, and personal advice. Build a council of 3–5 people, each serving one facet.',
 'career', true, now() - interval '45 days'),

('side-projects-that-help',
 'Side Projects That Actually Help Your Career',
 'Most side projects are resume filler. These five categories move the needle.',
 E'## Teach what you know\nA blog post series, a conference talk, or a YouTube channel forces you to articulate what you know. Teaching compounds. Three years in, you''re a recognized voice, not just a practitioner.\n\n## Ship something people pay for\nEven $50/month from 10 users teaches you more about product, billing, retention, and support than a year of internal work. It''s also an unfakeable signal on your resume.\n\n## Contribute to open source\nPick one library you use daily. Fix 3 small issues. Then pick a medium one. Maintainers notice, and the GitHub profile becomes its own resume.\n\n## Build in a new stack\nThe best way to future-proof is to intentionally work outside your comfort zone once a quarter. If you''re a backend dev, build a small Next.js app. If you''re a designer, ship a tiny TypeScript CLI.\n\n## What to avoid\nPortfolios of 20 half-finished projects. Clones of popular apps with no twist. Side projects driven by "should" rather than genuine curiosity.',
 'career', true, now() - interval '55 days'),

('career-pivot-after-ten-years',
 'Pivoting Careers After 10+ Years',
 'You don''t have to start over — you have to reframe what you already have.',
 E'## Your experience is the asset, not the liability\nEvery year of experience outside your new field is a year of transferable skills: pattern recognition, stakeholder management, judgment. Younger candidates don''t have these. Lead with them.\n\n## The bridge role\nInstead of jumping straight into the new field, find a hybrid role that uses your old skills in the new domain. Example: 10-year ops manager becomes an ops role at a fintech, then transitions to product 18 months in.\n\n## Rebuild your narrative\nRecruiters for the new field won''t connect your past to the new role. Do that work for them. Every bullet on your resume should read: "Did X, which is directly relevant because Y."\n\n## Underpriced pivots\nEngineers going into developer tools. Teachers going into customer success at edtech. Lawyers going into product at legal tech. Accountants going into fintech PM. The common thread: domain expertise + adjacent skills.\n\n## Time horizon\nPlan for 12–18 months of transition. The pay hit in year one often recovers by year three, especially if the new field is growing faster.',
 'career', true, now() - interval '70 days'),

('getting-noticed-in-a-big-company',
 'Getting Noticed in a 10,000-Person Company',
 'Good work alone won''t get you promoted. Here''s what will.',
 E'## The meeting math\nIf your work is only visible in your team''s weekly, 95% of the company doesn''t know what you do. Volunteer for cross-team reviews, architecture committees, and all-hands demos.\n\n## Own a narrative, not a project\nProjects end. Narratives compound. "I''m the person who improves onboarding" is a narrative. "I shipped the welcome tour" is a project. Become synonymous with one recurring problem.\n\n## Write internally\nA monthly update posted in a company-wide channel, summarizing what your team shipped and learned, changes how people see you. It also forces clarity of thought.\n\n## Find an executive sponsor\nYour manager can promote you to the next level. An executive sponsor can unlock the level after that. Spend time with them, bring them wins, and be someone they want to bet on.\n\n## Move around\nAt big companies, the fastest promotions often happen to people who change teams every 18–24 months. New managers, new scope, fresh perspective. Staying too long on one team can ceiling you.',
 'career', true, now() - interval '85 days'),

('after-a-layoff',
 'What to Do the Week After a Layoff',
 'The first 7 days set the tone for the next 60.',
 E'## Day 1: Don''t apply to anything\nFeel the feelings. Tell the people who matter. Do not spray-apply to 40 jobs in a panic. You''ll get worse responses and the rejections will compound the emotional hit.\n\n## Day 2–3: Audit the package\nSeverance, COBRA timeline, unused PTO payout, stock vesting cliff, outplacement resources, non-compete clause if any. Get answers in writing.\n\n## Day 4: Update the surfaces\nLinkedIn headline, resume, portfolio, and a short note for your network. Skip "open to opportunities" — write a 3-line note about what you want next. Specificity drives referrals.\n\n## Day 5: Activate the 20\nMake a list of 20 people who''d take your call today. Former managers, peers who moved on, mentors. Send each a personal note. Not a blast. Expect 12 replies, 6 conversations, and 2–3 intros within a week.\n\n## Day 6–7: Pick a cadence\nThis job search is a full-time job. Block hours. 9–12 apply + network, 1–3 interview prep, 3–5 skill building. Leave weekends for recovery. Burnout during a search is real.',
 'career', true, now() - interval '95 days'),

-- ============ RESUME (10) ============
('ats-friendly-resume',
 'ATS-Friendly Resume: What Actually Matters in 2026',
 'Most "ATS tips" are wrong. Here''s what the software really does.',
 E'## What ATS actually does\nApplicant tracking systems parse your file into fields (name, work history, education, skills), rank against job keywords, and surface to recruiters. They don''t auto-reject based on formatting unless the parser fails completely.\n\n## File format\nPDF is now fine everywhere except a few government systems. DOCX is still safer if you''re unsure. Never submit a Pages file or an image-heavy PDF.\n\n## Keyword matching\nRead the job description, identify 10–15 core nouns/phrases, and weave them into your resume naturally. Don''t keyword-stuff — modern ATS uses TF-IDF and catches repetition.\n\n## Layout rules\nSingle column. No tables for layout. Standard section headings (Experience, Education, Skills). Avoid text inside graphics. Use a readable font at 10–11pt.\n\n## What doesn''t matter\nColor, a photo (outside US resume norms), a fancy sidebar, a stylized header graphic. The parser ignores all of it. Focus your effort on the bullets, not the design.',
 'resume', true, now() - interval '4 days'),

('action-verbs-that-work',
 'The 30 Action Verbs That Outperform',
 'Hiring managers see "responsible for" 10,000 times a year. Stand out.',
 E'## Stop using these\nResponsible for. Helped. Worked on. Assisted with. Participated in. They signal passive involvement without measurable contribution.\n\n## Verbs that show ownership\nLaunched, shipped, scaled, architected, owned, led, pioneered, founded. These signal you were on the hook for outcomes.\n\n## Verbs that show impact\nReduced, increased, accelerated, eliminated, streamlined, consolidated, doubled, cut. Pair with a number immediately.\n\n## Verbs that show judgment\nPrioritized, negotiated, defended, chose, rejected, championed. These show you made hard calls, not just executed tickets.\n\n## The formula that works\nVerb + what you did + measurable outcome + timeframe or scope. Example: "Shipped new onboarding flow that lifted day-7 retention from 34% to 51% across 2M users in Q2."',
 'resume', true, now() - interval '11 days'),

('listing-side-projects',
 'How to List Side Projects on Your Resume',
 'Done right, they land interviews. Done wrong, they signal unfocus.',
 E'## Only list what''s real\nDeleting unfinished side projects is better than leaving them. A recruiter clicking a dead URL is a worse signal than a shorter resume.\n\n## Separate section, 2–3 lines each\nDon''t bury side projects in a "Projects" paragraph. Give each a name, link, one-line description, and 1–2 bullets on what you built and what you learned.\n\n## Lead with user impact if any\n"Built X, now used by 400 teams at 12 companies" beats "Built X using React, TypeScript, and Postgres." Tech stack matters, outcomes matter more.\n\n## Highlight uncommon skills\nSide projects are where you demonstrate skills your day job doesn''t give you. If you''re a backend engineer with a live Next.js side project, that''s a signal worth naming.\n\n## When to leave them off\nIf you have 8+ years of experience, side projects can crowd out real work. Keep only the most recent or most relevant. At the senior level, your recent work carries the story.',
 'resume', true, now() - interval '20 days'),

('explaining-resume-gaps',
 'How to Address Resume Gaps',
 'Layoffs, caregiving, burnout — how to frame time away without apologizing.',
 E'## The market has changed\nRecruiters in 2026 have seen layoffs, sabbaticals, and caregiving breaks at unprecedented scale. A 6–18 month gap needs a sentence, not a defense.\n\n## Name it in the resume\nA short line in the dates column: "2024–2025: Caregiving leave" or "2023–2024: Sabbatical — travel, OSS contributions." Better to address it than let it become a mystery.\n\n## What not to do\nDon''t fabricate consulting work. Don''t pad dates. Experienced recruiters catch this in reference checks and it ends the process.\n\n## What to do during the gap\nIf the gap is ongoing, ship one thing publicly. A blog series, an OSS contribution, a conference talk, a small tool. This becomes the "what I did" story when asked.\n\n## The interview answer\nKeep it short, forward-looking, and confident: "I took 10 months to [reason]. I''m now fully ready to dive back in and what drew me to this role is [specific thing]." Then redirect.',
 'resume', true, now() - interval '30 days'),

('one-page-vs-two-page',
 'One-Page vs Two-Page Resume',
 'The rule isn''t about pages. It''s about density.',
 E'## The real rule\nIf every line earns its place, length matters less. A dense one-pager beats a bloated two-pager every time.\n\n## When one page is right\n0–10 years of experience. You haven''t accumulated enough meaningful bullets to justify spillover. Forcing two pages means padding, and padding dilutes the strong work.\n\n## When two pages is right\n10+ years, or you''re in academia, executive search, or a role where your portfolio of work carries weight. Two pages is an expectation, not a flag.\n\n## The density test\nPrint your resume. Cover the top half with your hand. If the bottom half contains filler — bullets without numbers, phrases like "team player" — cut until only the essential remains.\n\n## What to cut first\nBullets older than 10 years. Any role lasting less than 3 months unless it''s strategically relevant. Technology lists that exceed 2 lines. Hobbies, unless they signal something recruiter-relevant.',
 'resume', true, now() - interval '40 days'),

('quantifying-soft-skills',
 'Quantifying "Soft Skills" Without Sounding Fluffy',
 'Communication, leadership, collaboration — here''s how to make them measurable.',
 E'## Leadership\nNumber of people managed directly. Headcount across multiple orgs. Budget owned. Initiatives sponsored across how many teams.\n\n## Communication\nAudience size you''ve presented to. Blog posts published and their reach. Internal documents referenced across the company. Podcast appearances or conference talks.\n\n## Collaboration\nCross-team launches counted by team count. RFCs authored that affected multiple orgs. Meetings you facilitated weekly for how long.\n\n## Mentoring\nNumber of direct reports promoted. Interns or apprentices trained. Recurring office hours and audience size.\n\n## Influence\nDecisions you changed without being the decision-maker. Org structures you proposed that shipped. Policies or rituals you introduced that persisted.',
 'resume', true, now() - interval '50 days'),

('technical-resume',
 'The Technical Resume That Gets Engineering Offers',
 'What top-tier engineering recruiters actually scan for in the first 8 seconds.',
 E'## Top of page: signal density\nName, contact, 2–3 lines that include current title, stack, and strongest credential. Recruiters decide in the first 8 seconds whether to read on.\n\n## Skills section: 5 categories max\nLanguages. Frameworks. Infrastructure. Tools. Domains. More than 20 items total means you''re listing things you touched once.\n\n## Bullets: verb + outcome + scale\n"Rebuilt payment service to handle 10x traffic (30K → 300K RPS) reducing p99 latency from 320ms to 85ms."\n\n## Open source and side projects matter more than a degree\nFor engineers, a GitHub profile with real commits outweighs most credentials. Link it prominently.\n\n## What to leave out\nTechnologies you haven''t touched in 3+ years. Every single tool in your certs. Buzzwords like "synergy" or "innovative." Keep the resume as a filter for technical reality, not marketing.',
 'resume', true, now() - interval '60 days'),

('resume-keywords-by-industry',
 'Resume Keywords That Actually Matter (By Industry)',
 'Generic keyword advice is useless. Here''s industry-specific guidance.',
 E'## Software engineering\nReal signals: specific languages, frameworks, cloud platforms (AWS/GCP/Azure), system design breadth. Dead signals: "full-stack" alone, "agile," "team player."\n\n## Data roles\nReal signals: SQL proficiency, specific modeling techniques, experimentation frameworks, dashboarding tools. Dead: "big data," "insights," "storytelling."\n\n## Product management\nReal signals: specific metrics you moved, users/revenue/retention numbers, discovery methods, prioritization frameworks. Dead: "passionate about products," "user-centric."\n\n## Sales\nReal signals: quota attainment %, ACV closed, cycle length reduced, ICP specificity. Dead: "relationship builder," "closer."\n\n## Design\nReal signals: shipped features with measurable impact, design systems owned, research methods employed. Dead: "creative," "passionate about UX," "thinker."',
 'resume', true, now() - interval '75 days'),

('common-resume-mistakes',
 '11 Common Resume Mistakes That Cost You Interviews',
 'Quick audit — if any of these apply, you''re bleeding opportunity.',
 E'## The objective statement\nNo recruiter reads objectives. Replace with a 2–3 line summary of what you do and what''s next, or cut entirely.\n\n## Generic bullets\nIf a bullet could appear on anyone''s resume in your role, cut it. Specificity wins.\n\n## Unprioritized skills list\nSkills section in alphabetical order signals no judgment. Order by relevance to the job, then recency.\n\n## Outdated contact info\nAn AOL email, no LinkedIn, a dead portfolio URL. The first impression is sloppiness.\n\n## Typos\nOne typo is a flag. Three typos is a rejection. Read every word aloud before submitting. Ask a friend.\n\n## Weak verb choices\nHelped, worked on, assisted with — all signal passive involvement. Every bullet starts with a strong action verb.\n\n## No metrics\nA resume without numbers reads as opinion. Numbers read as fact.\n\n## Chronology inverted\nMost recent role at top, always. "Functional" resumes that hide timelines trigger recruiter suspicion.\n\n## Fluff keywords\nSynergy, ninja, guru, rockstar, passionate — cut every one.\n\n## Hobbies that don''t signal anything\n"Hiking" and "reading" add nothing. "Founder of a 200-member running club" adds something.\n\n## Resume longer than needed\nAim for density, not length. Every line should earn its place.',
 'resume', true, now() - interval '90 days'),

('portfolio-vs-resume',
 'Portfolio vs Resume: When to Show What',
 'Designers, writers, and PMs ask this constantly. Here''s the answer.',
 E'## For initial outreach: resume\nRecruiters need to scan quickly. A link to an overwhelming portfolio in the first email dilutes focus. Send the resume with the portfolio linked in the header.\n\n## For the first call: portfolio ready\nHiring managers want to see work. By the first conversation, have 2–3 case studies queued up — short, specific, ready to walk through in 5 minutes each.\n\n## Case study structure\nProblem (1 paragraph). Constraints (bullet points). Process (the interesting part — decisions, not just visuals). Outcome (with numbers).\n\n## What to include\n3–5 case studies max. Diverse problem types. Mix of solo and collaborative work. Include at least one where the work didn''t fully succeed and explain what you''d do differently.\n\n## What to leave off\nEvery project you''ve ever done. Case studies over 3 years old unless they''re flagship work. Work you can''t discuss due to NDA — either get permission or don''t show.',
 'resume', true, now() - interval '105 days'),

-- ============ INTERVIEW (10) ============
('behavioral-interview-playbook',
 'The Behavioral Interview Playbook',
 'Stop winging behavioral questions. Here''s the framework that works.',
 E'## The STAR format, properly used\nSituation (1 sentence context). Task (1 sentence what you owned). Action (3–4 sentences on what you did). Result (1–2 sentences with numbers). Most candidates drown in Situation and rush Result.\n\n## Build your story bank\nWrite 8–10 stories from your career, each tagged with themes: conflict, leadership, failure, ambiguity, technical depth, stakeholder management. Interviewers rotate through these themes.\n\n## Lead with Result for senior roles\nSenior interviewers often prefer the reverse: "I led a migration that cut costs 40%. Here''s the situation..." It respects their time.\n\n## Pick stories that show growth\nThe strongest behavioral stories include a moment of wrong-turn or learning. "I was sure X was right. The data showed Y. I changed my mind and here''s what I learned."\n\n## Avoid the hero monologue\n"I" is fine, but "we" lands better for collaborative work. Name specific teammates. Recruiters pattern-match on collaborative thinking.',
 'interview', true, now() - interval '3 days'),

('technical-interview-prep',
 'Technical Interview Prep: 6 Weeks to Ready',
 'The structured study plan that beats random LeetCode.',
 E'## Week 1: Diagnostic\nPick 10 medium LeetCode problems across arrays, trees, graphs, DP. Solve each in 45 min untimed. Note which categories you struggle with. Your study plan attacks those.\n\n## Weeks 2–3: Pattern mastery\nStudy patterns, not individual problems. 15 core patterns (sliding window, DFS/BFS, heap, binary search, etc.) cover 80% of interview questions. For each, do 3–5 problems until the pattern is automatic.\n\n## Week 4: System design\nIf the role is mid-level or senior, you need this. Work through Designing Data-Intensive Applications''s key chapters, then drill 8 classic designs: URL shortener, news feed, rate limiter, typeahead, chat, payment system, distributed cache, metrics platform.\n\n## Week 5: Mocks\nDo 6–8 mock interviews with peers or services. Record yourself. Watch back. You''ll hate it. Everyone does. It works.\n\n## Week 6: Taper\nDon''t burn out the week before. Do 1 problem a day. Review your notes. Sleep. The calmer you walk in, the better you perform.',
 'interview', true, now() - interval '13 days'),

('whiteboard-coding',
 'Whiteboard Coding: 8 Habits That Signal Senior',
 'The difference between good and senior in coding interviews isn''t speed.',
 E'## Clarify before coding\nSenior candidates spend 5+ minutes on constraints, edge cases, and scale. Juniors jump straight to code. The first 5 minutes earn more signal than the next 20.\n\n## Narrate your thinking\nSilent code is a black box. Narrate tradeoffs, why you''re choosing one approach, what the risks are. The interviewer is evaluating your thought process as much as your answer.\n\n## Name the complexity\nSay the time and space complexity out loud before coding. Then revisit at the end. It shows you think about scale without prompting.\n\n## Handle edge cases proactively\nEmpty input, single element, extreme values, duplicates, overflow. Listing these before coding signals care.\n\n## Write clean code\nGood variable names. No magic numbers. Consistent formatting. Senior candidates code as if the interviewer is a future code reviewer.\n\n## Test your own code\nTrace through with 1–2 examples before asking if it works. Catching your own bug is a strong signal.\n\n## Ask "what if scale doubles?"\nAfter the basic solution works, proactively discuss how it''d scale. Senior interviewers love this unprompted.\n\n## Close cleanly\n"My solution works in O(n log n) because… alternative was O(n²) which doesn''t scale past 10K items… for production I''d also consider X." That''s a senior finish.',
 'interview', true, now() - interval '22 days'),

('system-design-interview',
 'System Design: From Panic to Pattern',
 'The 45-minute design interview, broken into a repeatable structure.',
 E'## First 5 min: Requirements\nFunctional (what must it do?), non-functional (scale, latency, availability), and constraints. Write them on the board. Don''t skip this — candidates who do get downleveled.\n\n## Next 5 min: Back-of-envelope\nEstimate DAU, QPS, storage growth. Shows you think at scale before you draw boxes.\n\n## Minutes 10–25: High-level design\nStart with a clean box diagram: client, load balancer, API servers, data stores. Then deepen the parts most relevant to the problem — usually the data layer and the write path.\n\n## Minutes 25–35: Deep dive\nPick 1–2 components the interviewer seems curious about. Talk schema, indexing, consistency model, failure modes.\n\n## Minutes 35–40: Bottlenecks and tradeoffs\nIdentify where this breaks at 10x scale. Cache strategy, sharding, async processing. Name the tradeoffs explicitly.\n\n## Minutes 40–45: Wrap\nSummarize the design in 3 sentences. Call out 1–2 things you''d add with more time.',
 'interview', true, now() - interval '32 days'),

('why-this-company',
 'How to Answer "Why This Company?" (Without Being Generic)',
 'The most underestimated question in interviews. Here''s how to nail it.',
 E'## What generic sounds like\n"I love your mission and product." Interviewer tunes out in 3 seconds.\n\n## The three-layer answer\n1. A specific thing you noticed about the company (product, engineering blog, recent announcement, culture signal). 2. Why that resonates with you personally. 3. What you''d bring to that.\n\n## Example\n"I read your engineering post on how you migrated from monolith to services over 18 months — the part about keeping feature development unblocked during migration matched a playbook I used at my last company. I''d love to work with a team that thinks about migrations as systems, not projects."\n\n## Do your homework\n30 minutes on the company''s blog, LinkedIn posts, latest press. Identify one specific thing no other candidate will mention.\n\n## Avoid the backhanded version\n"Your competitors are struggling" is a red flag. Talk about what you''re drawn to, not what others get wrong.',
 'interview', true, now() - interval '40 days'),

('weakness-questions',
 'Answering Weakness Questions Without Cliché',
 '"I''m a perfectionist" is an interview killer. Try this instead.',
 E'## What interviewers actually want\nSelf-awareness, the fact that you''ve thought about improvement, and evidence you''ve acted on it. They''re not testing whether you''re weak — they''re testing whether you''re self-reflective.\n\n## The three-part formula\n1. Name a real weakness. 2. Describe how it''s shown up. 3. Share what you''re actively doing about it.\n\n## A real example\n"I tend to stay heads-down on execution longer than I should instead of pulling stakeholders in early. At my last company, I shipped a project that solved the wrong problem because I didn''t socialize the approach early enough. Now I send a design doc by week two on every project, even when I think I know the answer. It''s slowed me down 10%, but killed the rework."\n\n## Avoid the classics\n"I work too hard." "I''m a perfectionist." "I care too much." These signal you''re dodging the question.\n\n## Weakness that works with your role\nA PM admitting they sometimes over-rotate on data at the expense of speed. An engineer admitting they under-invest in writing. A designer admitting they can over-iterate. Role-adjacent weaknesses are credible and safe.',
 'interview', true, now() - interval '52 days'),

('back-channel-references',
 'Back-Channel References: What Recruiters Check (And What to Do)',
 'Your interview performance matters. So does what people say about you when you''re not there.',
 E'## What back-channel reference means\nBeyond the official references you provide, recruiters ask mutual connections informally: what''s it like to work with this person?\n\n## Who gets checked\nCandidates for senior, leadership, or high-stakes roles. Small ecosystems (startups, specific industries) — assume everyone is checking.\n\n## What they ask\nJudgment under pressure. Collaboration with peers. How they handled conflict. Whether they''d hire them again.\n\n## How to protect yourself\nLeave every job well. Even bad ones. Especially bad ones. The manager you didn''t burn is the manager who gives the 30-second back-channel endorsement.\n\n## Proactive strategy\nBefore a job search, check in with 8–10 former managers and peers. Not for references — just a warm "how are you?" The network that remembers you is the network that vouches for you.',
 'interview', true, now() - interval '65 days'),

('remote-interview-best-practices',
 'Remote Interview Best Practices',
 'The candidate who looks good on camera has a real edge. Here''s the setup.',
 E'## Camera at eye level\nWebcams below eye level make you look smaller. Stack books under your laptop until the camera is level with your eyes.\n\n## Lighting\nFace a window or a soft light source. Never backlight. A $30 ring light changes how you come across on camera more than any other single investment.\n\n## Audio matters more than video\nUse wired headphones with a mic, or a standalone USB mic. Laptop mics pick up echo and fan noise. Bad audio is more fatiguing than bad video.\n\n## Kill distractions\nQuiet room. Phone on do-not-disturb. Browser down to one tab. A visible clock off-screen so you don''t glance at the system clock.\n\n## Watch the gaze\nLooking at their face on your screen means looking away from the camera. Position the video window as close to the camera lens as possible, and practice looking at the lens during your answers.\n\n## Test 10 minutes early\nOpen the link, check A/V, have a glass of water, review your notes. Don''t start a remote interview already stressed from a tech issue.',
 'interview', true, now() - interval '75 days'),

('final-round-interviews',
 'Surviving the Final Round',
 'The onsite (or its virtual equivalent) is not a repeat of earlier rounds.',
 E'## The bar raises\nFinal rounds are evaluative at a different level — executive presence, strategic thinking, cultural alignment. Don''t just prepare more technical depth.\n\n## Research every interviewer\nLinkedIn each one. Identify common ground, their career path, and 1–2 specific questions you''d ask them. Hiring managers notice when you''ve done this.\n\n## The executive slot\nThe C-level or VP slot is a culture and judgment interview. They''re asking: can this person represent us to customers, the board, the press? Prep your story, your values, your judgment on real tradeoffs.\n\n## Pace yourself\nA 5-hour onsite requires stamina. Eat before. Bring water. Take the bathroom break between slots — even if you don''t need it, reset.\n\n## The reverse-interview question\nAt every slot, have a different, thoughtful question ready. "What would I work on in the first 30 days?" and "What''s the biggest risk to your team hitting its goals this year?" consistently land well.',
 'interview', true, now() - interval '88 days'),

('following-up-after-interview',
 'How to Follow Up After an Interview',
 'The follow-up is a tool, not just a thank-you.',
 E'## The 24-hour window\nSend within 24 hours. After that, the interview is fading from their memory. Same-day is ideal.\n\n## Per-interviewer, not a group email\nOne message to each person you spoke with. Reference a specific thing they said or asked — proves you were listening.\n\n## What to include\n1. Thank them specifically. 2. One or two sentences reinforcing why you''re excited. 3. Address anything you didn''t land in the interview. 4. Ask about next steps if you don''t already know.\n\n## The miss-reframe\nIf a question went poorly, the follow-up is your second chance. "I was thinking more about the scaling question — I''d also add X, which I didn''t mention in the moment." Mature interviewers appreciate this.\n\n## After no response\nWait 5 business days, then send a single polite nudge. After that, silence is the answer. Move on gracefully — the role could come back around in 2 years.',
 'interview', true, now() - interval '100 days'),

-- ============ HIRING (10) ============
('inclusive-job-descriptions',
 'Writing Inclusive Job Descriptions',
 'Small language choices shape who applies. Here''s what to change.',
 E'## Drop the unicorn list\nLong requirements lists disproportionately screen out women and underrepresented candidates who apply only when they meet 100% of criteria. 5–7 must-haves maximum.\n\n## Ditch "rockstar" and "ninja"\nThese words correlate with less-diverse applicant pools. Replace with concrete role descriptions.\n\n## Focus on outcomes, not pedigree\n"Experience shipping user-facing features" beats "3+ years at a top-tier tech company." Pedigree filters out strong candidates from non-traditional paths.\n\n## Salary transparency\nInclude a pay range. Candidates from underrepresented backgrounds are more likely to self-select out when ranges are hidden.\n\n## Benefits that matter for inclusion\nParental leave, caregiving support, mental health benefits, flexible work, visa sponsorship. Listing these surfaces the candidates who need them.',
 'hiring', true, now() - interval '5 days'),

('designing-screening-loops',
 'Designing a Screening Loop That Works',
 'Most interview loops measure interview ability, not job ability. Fix that.',
 E'## Start from the job\nList the 5 most important things the new hire will do in their first 6 months. Every loop stage should test one of those things. If a stage doesn''t map to a real job skill, cut it.\n\n## Limit to 4–5 stages\nRecruiter screen → hiring manager → 2–3 role-specific interviews → decision. Longer loops lose top candidates to faster competitors.\n\n## Structured, not free-form\nEvery interviewer uses the same questions and a shared rubric. Unstructured interviews have near-zero predictive validity for job performance.\n\n## Work sample > hypothetical\nHave them do something that looks like the job. A paid take-home. A live design exercise. A case study. It predicts performance far better than puzzle questions.\n\n## Calibrate your interviewers\nNew interviewers shadow 3 loops before running their own. Calibrate bar by reviewing past hires: who was a hit, who wasn''t, why.',
 'hiring', true, now() - interval '15 days'),

('structured-interviews',
 'Why Structured Interviews Beat Free-Form (Every Time)',
 'The research has been consistent for decades. Most companies ignore it.',
 E'## The data\nFree-form interviews have a predictive validity of ~0.2 (barely better than random) for job performance. Structured interviews hit 0.5+. It''s one of the largest effect sizes in HR research.\n\n## What "structured" means\nSame questions, same order, same rubric, same scoring scale. Every candidate gets the same experience.\n\n## Build a question bank\nFor each competency you''re testing, write 3–4 behavioral questions. Interviewers draw from the bank consistently. No free-wheeling.\n\n## Rubric before the interview\nDefine what a 1, 3, and 5 looks like for each question. Score immediately after the interview before discussion with other interviewers. Discuss after to minimize anchoring.\n\n## Why companies resist\nIt feels robotic. Interviewers miss the "vibe" assessment. But the vibe assessment is exactly where bias enters. Trust the process.',
 'hiring', true, now() - interval '25 days'),

('reducing-hiring-bias',
 'Concrete Steps to Reduce Bias in Hiring',
 'Awareness isn''t enough. Process changes are.',
 E'## Blind the resume screen\nRemove names, graduation dates, and schools for the initial screen. Focus on experience and impact.\n\n## Diverse interview panels\nEvery loop includes at least one interviewer who isn''t from the hiring manager''s demographic majority. Not for performative reasons — it materially changes decisions.\n\n## Score independently first\nInterviewers submit scores and written feedback before the debrief. This prevents the loudest voice from anchoring the room.\n\n## Track conversion rates\nBy source, by demographic (where allowed), by stage. Where candidates drop out reveals where bias lives.\n\n## Kill culture fit\nReplace with "culture add" or "values alignment." Culture fit historically means "feels like us," which compounds homogeneity.',
 'hiring', true, now() - interval '35 days'),

('candidate-experience',
 'Candidate Experience: Why It''s Worth Investing In',
 'Every rejected candidate is a potential future hire, customer, or reference.',
 E'## The one-in-three rule\nOne in three candidates tells others about their interview experience — publicly, in Slack, on Glassdoor. Bad experiences get broadcasted.\n\n## Fast decisions beat slow ones\nTime-to-decide under 2 weeks correlates with acceptance rate. Every extra week reduces close rate.\n\n## Communicate through silence\nThe worst candidate experience isn''t a rejection — it''s ghosting. Send a status update every 5 business days, even if there''s no news.\n\n## Rejections with humanity\nTemplated but personalized. Tell them why, if you can. Thank them for their time. Leave the door open for future roles. Candidates remember rejection quality more than any other signal.\n\n## Offer experience\nOffer letter within 48 hours of verbal acceptance. A welcome package. An intro call with the team before start date. The last mile matters.',
 'hiring', true, now() - interval '48 days'),

('offer-negotiation-employer-side',
 'Offer Negotiation From the Employer Side',
 'How to make competitive offers that land.',
 E'## Know your bands\nGo into every offer knowing the band, the midpoint, and how high you can flex. Negotiating without a ceiling leads to inconsistency and resentment on your team.\n\n## Lead with total comp\nPresent base + bonus + equity + benefits as one number. Candidates fixate on base when you don''t.\n\n## The first number\nStart 10–15% above where you expect to land. Leaving negotiation room shows good faith.\n\n## What to flex on\nSign-on bonus is cheaper than raising base. Extra vacation is cheaper than raising base. Title and level changes are harder to reverse than comp.\n\n## When they''re in another process\nAsk directly: "Do you have a competing offer?" Then decide whether to match, beat, or walk. Don''t guess.\n\n## The exploding offer\nDon''t. 72-hour deadlines signal insecurity. A candidate who takes your offer because they had to rush will leave within a year.',
 'hiring', true, now() - interval '60 days'),

('background-checks',
 'Background Check Best Practices',
 'The steps most companies get wrong, and the legal pitfalls to avoid.',
 E'## Scope to the role\nRun only what the job requires. Credit checks make sense for a CFO role, not for a designer. Over-checking risks FCRA violations and signals mistrust.\n\n## Get written consent\nFCRA requires clear, standalone disclosure and consent before the check. Buried in boilerplate is a legal risk.\n\n## Pre-adverse action notice\nIf a report shows something concerning, you must give the candidate a copy and a reasonable window to dispute before acting. This trips many fast-moving companies.\n\n## The ban-the-box laws\nDozens of states and cities now prohibit asking about criminal history until after a conditional offer. Check each state you''re hiring in.\n\n## Reasonable discretion\nCriminal history shouldn''t automatically disqualify. EEOC guidance requires an individualized assessment: nature of the offense, time passed, relevance to the role.',
 'hiring', true, now() - interval '70 days'),

('remote-hiring',
 'Remote Hiring: Patterns That Work',
 'Hiring across timezones isn''t the same as on-site hiring plus Zoom.',
 E'## Timezone is the first filter\nBe clear up front about overlap requirements. "Remote, but 4+ hours of overlap with US Pacific" saves weeks of misalignment.\n\n## Async work sample\nFor remote roles, include an async component in the loop. A written exercise the candidate completes on their own time. Tests async communication — the core skill for remote work.\n\n## Slower decisions, tighter process\nWithout hallway conversations, the written feedback in your ATS matters more. Invest in better notes.\n\n## Onboarding is 2x harder remote\nHiring is only the start. Budget 3x the onboarding time you''d use for on-site. Assign a buddy. Schedule intentional 1:1s across the team.\n\n## Pay geography\nDecide the policy early: pay by role (regardless of location) or adjust by location. Both are defensible. Switching mid-stream erodes trust.',
 'hiring', true, now() - interval '82 days'),

('culture-add-not-culture-fit',
 'Culture Add, Not Culture Fit',
 'One small word change reshapes the talent you attract.',
 E'## Culture fit is a trap\nIt rewards hiring people who look and think like the team already there. Over years, this calcifies culture and ceilings growth.\n\n## Culture add, defined\nDoes this person share our core values AND bring something we don''t have? Judgment, experience, perspective. A culture add hire strengthens the team, a culture fit hire just extends it.\n\n## Separating values from style\nCore values (e.g. "deliver excellent work, treat each other with respect") should be non-negotiable. Style (pace, communication preferences, energy) should be where you add diversity.\n\n## Interview differently\nAsk: "When have you disagreed with a team consensus? What did you do?" "What''s a lesson from your past that this team probably hasn''t internalized yet?" These surface add, not fit.\n\n## Measure the change\nTrack team composition over 12 months after adopting culture add. Expect more generative disagreement, slightly slower initial decisions, better outcomes.',
 'hiring', true, now() - interval '92 days'),

('firing-with-empathy',
 'Firing With Empathy',
 'Most managers are bad at this. It costs them — and the person they''re letting go.',
 E'## Give the warning\nPerformance-based terminations should almost never be a surprise. If the person is surprised, your feedback process failed. A written improvement plan with specific, measurable milestones protects everyone.\n\n## Decide, then move quickly\nOnce you''ve decided, drag creates anxiety and poisons the team. Aim for decision-to-conversation within a week.\n\n## The conversation itself\nKeep it under 15 minutes. State the decision in the first 30 seconds. Acknowledge the effort. Share the severance and logistics. Don''t negotiate the decision.\n\n## Generosity matters\nSeverance, extended healthcare, a strong LinkedIn recommendation where truthful, transition support. The market watches how you let people go.\n\n## Tell the team\nSame day. Brief but honest. Answer one round of questions, then close. Don''t over-explain — it erodes trust in your confidentiality.',
 'hiring', true, now() - interval '108 days'),

-- ============ INDUSTRY (10) ============
('tech-hiring-trends-2026',
 'Tech Hiring Trends: What''s Changing in 2026',
 'Six shifts shaping how engineering, product, and design roles are filled.',
 E'## 1. Skills-based hiring accelerates\nFewer job postings require degrees. More require specific demonstrated outcomes. Portfolios and work samples outweigh pedigree.\n\n## 2. Compressed interview loops\nTop candidates won''t sit through 8-stage loops anymore. Companies moving fastest are condensing to 3–4 high-signal stages.\n\n## 3. AI interview tooling\nAI is now summarizing interviews, scoring rubrics, and flagging inconsistencies. Candidates, meanwhile, are using AI to prep answers. The arms race is on.\n\n## 4. Remote hiring plateaus\nAfter the pandemic boom, fully remote roles have plateaued. Hybrid is winning. Companies mandating RTO are losing talent to competitors that didn''t.\n\n## 5. Salary transparency expands\nTen states now require posted ranges. Expect federal legislation before 2028.\n\n## 6. The senior/junior gap\nJunior hiring froze in 2024 and is slowly thawing. Senior candidates are in a seller''s market. Companies are solving with apprenticeships and internal mobility.',
 'industry', true, now() - interval '6 days'),

('fractional-executive-rise',
 'The Rise of the Fractional Executive',
 'Why more startups are hiring CMOs and CFOs for 10 hours a week.',
 E'## What changed\nFractional isn''t new, but it''s exploded since 2023. Seed-to-Series-A startups that couldn''t afford senior talent can now hire it 10–20 hours a week.\n\n## Which functions fit\nFractional works best for strategy-heavy, lower-velocity roles: CFO, CMO, CPO (for early-stage), head of ops. It works worst for hands-on building functions.\n\n## Pricing norms\n$5K–$15K/month for 10–20 hours per week. Top operators charge $20K+. Compared to a $300K full-time hire, this is $60K–$180K annualized — meaningful savings.\n\n## Pitfalls\nFractional leaders can''t own a team deeply. Attrition risk is higher (they have 3–5 clients). Onboarding takes longer as a percentage of their time.\n\n## When to transition to full-time\nMost fractional arrangements end when the company reaches Series A/B and can afford a full-time leader. The best fractional becomes an advisor or board member.',
 'industry', true, now() - interval '17 days'),

('return-to-office-debate',
 'Return to Office: What the Data Says in 2026',
 'Three years of data, debated in thousands of boardrooms. Here''s the synthesis.',
 E'## Productivity data is mixed\nBoth sides have studies backing them. The more rigorous ones suggest remote hurts less-experienced workers, helps experienced workers, and on average is a wash.\n\n## Innovation data leans on-site\nMultiple studies show in-person teams generate more spontaneous collaborations and patents. Remote teams outperform on execution of well-defined work.\n\n## Retention is clear\nMandating RTO for companies previously remote causes 10–25% attrition, disproportionately among senior women and caregivers. Companies that did it often regretted it.\n\n## The culture split\nTech and creative industries: remote/hybrid is becoming the default. Finance, consulting, biotech labs: largely on-site.\n\n## What actually matters\nThe best outcomes aren''t driven by location policy — they''re driven by intentionality. Teams that are deliberate about when to gather and when to work async outperform, regardless of format.',
 'industry', true, now() - interval '27 days'),

('skills-based-hiring',
 'Skills-Based Hiring: Reality vs Hype',
 'Every company says they''re doing it. Few actually are.',
 E'## What''s changed\nIBM, Google, Deloitte, and Bank of America have all reduced degree requirements. Job postings requiring degrees are down ~20% since 2020.\n\n## What hasn''t changed\nIn practice, most companies still filter on pedigree. Removing "BA required" from the posting doesn''t change what recruiters shortlist.\n\n## What actually works\nSkills assessments early in the funnel. Work samples as filter. Structured interviews that score on demonstrated competency, not background. Committed companies measure it quarterly.\n\n## For candidates\nSkills-based postings are a signal but not a guarantee. Apply, but also look at the team''s actual composition via LinkedIn — that tells you whether it''s real.\n\n## The long arc\nThis will keep accelerating. Degree requirements will be the exception by 2030 in most tech and creative roles. In regulated industries (medical, legal, aviation), they''ll persist.',
 'industry', true, now() - interval '38 days'),

('ai-in-recruiting',
 'AI in Recruiting: What''s Real, What''s Hype',
 'A practical look at what AI can actually do in the hiring pipeline.',
 E'## What AI is good at now\nResume parsing, candidate sourcing at scale, interview scheduling, note-taking and summarization, sending follow-up emails, generating first-draft job descriptions.\n\n## What AI is bad at now\nFinal-round assessments. Cultural evaluation. Anything requiring judgment on ambiguous work samples. Any context requiring nuance beyond the prompt.\n\n## The bias problem\nAI models inherit the biases of the data they were trained on. Amazon famously killed an AI hiring tool because it discriminated against women. Regular audits are now the norm for responsible deployments.\n\n## The candidate side\nCandidates use AI too. For resumes, cover letters, even interview prep. The market is an AI vs AI conversation that humans still arbitrate.\n\n## Regulatory horizon\nEU AI Act and NYC Local Law 144 both require disclosure and bias audits of automated employment decision tools. Expect US federal rules in the next 24 months.',
 'industry', true, now() - interval '50 days'),

('four-day-workweek',
 'The Four-Day Workweek: After the Experiments',
 'Three years of pilots. What actually happened.',
 E'## The big studies\n61 UK companies ran a 6-month pilot in 2022. 92% extended the four-day week. Productivity held, retention improved, burnout fell. Follow-ups in 2024 showed similar results across Spain, Portugal, and Iceland.\n\n## Who it works for\nKnowledge work with clear outputs. Software, design, writing, consulting. Roles where the workweek was already padded with low-value meetings.\n\n## Who it''s harder for\nCustomer support, operations, healthcare. Anything with 24/7 coverage requirements. Even here, pilots are finding creative rotation schedules.\n\n## The 32-hour reality\nMost successful implementations cut meetings aggressively. Standups move async. Deep work expands. People report the time savings come from less work, not faster work.\n\n## For candidates\nMore companies are advertising this. Ask in interviews: "Is this a real 4-day week or a compressed 5-day week?" They''re very different.',
 'industry', true, now() - interval '62 days'),

('salary-transparency-laws',
 'Salary Transparency Laws: State by State',
 'What''s legally required and what''s coming next.',
 E'## Currently required (posting ranges)\nColorado, California, New York, Washington, Maryland, Hawaii, Illinois, Minnesota, Connecticut, Nevada, Vermont. More expected each year.\n\n## Nuances to know\nSome require the range upfront, some on candidate request, some only for in-state roles, some for remote roles offered to in-state candidates.\n\n## What "good faith range" means\nA range based on what you''d actually pay, not a $50K–$500K pseudo-range. Regulators are starting to enforce.\n\n## Employer adjustments\nCompanies that previously hid ranges are discovering internal inequities when ranges go public. This is triggering large comp adjustments — some companies have budgeted $10M+.\n\n## For candidates\nYou now have data you didn''t before. Use it in negotiations. Also note: ranges favor candidates on the lower end of experience — you''ll see the ceiling, and can ask for it if you can justify.',
 'industry', true, now() - interval '74 days'),

('gig-economy-growth',
 'The Gig Economy''s Quiet Growth in Knowledge Work',
 'Contract, freelance, and project-based work is growing faster than full-time.',
 E'## Bigger than headlines suggest\nThe gig economy is no longer just rideshare. High-end knowledge work — consulting, design, engineering, product management on a project basis — is growing faster than full-time employment.\n\n## Why workers like it\nHigher hourly rates. Schedule control. Variety. Ability to work for multiple companies simultaneously.\n\n## Why workers dislike it\nNo health benefits. No unemployment insurance. No equity. Income volatility. Self-employed tax complexity.\n\n## Why employers like it\nFlexibility. No severance exposure. Access to talent that won''t come in-house. Scale up/down by project.\n\n## The regulatory battleground\nThe W-2/1099 line is being aggressively contested. California AB5 is the bellwether. Expect more enforcement — and more carve-outs — in the next 24 months.',
 'industry', true, now() - interval '86 days'),

('remote-first-companies',
 'Remote-First Companies: What They Do Differently',
 'It''s not about having a Slack account. It''s operating principles.',
 E'## Written everything\nDecisions, designs, and debates happen in docs and RFCs, not meetings. New hires can ramp by reading, without needing a meeting schedule.\n\n## Small meetings, written outcomes\nEvery meeting has a written doc before and a written summary after. Meetings are for decisions, not status.\n\n## Timezone overlap norms\nThe best remote-first companies keep 4+ hours of overlap between any two teammates. Beyond that, async is the expectation.\n\n## Offsite rhythm\nTwo to four in-person gatherings a year. These are when the trust and relationships get built that async communication relies on.\n\n## Manager investment\nRemote-first companies invest 2x as much in manager training. Without hallway feedback, the formal feedback process has to do all the work.',
 'industry', true, now() - interval '98 days'),

('early-career-pipeline',
 'The Early-Career Pipeline Crisis',
 'Junior hiring slowed in 2024–25. The downstream effects will hit for years.',
 E'## What happened\nFrom 2023 onward, companies cut junior hiring aggressively. New grads from 2024 faced the toughest market in a decade.\n\n## Why it matters in 3 years\nJuniors become mid-levels. Mid-levels become seniors. Skipping a cohort creates a gap that persists for years. Companies that cut hardest will have the thinnest mid-level bench in 2027.\n\n## The AI acceleration argument\nSome argue AI can replace junior work. The evidence is mixed — AI helps but doesn''t fully substitute. Companies that assumed it could are already hiring back.\n\n## Apprenticeships are rising\n6–12 month structured programs with paid training and a clear conversion path. Companies like Multiverse and Holberton are scaling. Expect this model to replace some college-to-corporate paths.\n\n## For candidates early in careers\nThe first role matters less than it did. Mobility is higher. Build a portfolio publicly, find a mentor, and plan for 2–3 different roles in your first 5 years.',
 'industry', true, now() - interval '110 days')

on conflict (slug) do nothing;
