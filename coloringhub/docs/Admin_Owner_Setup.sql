-- Run only after creating YOUR OWN user under Supabase -> Authentication -> Users.
-- Replace YOUR_ADMIN_EMAIL@example.com with your actual Supabase Auth user's email.
-- If there is no matching user, the statement inserts nothing.
INSERT INTO public.studio_admins (user_id, role)
SELECT id, 'owner'
FROM auth.users
WHERE lower(email) = lower('YOUR_ADMIN_EMAIL@example.com')
ON CONFLICT (user_id) DO UPDATE SET role = 'owner';

-- Check that the owner was registered:
SELECT u.email, a.role
FROM public.studio_admins AS a JOIN auth.users AS u ON u.id = a.user_id;
