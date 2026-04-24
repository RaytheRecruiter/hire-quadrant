-- ============================================================
-- Rewrite Lorem-Ipsum seed data to US English.
-- Only touches rows authored by seeded reviewer accounts
-- (seed-reviewer-N@hirequadrant-seed.test) and companies with an
-- @example.com email_domain — real data is never modified.
-- ============================================================

-- English title / pros / cons / description pools
CREATE TEMP TABLE _en_titles (idx int PRIMARY KEY, t text) ON COMMIT DROP;
INSERT INTO _en_titles VALUES
  (0,  'Great place to grow early in your career'),
  (1,  'Solid compensation, rigid management'),
  (2,  'Steady work, decent benefits, slow pace'),
  (3,  'Real impact, real long hours'),
  (4,  'Good team, bureaucratic process'),
  (5,  'Healthy culture but flat career path'),
  (6,  'Strong mentorship from senior engineers'),
  (7,  'Fun product, disorganized execution'),
  (8,  'Excellent leadership, thin staffing'),
  (9,  'Fair pay, great work-life balance'),
  (10, 'Mission-driven team but tight budgets'),
  (11, 'Interesting problems, limited upward mobility'),
  (12, 'Friendly coworkers, inconsistent management'),
  (13, 'Fast-paced, supportive, worth the ride'),
  (14, 'Respectful environment, outdated tooling'),
  (15, 'Remote-friendly with real ownership'),
  (16, 'High expectations, high rewards'),
  (17, 'Decent starting role, limited long-term growth'),
  (18, 'Steep learning curve, real investment in people'),
  (19, 'Fair review cycles, good benefits package');

CREATE TEMP TABLE _en_pros (idx int PRIMARY KEY, t text) ON COMMIT DROP;
INSERT INTO _en_pros VALUES
  (0,  'Competitive pay and strong benefits. Health, dental, and 401(k) match are all above market.'),
  (1,  'Flexible hours and legitimate remote work. Core hours are respected and the culture trusts you to manage your own time.'),
  (2,  'Smart, supportive coworkers. Most problems get solved by a quick Slack ping and the team genuinely celebrates wins.'),
  (3,  'Real learning and growth opportunities, including a generous education stipend and paid conferences.'),
  (4,  'Great leadership that communicates clearly. Leadership shares strategy openly in all-hands and actually answers tough questions.'),
  (5,  'Meaningful work that helps real customers. You can see the impact of what you ship in user feedback.'),
  (6,  'Modern tech stack and the budget to upgrade tooling as needed.'),
  (7,  'Reasonable workload, PTO is respected, and on-call is handled fairly.'),
  (8,  'Inclusive culture with active ERGs and visible investment in DEI.'),
  (9,  'Strong onboarding — buddy system, shadowing, and clear 30/60/90 goals.'),
  (10, 'Healthy feedback culture. Performance reviews are specific and actionable, not a surprise.'),
  (11, 'Generous parental leave and family support.'),
  (12, 'Transparent compensation bands — levels and salaries are documented internally.'),
  (13, 'Good balance of autonomy and support. You drive your own work but never feel abandoned.'),
  (14, 'Reasonable meeting load — async-first where it makes sense.');

CREATE TEMP TABLE _en_cons (idx int PRIMARY KEY, t text) ON COMMIT DROP;
INSERT INTO _en_cons VALUES
  (0,  'Salary bands compress after a few years — raises do not keep up with promotions.'),
  (1,  'Legacy systems still running in production; migrations get deprioritized each quarter.'),
  (2,  'Promotion criteria can feel opaque and vary by manager.'),
  (3,  'Some teams are understaffed; on-call rotation feels heavy.'),
  (4,  'Reorgs happen frequently and can disrupt momentum mid-project.'),
  (5,  'Cross-team communication is slower than it should be at this size.'),
  (6,  'Benefits are good but office perks have been trimmed post-pandemic.'),
  (7,  'Performance reviews are thorough but time-consuming.'),
  (8,  'Tight deadlines occasionally lead to late nights near launches.'),
  (9,  'Remote employees sometimes feel out of the loop on decisions made in the office.'),
  (10, 'Documentation is inconsistent — tribal knowledge still dominates.'),
  (11, 'Hiring bar is high which slows team growth.'),
  (12, 'Some tooling investments trail industry peers.'),
  (13, 'Office locations are limited for hybrid employees.'),
  (14, 'Career ladders for specialists are less developed than for generalists.');

CREATE TEMP TABLE _en_descriptions (idx int PRIMARY KEY, t text) ON COMMIT DROP;
INSERT INTO _en_descriptions VALUES
  (0, 'A growing team focused on delivering practical software that solves real problems for customers. We believe in craft, transparency, and sustainable pace.'),
  (1, 'We build tools that help businesses operate more efficiently. Our culture prioritizes clear communication, deep work, and respect for each other''s time.'),
  (2, 'A product-led organization that invests in engineering excellence and healthy team dynamics. We ship regularly and iterate based on customer feedback.'),
  (3, 'Mission-driven company dedicated to improving outcomes through technology. We partner closely with customers and treat feedback as a gift.'),
  (4, 'We combine domain expertise with modern engineering to deliver reliable products. Our team is distributed, inclusive, and proud of what we ship.'),
  (5, 'An established player in our space, known for rigorous quality standards and long-term customer relationships. We invest in our people and our infrastructure.');

-- 1. Rewrite seeded review titles / pros / cons, round-robin style.
WITH seeded_reviewers AS (
  SELECT id FROM auth.users WHERE email LIKE 'seed-reviewer-%@hirequadrant-seed.test'
),
numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM company_reviews
  WHERE author_id IN (SELECT id FROM seeded_reviewers)
)
UPDATE company_reviews cr
SET
  title = (SELECT t FROM _en_titles WHERE idx = (n.rn - 1) % 20),
  pros  = (SELECT t FROM _en_pros   WHERE idx = (n.rn - 1) % 15),
  cons  = (SELECT t FROM _en_cons   WHERE idx = (n.rn + 3) % 15)
FROM numbered n
WHERE cr.id = n.id;

-- 2. Rewrite seeded company descriptions (only those from the seed,
--    identified by the .example.com email_domain marker).
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM companies
  WHERE email_domain LIKE '%.example.com'
)
UPDATE companies c
SET description = (SELECT t FROM _en_descriptions WHERE idx = (n.rn - 1) % 6)
FROM numbered n
WHERE c.id = n.id;
