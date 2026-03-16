# HADOUKEN TRACKER — Implementation Plan

## What This Is
**Hadouken Tracker** — a mobile-first calorie/macro tracker PWA. You snap a pic of a nutrition label or type what you ate, AI extracts exact macros, you confirm and log it. Retro arcade fighting game aesthetic (Street Fighter / Tekken inspired UI). Deployed on Vercel, backed by Supabase.

---

## What's Already Built (Phase 1 — DONE)
Project lives at `C:\Users\Jeremiah\Desktop\macro-tracker`. The foundation is complete:

### Existing Files (DO NOT recreate — build on these)
```
src/
├── app/
│   ├── globals.css          ✅ Full arcade theme (Tailwind v4 @theme), mobile-native CSS, glow utilities, HP bar segments, scanlines
│   ├── layout.tsx           ✅ Root layout with Inter + Orbitron fonts, PWA meta, Providers, AppShell, Toaster
│   ├── page.tsx             ❌ Still default Next.js template — needs dashboard
│   └── favicon.ico          ✅
├── components/
│   └── layout/
│       ├── AppShell.tsx     ✅ Wraps pages, hides bottom nav on /auth, safe-area padding, pb-20 for nav
│       ├── BottomNav.tsx    ✅ 4 tabs (FIGHT/LOG/HISTORY/CONFIG), Framer Motion, glow active state
│       └── Providers.tsx    ✅ React Query provider (30s stale, 1 retry)
├── lib/
│   └── utils/
│       └── cn.ts            ✅ clsx + tailwind-merge
├── types/
│   └── database.ts          ✅ Profile, FoodEntry, InsertFoodEntry, UpdateFoodEntry types
public/
├── manifest.json            ✅ PWA manifest (standalone, portrait, #0a0a0a theme)
├── icons/                   ❌ Need icon-192.png and icon-512.png (placeholder OK for now)
next.config.ts               ✅ Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
package.json                 ✅ All deps installed
```

### Empty directories already created (ready for files)
```
src/app/log/           src/app/history/        src/app/settings/
src/app/auth/callback/ src/app/api/analyze/    src/app/api/entries/
src/app/api/profile/   src/app/api/admin/users/
src/components/ui/     src/components/food/    src/components/auth/
src/components/dashboard/ src/components/history/ src/components/settings/
src/lib/supabase/      src/lib/openai/         src/lib/hooks/
```

### Installed Dependencies
```
@supabase/ssr ^0.9.0          @supabase/supabase-js ^2.99.1
@tanstack/react-query ^5.90.21 clsx ^2.1.1
framer-motion ^12.36.0         lucide-react ^0.577.0
next 16.1.6                    next-pwa ^5.6.0
openai ^6.29.0                 react 19.2.3
sonner ^2.0.7                  tailwind-merge ^3.5.0
zod ^4.3.6
```

### IMPORTANT: Tailwind v4 — No tailwind.config.ts
This project uses **Tailwind CSS v4**. Theme customization is in `globals.css` via `@theme inline { }` blocks. All arcade colors are CSS custom properties. Use them as Tailwind classes: `text-electric-blue`, `bg-surface`, `border-border`, `shadow-glow-blue`, etc.

### Existing Arcade CSS Utilities (in globals.css)
- `.scanlines::after` — subtle CRT scanline overlay
- `.text-glow-blue`, `.text-glow-pink`, `.text-glow-yellow` — neon text glow
- `.hp-bar-segments` — repeating gradient for segmented health bar look
- `.arcade-border` — card border with inset highlight + drop shadow
- `.arcade-btn` — scale-down press effect on `:active`
- `.safe-top`, `.safe-bottom`, `.safe-left`, `.safe-right` — iOS safe area padding

### Existing TypeScript Types (in src/types/database.ts)
```typescript
type UserRole = "admin" | "friend" | "free";
interface Profile { id, role, calorie_goal, protein_goal, carb_goal, fat_goal, ai_requests_today, ai_requests_date, created_at, updated_at }
interface FoodEntry { id, user_id, date, name, calories, protein, carbs, fat, fiber, sugar, sodium, serving_size, source_type, ai_confidence, ai_raw_response, created_at }
type InsertFoodEntry = Omit<FoodEntry, "id" | "created_at" | "user_id">;
type UpdateFoodEntry = Partial<InsertFoodEntry> & { id: string };
```

