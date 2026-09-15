# Malangeni Hub — Frontend Tasks

## Done

### Posts
- Community composer saves posts to the backend.
- Posts have a title, details, tag (Discussion, News, Notice, Job) and optional group.
- News, Notice and Job posts show on the home feed under their filter.
- Optional post picture, resized on the phone and uploaded to Cloudinary.
- Post page (`/community/[id]`): full post, likes, comments and replies.
- Authors and staff edit a post (title, details, tag, picture) or delete it.
- Comment authors and staff delete comments; replies go with them.
- "Create post" button in the header and mobile menu opens `/community/new`; from a group's page (or its "Create post" button) that group is already picked.
- Likes and comments saved everywhere: home feed, Community, groups, profiles.
- Feeds load more as you scroll: home, Community, groups, profiles.
- Share menu on posts and events: WhatsApp, Facebook, X, Telegram, email, copy link, phone share sheet.
- Shared post links show a preview: title, text, picture.
- Post pictures are always shown whole, never cropped, capped in height.
- Home feed shows every post type (All, Discussions, News, Notices, Jobs); cards fit any picture shape.

### Accounts
- Google sign-in with Firebase (`/login`); returns you to the page you came from.
- Every API call sends the Firebase token; a 401 signs the member out.
- Backend account is created automatically on first sign-in.
- Names come from the Google account ("Thabo Mokoena") and show with badges on posts, comments and profiles.
- First-sign-in onboarding (`/welcome`): member, informal business or registered business.
- Profile page (`/profile`): picture, name, @username, badge request and your posts.
- Public profiles (`/u/<username>`): name, avatar, badges, join date and posts. No email. Members only.
- One route guard (`RequireAuth`) for signed-in pages, with a 403 screen for role-only pages.
- Profile picture: the member frames it in a cropper (react-easy-crop) before upload.
- Delete account on `/profile` (type DELETE to confirm); removes everything they posted. Admins can't.

### Badges
- Gold "Hub team" badge for admins and moderators.
- Blue "Local business" badge for business owners.

### Hub team tools (`/staff`)
- Business verification queue: approve or reject with a note.
- Verification log: who verified whom.
- Team list: admins add or remove moderators.
- Revoke business badge (takes the listing down) or staff badge (admins only).
- Members see why a badge was removed and can ask again.
- Groups: create, edit and delete (staff also get edit and delete on the group page).
- Events: approve, needs changes (with note), delete, create.
- Services: approve, needs changes (with note), delete, create.
- Directory listings: approve or hide.
- Library: edit name, about, location, map link and opening hours.
- Places: add, edit and delete places on Explore, with category (pick or type new), location, description, picture, Google Maps link and opening hours.
- Pasting a Google Maps link (Library or Places) sets the pin and, with the server's Google Places key, fills in the address and opening hours.

### Community
- Groups with join and leave; group pages (`/community/groups/[id]`) with members and posts.
- "New members": the newest real members and how many joined this week.
- Sponsor slots show a booked sponsor, or nothing.

### Events
- Event list (`/events`) and event pages (`/events/[id]`).
- Members submit events (`/events/new`); they wait for approval.
- Form checks title, future date and time, location, SA cellphone and description.
- Dates typed as dd/mm/yyyy.
- "Your events": status, staff note, edit and cancel.
- Event pages show the whole picture and a tap-to-call number.
- Event posters are framed in a cropper (portrait, square or landscape) before upload.
- Past events are hidden and deleted automatically.

### Services
- Members offer services (`/services/new`): name, category, description, SA cellphone, area, optional hours and picture.
- "Your services": status, note, edit and remove.
- Searchable "Local services" directory with a category filter.
- Service and place card pictures are cropped by Cloudinary to fit (c_fill, g_auto keeps the subject).
- Malangeni Library card: about, location, directions link, opening hours and open-now. Loaded from the backend.

### Local businesses
- Business listing on `/profile` for confirmed businesses: create, edit, hide.
- "Local businesses" on Explore: hours with open-now, phone, email and location.
- Explore place cards: today's hours with open/closed, and a "Get directions" button (to the pin, the Maps link, or a search).

### Layout & UI
- Light and dark mode with an animated sun/moon toggle in the header.
- Theme follows the device and remembers the member's choice.
- Mobile nav as an icon dropdown menu.
- Notification bell built from real posts, events and services, with per-category settings.
- Avatars use `next/image` (Google and Firebase hosts allowed).
- Page titles and descriptions on every route.
- Error page, 404 page, and loading, empty and error states on every list.

### Data
- All mock data removed; every list comes from the backend.

## To do

### Pictures
- [ ] Check the Cloudinary smart crop (g_auto) on service and place cards; switch to a cropper if it cuts the wrong part.

### Explore
- [ ] Place pages (`/explore/[id]`).

### Events
- [ ] Add to calendar (.ics).

### Quality
- [ ] `next/image` for place cards and home feed pictures.
- [ ] Accessibility pass: focus traps in menus, focus styles, contrast.
- [ ] Tests: composer, comments, feed filters, route guard.

### Later
- [ ] Bio field on profiles (needs a backend field).
- [ ] Global search in the header.
- [ ] Server-side notifications with read/unread and saved settings.
