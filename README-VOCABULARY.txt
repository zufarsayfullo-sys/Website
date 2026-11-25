1. Run setup-vocabulary.sql in your Supabase SQL Editor. It creates three private, RLS-protected tables.
2. Copy assets and vocabulary into Website, merging folders. Only home.js is replaced; auth files are untouched.
3. Commit and push. Open /vocabulary/ and test sign-in, adding a word, reviewing, and persistence after refresh.
This release uses a simple adaptive interval scheduler, not FSRS. Automatic dictionary/translation and integration into articles are future work. Browser speech depends on device support. The SQL has not been executed on your project and live browser/auth testing is required. The homepage script is based on the previously supplied Reading Menu ZIP.