---

## Tech Stack
| Layer | Tech | Notes |
|-------|------|-------|
| Framework | Next.js 16 (App Router, TypeScript) | `next.config.ts` (not .js) |
| Styling | Tailwind CSS v4 | CSS-based `@theme`, NO JS config file |
| Fonts | Orbitron (display/headers), Inter (body) | Loaded via `next/font/google` in layout.tsx |
| Database | Supabase PostgreSQL | User needs to create project |
| Auth | Supabase Auth (email/password) | Cookie-based via `@supabase/ssr` |
| AI | OpenAI API | User needs API key from platform.openai.com |
| Data fetching | React Query v5 | Configured in Providers.tsx |
| Animations | Framer Motion | Used in BottomNav already |
| Toasts | sonner | Configured in layout.tsx |
| Icons | lucide-react | Used in BottomNav |
| Deploy | Vercel | |

---

## Prerequisites (user must do before the app works)
1. **Create Supabase project** at supabase.com → get URL + anon key + service role key
2. **Get OpenAI API key** at platform.openai.com → add payment method (~$5 min, usage ~$1-2/month)
3. Create `.env.local` in project root:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
OPENAI_API_KEY=your-openai-api-key
```

---

## Security & Cost Protection (CRITICAL — enforce in every API route)

### Roles System
| Role | Access | Who |
|------|--------|-----|
| `admin` | Everything + user management | Only the owner |
| `friend` | Everything including AI features | Manually promoted by admin |
| `free` (default) | Sign up and log in only. **NO AI features.** Manual macro entry only. | Everyone else |

### Cost Protection Rules
- AI rate limit: Max 30 AI requests/day per user (even friends). Tracked in `profiles.ai_requests_today`, resets daily.
- All API routes verify auth session. AI routes additionally check `role = admin OR friend`.
- Image size limit: Reject > 4MB (after client-side compression to max 1024px, 0.8 quality JPEG).
- Auth rate limit: Max 5 login attempts per IP per 15 min (in-memory store).
- No public pages except `/auth`. All routes require authentication.
- `robots.txt` with `Disallow: /`.
- Security headers already in `next.config.ts`.
- Supabase RLS: users only access own data. Service role key server-only.

### AI Safety Rules
- **No chat. No conversation.** AI is a silent macro extractor only.
- **Input → structured JSON → done.** No free-form AI text responses ever.
- **Non-food rejection:** Model returns `{ "rejected": true, "reason": "not_food" }` for non-food input. UI shows "Please enter food items only."
- **Structured output enforced:** OpenAI `response_format: { type: 'json_schema' }` locks output shape.
- System prompt hardcoded server-side, never exposed to client.

---

## Design Direction: Retro Arcade Fighting Game Aesthetic
NOT super pixelated. High-quality arcade, clean enough for daily use:

- **Colors:** Deep black (#0a0a0a) bg, electric blue (#00d4ff), hot pink (#ff2d78), neon yellow (#ffe600), fire red (#ff4136), power green (#00ff87), ultra violet (#b026ff)
- **Fonts:** Orbitron for display/headers, Inter for body
- **Progress → HP/Energy bars:** Calories = segmented health bar (green→yellow→red). Macros = super meters with glow.
- **Cards → Fight panels:** Angular cuts, metallic/gradient borders, `.arcade-border` class
- **Dashboard → "Fight Screen":** Stats vs goals, VS-screen energy
- **Animations:** Punchy entrances, numbers slam in, bars fill with energy
- **Bottom nav:** Arcade menu bar with glow on active tab (already built)
- **Buttons:** Chunky beveled, `.arcade-btn` press effect

---

## What Needs to Be Built (Phases 2–6)

### Phase 2: Authentication

#### `src/lib/supabase/client.ts` — Browser Supabase client
- `createBrowserClient` from `@supabase/ssr`
- Uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### `src/lib/supabase/server.ts` — Server Supabase client
- `createServerClient` from `@supabase/ssr`
- Cookie-based session via `next/headers` `cookies()`
- Used in API routes and Server Components

#### `src/middleware.ts` — Auth middleware
- Match all routes except static assets, manifest, robots.txt, icons
- Refresh Supabase session
- No session → redirect to `/auth`
- Has session + on `/auth` → redirect to `/`

#### `src/app/auth/page.tsx` — Login/signup page
- Arcade-styled auth form

#### `src/components/auth/AuthForm.tsx` — Auth form component
- Email + password fields
- Toggle between login/signup
- `supabase.auth.signInWithPassword()` / `supabase.auth.signUp()`
- Error display, rate limit client-side (disable button 30s after 5 failures)
- On success: `router.push('/')` + `router.refresh()`

#### `src/app/auth/callback/route.ts` — OAuth callback
- Exchange code for session, redirect to `/`

#### Database SQL (run in Supabase SQL editor)
```sql
-- profiles table
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  role text default 'free' check (role in ('admin', 'friend', 'free')),
  calorie_goal integer default 2000,
  protein_goal integer default 150,
  carb_goal integer default 250,
  fat_goal integer default 65,
  ai_requests_today integer default 0,
  ai_requests_date date default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- food_entries table
