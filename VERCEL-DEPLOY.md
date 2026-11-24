# FORME — Vercel deployment (API-free demo)

This project has been changed to a standalone Next.js storefront. The website no longer initializes Figma Make, Payload CMS, a database, or external API credentials during build.

## Deploy
1. Push this folder to GitHub.
2. Import the repository into Vercel.
3. Framework preset: Next.js.
4. Build command: `pnpm build` (or `next build`).
5. Install command: `pnpm install`.
6. No environment variables are required for the demo storefront.

## Demo-mode limitations
Product data is local and sample-based. Cart, wishlist, demo account, newsletter signups, and sample orders are stored in the visitor's browser only. They are not shared between devices or customers. Passwords are stored in browser local storage for demonstration only; do not use this for real customer accounts. No real payments, email delivery, inventory, or shipping integration is included.
