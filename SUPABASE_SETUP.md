# Cloud saves (Supabase)

The game and dashboard talk to Supabase with the project URL and **publishable** key in `cloud-sync.js`
(`RAW_SUPABASE_URL`, `RAW_SUPABASE_ANON_KEY`). Both are already filled in. The key is public by design:
what keeps saves safe is the database setup below, not the key.

## Lock down saves (do this once)

1. Open `supabase-secure.sql` and change `'CHANGE-ME'` at the top (STEP 1) to a **school setup code**
   only staff know. The script refuses to run until you do.
2. In Supabase, open **SQL editor**, paste the whole file, and click **Run**. It's safe to run again later
   (for example to change the setup code). Existing saves, student PINs and teacher PINs keep working.

Until the script has been run, the game falls back to the old open tables, so nothing breaks in between.

## What is protected after that

* **No direct table access.** The public key can't read, change or delete rows in `acm_saves` or
  `acm_classes`. Everything goes through a few database functions that check PINs **on the server**.
* **PINs stay secret.** Student and teacher PINs are stored as salted hashes and are never sent back to a browser.
* **Guessing is throttled.** 10 wrong PINs locks that workshop (or that class's dashboard) for 10 minutes.
  A student who mistypes a few times is fine. Someone trying all 10,000 PINs is not. Because classmates
  share one school network, a student *could* lock a classmate out for 10 minutes by typing wrong PINs on
  purpose. That shows up as "Too many wrong PINs", and it clears by itself.
* **Classes can't be hijacked.** A new class code can only be created on the dashboard with your school
  setup code, so a student can't claim `PRODTECH11A` before you do. Existing classes don't need it.
* **No overwriting someone else's save.** Saving needs the workshop's PIN, and a browser that hasn't loaded
  the workshop can't replace an existing save with a blank game.
* The leaderboard shows only workshop name, rating, cash and title for one class code.

What it does **not** do: a student can still edit their *own* save in their browser's developer tools
(cash, stars, and so on), because the game runs on their computer. The dashboard's flags and the
event log are your best signal there.

## "Keep me signed in"

The start screen remembers recent workshops on each browser, so students tap their name instead of
retyping the class code and name. Ticking **Keep me signed in** also stores a hash of the PIN (never the PIN)
so that one tap starts the game. Students should only tick it on their own device. **Sign out** in the
pause menu (Esc) saves the game and removes the stored sign-in from that computer, and the ✕ next to a name
removes it from the list.

## Using the dashboard

Open `teacher.html`, enter the class code and a teacher PIN (4+ characters, longer is better). The first
time you open a new class code you'll also be asked for the school setup code, and the PIN you typed
becomes that class's teacher PIN. Without the cloud configured, the dashboard reads saves from the same
browser only (useful for testing on the lab machine).
