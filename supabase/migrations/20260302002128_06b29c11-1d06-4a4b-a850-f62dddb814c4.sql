
-- Allow users to see invitations sent to their email
CREATE POLICY "Users can see their own invitations"
ON public.team_members FOR SELECT
USING (
  invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);
