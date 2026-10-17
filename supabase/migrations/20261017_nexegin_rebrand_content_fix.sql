-- Rebrand follow-up: historical migrations stay immutable (20260416000001,
-- 20260425_blog_seed_50_leadership, 20260425_blog_seed_50_more,
-- 20260425_help_center), but the brand name and support-email domain they
-- seeded are now live, user-visible content ("HireQuadrant" in blog post
-- bodies, "@hirequadrant.com" in help-center answers, and the blog_posts
-- author_name default) that needs correcting as data, not as a rewrite of
-- the old migration files.

-- Blog post bodies mentioning "HireQuadrant" by name (job-boards-that-still-work,
-- visa-sponsorship-job-search from the two 50-post seed migrations).
UPDATE blog_posts
SET body = REPLACE(body, 'HireQuadrant', 'Nexegin')
WHERE body LIKE '%HireQuadrant%';

-- Help-center answers referencing the old support/billing/notification email domain.
UPDATE help_articles
SET answer = REPLACE(answer, '@hirequadrant.com', '@nexegin.com')
WHERE answer LIKE '%@hirequadrant.com%';

-- Existing rows that took the old column default, plus the default itself
-- for every post created from here on.
UPDATE blog_posts
SET author_name = 'Nexegin Team'
WHERE author_name = 'HireQuadrant Team';

ALTER TABLE blog_posts ALTER COLUMN author_name SET DEFAULT 'Nexegin Team';
