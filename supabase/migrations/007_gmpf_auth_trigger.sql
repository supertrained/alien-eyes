-- Auto-create organization and user record when someone signs up via Supabase Auth.
-- New user gets role: 'owner' of their auto-created org.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  new_org_id uuid;
  user_name text;
BEGIN
  user_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- Create an organization for the new user
  INSERT INTO public.organizations (name, slug, plan)
  VALUES (
    user_name || '''s Team',
    REPLACE(LOWER(user_name), ' ', '-') || '-' || SUBSTRING(NEW.id::text, 1, 8),
    'trial'
  )
  RETURNING id INTO new_org_id;

  -- Create the user record linked to the new org
  INSERT INTO public.users (id, org_id, full_name, role)
  VALUES (
    NEW.id,
    new_org_id,
    user_name,
    'owner'
  );

  RETURN NEW;
END;
$$;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
