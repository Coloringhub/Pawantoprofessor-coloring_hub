# Pawn to Professor · Coloring Studio V1

A standalone Vercel website with a complete welcome page, searchable library, six unmodified Japan worksheets, interactive coloring, English-only vocabulary and download-only saving. Includes a protected administrator workflow with Supabase-backed image uploads, countries, topics and publishing.

## Deploy to Vercel (manual GitHub upload)
1. Open your GitHub repository `Coloringhub/Pawantoprofessor-coloring_hub` (or the repository you connected to your `pawn-to-professor-coloring` Vercel project).
2. Upload **all** the contents of this folder to the repository root, keeping folder names `api` and `assets`. (A ZIP must be extracted before GitHub's Upload files.) Replace the old sample-only `index.html`.
3. In Vercel, the **Framework Preset** should be **Other**. Set the **Root Directory** to `./`. There is no `npm install`, build command or Node package dependency.
4. Under Vercel Settings → Environment Variables, set:
   - `NEXT_PUBLIC_SUPABASE_URL` = Supabase Project URL (Config)
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = Supabase publishable key (Config)
   - `SUPABASE_SECRET_KEY` = Supabase secret key (Secret, *server only*)
   Environments: Production + Preview as needed. Never commit these values.
5. In Supabase SQL Editor, run the Coloring Studio SQL setup you already created (eleven `studio_...` tables). Ensure the two **private** buckets exist: `coloring-masters` and `coloring-published`.
6. In Supabase Dashboard → Authentication → Users, add an administrator via **Add user**. Note the user ID, and run this query in SQL Editor (replace the placeholder with the REAL user UUID):

```sql
INSERT INTO public.studio_admins(user_id,role)
VALUES ('REPLACE_WITH_REAL_SUPABASE_AUTH_USER_UUID'::uuid,'owner')
ON CONFLICT(user_id) DO UPDATE SET role='owner';
```

7. Visit Vercel preview URL. Welcome → Explore → Japan Food works without admin login. Visit **Admin** to login with the Supabase Auth administrator, not your GitHub/Vercel password.
8. In Admin, proceed 1 Upload → 2 Improve detection → 3 Select coloring area → 4 Prepare mask/corrections → 5 Test & Publish.

## Important boundaries
- **Artwork**: the six supplied Japan PNGs are copied byte-for-byte without changing the original text or layout. Their native pixels are 736×1104. For print-quality A4, upload a newly created 2480×3508 or vector-derived high-resolution master. Upscaling alone does not create missing detail.
- **English-only vocabulary**: the *website vocabulary interface* uses English words, pronunciation guides, English example sentences and English-language text-to-speech. Original user-supplied printed worksheets are unchanged, even if they contain Japanese text.
- **No student cloud saving**: download PNG, print/save PDF, or download an editable `.ptpcolor` draft. Students can reopen their saved draft later by selecting the matching worksheet and loading their `.ptpcolor` file.
- **Protected original**: the uploaded image is never overwritten. Coloring layers are overlaid, and downloaded PNGs merge the results.
- **Dark sushi ink**: choose **Tint dark ink** to paint colored tint over black nori/seaweed without erasing the original dark texture. The Japan food demo also has a predefined clickable dark nori region. Admin can outline additional dark shapes.
- **Five-step admin**: Steps 2–4 provide non-destructive outline detection, rectangular selection, manual barrier closing and dark-area polygons. The prototype does not magically reconstruct low-resolution detail or clean every image automatically. Admin tests still require visual verification of the final live sheet.
- **Publishing/access**: new published worksheets are viewable by visitors of this standalone Coloring Studio. **The existing Pawn to Professor subscription/member authentication is not integrated yet**; add server-side membership verification before connecting this project as a members-only resource.
- **Signed URLs**: private uploaded images receive short-lived signed read URLs from the server. A viewer who can open the library can temporarily access the published images. Unpublished originals remain private.
- **First-run account**: `studio_admins` must contain the real Supabase Auth user UUID; a Gmail account alone is not sufficient.
- **Supabase secret**: never put `SUPABASE_SECRET_KEY` in client-side code; it is used only by `/api` server functions after administrator authorization.

## Folder layout
```
index.html              Landing page, library, editor, vocabulary, finish, admin UI
app.js                  Coloring engine, admin workflow and client interactions
styles.css              Responsive classroom design
assets/                 Six unchanged Japan PNGs
api/config.js           Exposes only safe public Supabase configuration
api/catalog.js          Lists published SQL worksheets and signs asset read URLs
api/admin.js            Authenticated write actions + signed image uploads
server/supabase.js          Server-side authentication/security helpers
vercel.json             Vercel framework preset: Other
```