create table food_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date default current_date not null,
  name text not null,
  calories numeric(7,1) not null,
  protein numeric(6,1) default 0,
  carbs numeric(6,1) default 0,
  fat numeric(6,1) default 0,
  fiber numeric(6,1) default 0,
  sugar numeric(6,1) default 0,
  sodium numeric(7,1) default 0,
  serving_size text,
  source_type text check (source_type in ('photo','text','manual')) default 'manual',
  ai_confidence numeric(3,2),
  ai_raw_response jsonb,
  created_at timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
alter table food_entries enable row level security;

create policy "Users read own profile" on profiles for select using (auth.uid() = id);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);
create policy "Users read own entries" on food_entries for select using (auth.uid() = user_id);
create policy "Users insert own entries" on food_entries for insert with check (auth.uid() = user_id);
create policy "Users update own entries" on food_entries for update using (auth.uid() = user_id);
create policy "Users delete own entries" on food_entries for delete using (auth.uid() = user_id);

-- Performance index
create index idx_food_entries_user_date on food_entries (user_id, date desc);
```

After running this, set your own user's role to admin:
```sql
update profiles set role = 'admin' where id = 'YOUR_USER_UUID';
```

---

### Phase 3: Dashboard + CRUD

#### `src/types/nutrition.ts` — AI response types
```typescript
export interface NutritionItem {
  name: string;
  serving_size: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface AnalysisResult {
  rejected: boolean;
  reason?: string;
  items: NutritionItem[];
  confidence: number;
  notes?: string;
}
```

#### `src/app/api/profile/route.ts`
- `GET`: Fetch authenticated user's profile (goals + role)
- `PUT`: Update goals only. Do NOT allow role changes here.

#### `src/app/api/entries/route.ts`
- `GET`: Entries for date (`?date=2026-03-15`), default today
- `POST`: Create entry. Set `user_id` server-side from session.
- `PUT`: Update entry by id
- `DELETE`: Delete entry (`?id=...`)

#### `src/lib/hooks/useProfile.ts`
- `useQuery(['profile'])` → GET `/api/profile`
- `useMutation` → PUT `/api/profile`

#### `src/lib/hooks/useEntries.ts`
- `useQuery(['entries', date])` → GET `/api/entries?date=...`
- Mutations for create/update/delete with cache invalidation

#### `src/lib/hooks/useDailySummary.ts`
- Combines useEntries(today) + useProfile()
- Returns `{ totals, goals, remaining, percentages }`

#### `src/app/page.tsx` — Dashboard (replace default template)
- Calorie HP bar (segmented, green→yellow→red gradient)
- Three macro super meters (protein=blue, carbs=yellow, fat=pink)
- Today's food entries list
- Swipe-to-delete on entries
- Empty state: "NO ENTRIES — READY TO FIGHT" with link to /log

#### `src/components/ui/ProgressRing.tsx`
- SVG circular progress for calories
- Animated via Framer Motion
- Color changes by percentage

#### `src/components/ui/MacroBar.tsx`
- Horizontal bar with label, current/goal, colored fill
- `.hp-bar-segments` overlay
- Glow effect

#### `src/components/food/FoodEntryCard.tsx`
- Compact card: name, calories, P/C/F
- Confidence dot if AI-sourced
- Swipe-to-delete (Framer Motion drag)

---

### Phase 4: AI-Powered Food Logging (Core Feature)

#### `src/lib/openai/client.ts` — SERVER-ONLY
```typescript
import OpenAI from 'openai';
export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
```

#### `src/lib/openai/schemas.ts`
JSON schema for structured output:
```
{ rejected, reason?, items: [{ name, serving_size, calories, protein, carbs, fat, fiber?, sugar?, sodium? }], confidence, notes? }
```

#### `src/lib/openai/prompts.ts`
**Image prompt:** Extract exact values from nutrition labels. Reject non-food images. Use USDA data for estimates. Confidence 0.95+ for clear labels, 0.7-0.9 for estimates.

**Text prompt:** Calculate nutrition from food descriptions. Reject non-food. USDA standard values. Common refs: 1oz cooked chicken breast = 46cal/8.6gP/0gC/1gF. Cooked meat loses ~25% weight from raw. Break down recipes per-ingredient.

#### `src/lib/openai/analyze-image.ts`
- GPT-4o with vision (`image_url` content part, `detail: 'high'`)
- Structured output via `response_format`

#### `src/lib/openai/analyze-text.ts`
- GPT-4o-mini (cheaper for text)
- Same structured output

#### `src/app/api/analyze/route.ts` — ROLE-GATED
POST `{ type: 'image' | 'text', content: string }`:
1. Verify auth → 401
2. Check role is admin/friend → 403
3. Check ai_requests_today < 30 (reset if date changed) → 429
4. Validate content not empty, image < 4MB → 400
5. Increment counter
6. Route to analyzer
7. Return JSON

#### `src/lib/utils/rate-limit.ts`
- In-memory Map for auth rate limiting
- `checkRateLimit(key, maxAttempts, windowMs): boolean`

#### `src/lib/utils/image.ts`
- Canvas-based compression: max 1024px, 0.8 JPEG quality
- Returns base64

#### `src/app/log/page.tsx` — NOT a chat
Two tabs: "SCAN" (photo) and "TYPE" (text)
- Photo: camera/upload → compress → send to /api/analyze → show results
- Text: textarea → submit → show results
- No chat bubbles, no AI responses. Just: input → macros → confirm → logged.

#### `src/components/food/NutritionResult.tsx`
- Editable fields for each item
- Confidence badge (green/yellow/red)
- "LOG IT" and "CANCEL" buttons
- If rejected: "FOOD ITEMS ONLY" message

#### `src/components/food/PhotoCapture.tsx`
- File input wrapper with compression
- Thumbnail preview

---

### Phase 5: History + Settings + Admin

#### `src/app/history/page.tsx`
- Horizontal scrolling week selector
- Daily summary + entry list per selected day

#### `src/app/settings/page.tsx`
- Goals: editable calorie/protein/carb/fat with save
- Account: email, sign out
- Admin panel (role=admin only): user list, toggle friend role, AI usage stats

#### `src/app/api/admin/users/route.ts`
- `GET`: All profiles with email (admin only)
- `PUT`: Change role (admin only, can't set to admin, can't change self)

#### Mobile polish
- Framer Motion page transitions in AppShell
- Loading skeletons
- Empty states
- Toast notifications (sonner)

---

### Phase 6: Deploy

1. Create `public/robots.txt`: `User-agent: *\nDisallow: /`
2. Push to GitHub
3. Connect Vercel, set 4 env vars
4. Add production URL to Supabase Auth redirect URLs
5. Test PWA on iPhone

---

## Verification Checklist
1. PWA: iPhone homescreen → standalone, no pull-to-refresh, no swipe-back
2. Auth: signup → auto profile (role=free) → login → dashboard → logout → /auth
3. Role gate: free user → AI blocked with 403
4. Photo: nutrition label → exact values extracted
5. Text: "5oz cooked chicken breast" → ~230 cal, ~43g protein
6. Multi-item: "5oz top sirloin and 200g cooked jasmine rice" → itemized
7. Recipe paste: parsed per-ingredient
8. Non-food: "what's the weather" → "FOOD ITEMS ONLY"
9. Rate limit: 31st request → 429
10. Dashboard: progress bars update after logging
11. History: past days show correctly
12. Edit/delete: works, persists
13. Admin: user list, toggle roles
14. Desktop: functional (not priority but works)
