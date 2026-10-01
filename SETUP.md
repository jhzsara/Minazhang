# MinaZhang setup

## Built in GitHub
The repo now contains the polished public site, responsive mobile layout, login/join interface, legal pages, contact page, domain CNAME and a Supabase/Postgres schema with row-level security for private one-to-one conversations.

## To make the private app actually work
A static GitHub Pages site can show the UI, but real authentication, subscriptions and private realtime chat require backend services.

### Supabase
Create a Supabase project and run `supabase-schema.sql` in SQL Editor. Supabase Auth supports email/password accounts; Supabase Realtime can provide private realtime channels. Keep RLS enabled for every private table.

The browser may use the project's publishable key. Never put a service-role key in browser code or GitHub.

### Payments
Create the €4.99/month subscription with your payment provider (for example Stripe Checkout). The payment provider should collect card details and your app should only keep provider IDs/statuses needed to manage access. Add a server-side checkout endpoint and webhook before taking real payments.

### Age verification
Use a dedicated provider for the 18+ / identity check. Keep the verification result/reference your app needs rather than building a database of passport scans.

### Chat
After Supabase is connected, the app needs:
1. authenticated subscriber/admin sessions
2. a conversation per subscriber
3. realtime messages with strict authorization
4. private media storage with access policies
5. report/block/delete controls

### Admin
Create the admin account through Supabase Auth and mark only that profile as `admin` in the database. Never commit an admin password to GitHub. A password previously pasted into chat should be changed before launch.

### Domain
The `CNAME` file already contains `minazhang.online`. Enable GitHub Pages in repository settings and configure the DNS records at the domain provider.

## Important
The current repository is a complete site foundation, not a claim that live payments, verification or chat are connected. Those external accounts and secrets must be configured securely before launch.
