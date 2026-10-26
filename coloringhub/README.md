# Pawn to Professor — Coloring Studio V1

This is the FULL GitHub repository content. **All contents of this package must be at the GitHub repository root**. Do not upload the ZIP file itself, and do not create an extra `Coloring Hub` folder.

## Correct repository layout
```
YOUR GITHUB REPOSITORY (root)
├── vercel.json
├── README.md
├── api/
│   ├── admin.js
│   ├── catalog.js
│   └── config.js
├── server/
│   └── supabase.js
├── docs/
│   ├── Supabase_SQL_Setup.sql
│   └── original_images_integrity.json
└── public/
    ├── index.html
    ├── app.js
    ├── styles.css
    └── assets/
        ├── japan-food.png
        ├── japan-festival.png
        ├── japan-furin.png
        ├── japan-kendama.png
        ├── japan-kintsugi.png
        └── japan-pottery.png
```

## Manual GitHub upload
1. **Unzip first.** Open the unzipped folder; upload **its contents** (`vercel.json`, `README.md`, `api`, `server`, `docs`, and `public`) to the TOP LEVEL of the GitHub repository. Do not upload the enclosing folder or the ZIP.
2. In GitHub, delete the old `Coloring Hub/` directory and any obsolete root files from the previous upload once the replacement is safely committed. Avoid keeping two deployed copies of `index.html`.
3. Commit on `main` to trigger a new Vercel deployment.

## Vercel Settings
- Framework Preset: **Other**.
- Root Directory: **blank** (repository root; do NOT type `public` here).
- Build Command: leave blank; this is a static site with Node.js serverless `api/` handlers.
- Output Directory: automatically `public`, also explicitly declared in `vercel.json`.
- Project Git repository: verify it is the repository where you uploaded these root files.
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL` (Config), `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Config), `SUPABASE_SECRET_KEY` (Secret). Paste values without the `KEY=` prefix. Keep the secret key server-side.
- Push a new commit after changing Root Directory. A `Ready` deployment alone does not prove the homepage exists; open the production URL and test `/api/config`.

## Supabase
- If you ALREADY ran the Coloring Studio SQL setup successfully, **do not create another database**. `docs/Supabase_SQL_Setup.sql` is included as a reference and can be rerun; it is written to be repeatable.
- Storage buckets: `coloring-masters` and `coloring-published`, both private.
- In Supabase Authentication, create an admin user. Copy the user's UUID from the Auth dashboard (NEVER the password) and register it as the first admin with SQL Editor:

```sql
INSERT INTO public.studio_admins (user_id, role)
VALUES ('REPLACE_WITH_AUTH_USER_UUID'::uuid, 'owner')
ON CONFLICT (user_id) DO UPDATE SET role = 'owner';
```
- **Do not run this example before replacing the UUID**. The admin screen uses Supabase Auth email/password and checks `studio_admins` server-side.

## Current capabilities and limitations
- Full welcome, Explore, coloring, English-only vocabulary, Finish/download, and Admin preparation screens are included.
- Six original Japan pictures are included byte-for-byte unchanged; see `docs/original_images_integrity.json`.
- Student coloring is held in their browser session, with PNG/PDF/portable draft download; there is no online student artwork storage.
- Admin picture preparation supports region selection, thresholds, ink barriers, dark-region polygons, testing and publishing, but **does not guarantee perfect automatic fill for every complex image**, nor does it automatically upscale blurred artwork to professional high-resolution output.
- New admin worksheets and categories use Supabase. The original six demo worksheets work locally without Supabase.
- The public library currently uses the `/api/catalog` server endpoint and is not yet connected to your existing Pawn to Professor membership gateway; do not claim subscription protection until that integration is completed.
- V1 should be tested with the actual project in Vercel and Supabase before being treated as production-ready.

## Troubleshooting
- 404 after `Ready`: verify the Git repository is correct, Root Directory is blank, the deployment SOURCE includes `public/index.html`, and `vercel.json` says `outputDirectory: public`.
- `503` at `/api/config`: verify the two NEXT_PUBLIC_ variables were saved, and create a fresh deployment.
- Admin login rejected: verify your Supabase Auth user exists and its UUID is registered in `studio_admins`.
- Supabase asset upload fails: check the private bucket exists; browser-side signed upload may also require Supabase CORS/support checks.
