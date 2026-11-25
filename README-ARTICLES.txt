1. Run setup-articles.sql in the existing Supabase SQL Editor after vocabulary setup.
2. Copy the reading folder into the repository, merging folders. Only reading/articles is replaced.
3. Commit and push. Open /reading/articles/ and sign in.
4. Test saving a curated word (e.g. threshold), then open /vocabulary/ and verify it appears. Test article completion after 180 seconds and 90% scroll with 2 correct answers.
Notes: five short original educational adaptations, not full magazine reprints. Original vector covers instead of copyrighted photos. Curated Uzbek translations for selected words; other English single words use Free Dictionary API, with manual translation/definition fallback. Reading time and depth are client-reported, not tamper-proof. No service role keys. Live deployment and SQL execution not tested. Existing auth files unchanged. Browser speech synthesis availability varies.
