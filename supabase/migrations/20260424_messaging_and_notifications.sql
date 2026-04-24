-- ============================================================
-- Messaging + Notifications MVP
-- ============================================================

-- 1. Conversations (1:1 employer ↔ candidate, context = company)
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  subject text,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE (employer_id, candidate_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_employer
  ON conversations(employer_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_candidate
  ON conversations(candidate_id, last_message_at DESC);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read conversations"
  ON conversations FOR SELECT TO authenticated
  USING (employer_id = auth.uid() OR candidate_id = auth.uid());

CREATE POLICY "Authenticated users start conversations"
  ON conversations FOR INSERT TO authenticated
  WITH CHECK (employer_id = auth.uid() OR candidate_id = auth.uid());

CREATE POLICY "Participants update conversation subject"
  ON conversations FOR UPDATE TO authenticated
  USING (employer_id = auth.uid() OR candidate_id = auth.uid())
  WITH CHECK (employer_id = auth.uid() OR candidate_id = auth.uid());

-- 2. Messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) > 0),
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON messages(conversation_id, created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read messages"
  ON messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
      AND (c.employer_id = auth.uid() OR c.candidate_id = auth.uid())
  ));

CREATE POLICY "Participants send messages"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.employer_id = auth.uid() OR c.candidate_id = auth.uid())
    )
  );

CREATE POLICY "Participants mark read"
  ON messages FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
      AND (c.employer_id = auth.uid() OR c.candidate_id = auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
      AND (c.employer_id = auth.uid() OR c.candidate_id = auth.uid())
  ));

-- 3. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  url text,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications(user_id, read_at NULLS FIRST, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users mark own notifications read"
  ON notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own notifications"
  ON notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Inserts come from triggers (SECURITY DEFINER) only.

-- 4. Trigger: new message → notification + bump conversation.last_message_at
CREATE OR REPLACE FUNCTION fn_on_new_message()
RETURNS trigger AS $$
DECLARE
  _conv record;
  _recipient uuid;
  _sender_name text;
BEGIN
  SELECT * INTO _conv FROM conversations WHERE id = NEW.conversation_id;
  _recipient := CASE WHEN _conv.employer_id = NEW.sender_id THEN _conv.candidate_id ELSE _conv.employer_id END;
  SELECT name INTO _sender_name FROM user_profiles WHERE id = NEW.sender_id;

  UPDATE conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;

  INSERT INTO notifications (user_id, kind, title, body, url)
  VALUES (
    _recipient,
    'new_message',
    'New message from ' || COALESCE(_sender_name, 'someone'),
    LEFT(NEW.body, 140),
    '/messages?c=' || _conv.id::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_on_new_message ON messages;
CREATE TRIGGER trg_on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION fn_on_new_message();

-- 5. Trigger: review status change → notify author
CREATE OR REPLACE FUNCTION fn_on_review_status_change()
RETURNS trigger AS $$
DECLARE
  _company record;
  _url text;
  _title text;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  SELECT slug, name INTO _company FROM companies WHERE id = NEW.company_id;
  _url := '/companies/' || _company.slug;

  IF NEW.status = 'approved' THEN
    _title := 'Your review of ' || _company.name || ' is live';
  ELSIF NEW.status = 'rejected' THEN
    _title := 'Your review of ' || _company.name || ' was not approved';
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO notifications (user_id, kind, title, body, url)
  VALUES (NEW.author_id, 'review_status', _title, NEW.title, _url);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_on_review_status_change ON company_reviews;
CREATE TRIGGER trg_on_review_status_change
  AFTER UPDATE ON company_reviews
  FOR EACH ROW EXECUTE FUNCTION fn_on_review_status_change();

-- 6. Trigger: appeal decision → notify author
CREATE OR REPLACE FUNCTION fn_on_appeal_decision()
RETURNS trigger AS $$
DECLARE
  _company record;
  _title text;
BEGIN
  IF NEW.appeal_status IS NOT DISTINCT FROM OLD.appeal_status THEN
    RETURN NEW;
  END IF;
  IF NEW.appeal_status NOT IN ('approved', 'rejected') THEN
    RETURN NEW;
  END IF;

  SELECT slug, name INTO _company FROM companies WHERE id = NEW.company_id;
  _title := CASE
    WHEN NEW.appeal_status = 'approved' THEN 'Your appeal was granted'
    ELSE 'Your appeal was denied'
  END;

  INSERT INTO notifications (user_id, kind, title, body, url)
  VALUES (
    NEW.author_id,
    'appeal_decision',
    _title,
    'Review of ' || _company.name || ': "' || NEW.title || '"',
    '/my-reviews'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_on_appeal_decision ON company_reviews;
CREATE TRIGGER trg_on_appeal_decision
  AFTER UPDATE ON company_reviews
  FOR EACH ROW EXECUTE FUNCTION fn_on_appeal_decision();
