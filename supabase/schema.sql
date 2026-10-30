
-- 1. Parent table: Brackets
CREATE TABLE public.brackets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_chat boolean NOT NULL DEFAULT false,
  is_public boolean NOT NULL DEFAULT false
);

-- 2. Child table: individual spaces within a bracket
CREATE TABLE public.bracket_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  bracket_id uuid NOT NULL
    REFERENCES public.brackets(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_type text NOT NULL
    CHECK (media_type IN ('text', 'image', 'audio', 'video', 'link')),
  content text,
  sequence_order integer NOT NULL CHECK (sequence_order >= 0),
  UNIQUE (bracket_id, sequence_order)
);

-- 3. Indexes for public discovery and efficient child lookups
CREATE INDEX brackets_public_feed_idx
  ON public.brackets (created_at DESC)
  WHERE is_public = true;

CREATE INDEX brackets_creator_idx
  ON public.brackets (creator_id);

CREATE INDEX bracket_spaces_bracket_order_idx
  ON public.bracket_spaces (bracket_id, sequence_order);

-- 4. Enable Row-Level Security
ALTER TABLE public.brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bracket_spaces ENABLE ROW LEVEL SECURITY;

-- 5. Bracket policies
CREATE POLICY "Read own or public brackets"
ON public.brackets
FOR SELECT
TO anon, authenticated
USING (is_public = true OR creator_id = (SELECT auth.uid()));

CREATE POLICY "Create own brackets"
ON public.brackets
FOR INSERT
TO authenticated
WITH CHECK (creator_id = (SELECT auth.uid()));

CREATE POLICY "Update own brackets"
ON public.brackets
FOR UPDATE
TO authenticated
USING (creator_id = (SELECT auth.uid()))
WITH CHECK (creator_id = (SELECT auth.uid()));

CREATE POLICY "Delete own brackets"
ON public.brackets
FOR DELETE
TO authenticated
USING (creator_id = (SELECT auth.uid()));

-- 6. Space policies: visibility follows the parent bracket
CREATE POLICY "Read spaces in visible brackets"
ON public.bracket_spaces
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.brackets b
    WHERE b.id = bracket_spaces.bracket_id
      AND (b.is_public = true OR b.creator_id = (SELECT auth.uid()))
  )
);

CREATE POLICY "Add spaces to own brackets"
ON public.bracket_spaces
FOR INSERT
TO authenticated
WITH CHECK (
  creator_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.brackets b
    WHERE b.id = bracket_spaces.bracket_id
      AND b.creator_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Update spaces in own brackets"
ON public.bracket_spaces
FOR UPDATE
TO authenticated
USING (
  creator_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.brackets b
    WHERE b.id = bracket_spaces.bracket_id
      AND b.creator_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  creator_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.brackets b
    WHERE b.id = bracket_spaces.bracket_id
      AND b.creator_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Delete spaces in own brackets"
ON public.bracket_spaces
FOR DELETE
TO authenticated
USING (
  creator_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.brackets b
    WHERE b.id = bracket_spaces.bracket_id
      AND b.creator_id = (SELECT auth.uid())
  )
);


-- =========================================================
-- TASK 11: FOLLOW GRAPH ARCHITECTURE
-- =========================================================

-- 1. User-to-user follow relationships.
CREATE TABLE public.user_followers (
  follower_id uuid NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL
    DEFAULT timezone('utc'::text, now()),

  PRIMARY KEY (follower_id, following_id),

  -- Prevent users from following themselves.
  CONSTRAINT user_followers_no_self_follow
    CHECK (follower_id <> following_id)
);

-- 2. User-to-bracket follow relationships.
CREATE TABLE public.bracket_followers (
  user_id uuid NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,
  bracket_id uuid NOT NULL
    REFERENCES public.brackets(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL
    DEFAULT timezone('utc'::text, now()),

  PRIMARY KEY (user_id, bracket_id)
);

-- 3. Enable Row-Level Security.
ALTER TABLE public.user_followers
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.bracket_followers
ENABLE ROW LEVEL SECURITY;

-- 4. User follow policies.
CREATE POLICY "Follows are viewable by everyone."
ON public.user_followers
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Users can manage their own follows."
ON public.user_followers
FOR ALL
TO authenticated
USING (auth.uid() = follower_id)
WITH CHECK (auth.uid() = follower_id);

-- 5. Bracket follow policies.
CREATE POLICY "Bracket follows are viewable by everyone."
ON public.bracket_followers
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Users can manage their own bracket follows."
ON public.bracket_followers
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Grant database privileges to application roles.
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON TABLE public.user_followers
TO anon, authenticated;

GRANT SELECT ON TABLE public.bracket_followers
TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE
ON TABLE public.user_followers
TO authenticated;

GRANT INSERT, UPDATE, DELETE
ON TABLE public.bracket_followers
TO authenticated;
