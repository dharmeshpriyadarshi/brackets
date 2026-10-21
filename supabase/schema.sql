
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
