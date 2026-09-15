This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Auth and the backend

Sign-in happens in the browser against **Firebase** (Google popup — the only
enabled provider on the `malangeni-blog` project). The backend issues no tokens
of its own; it verifies the Firebase ID token sent as
`Authorization: Bearer <idToken>` on each request.

- `src/lib/firebase.ts` — Firebase init, exports `auth` and `googleProvider`.
- `src/lib/auth/AuthContext.tsx` — `useAuth()` gives you
  `{ firebaseUser, profile, loading, signIn, signOut, error, refreshProfile }`.
- `src/lib/api.ts` — **every** backend call goes through `apiFetch` / `api.*`.
  It attaches the ID token when someone is signed in and omits it when not.
  A `401` signs the user out (no retry); a `403` throws and keeps the session.

There is no sign-up screen: the backend creates the account on the first
authenticated request, and derives the username from the email.

Use `profile.role` (`ADMIN` | `MODERATOR` | `USER` | `SHOP_OWNER`) to gate admin
UI and `profile.id` for ownership — helpers live in `src/lib/auth/types.ts`.
The Firebase uid is **not** exposed by the backend's APIs; never use it for
either.

### Configuration

Copy `.env.example` to `.env.local` and set the backend origin:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

The browser calls the backend directly, so the backend's CORS config must allow
this app's origin — `http://localhost:3000` in development.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
