# Thirumangalyam — South Indian Matrimonial Web App
## UX Architecture & Prototype Specification v1.0

---

# 1. INFORMATION ARCHITECTURE

## 1.1 Global Navigation Structure

```
LOGGED-OUT STATE
+---------------------------------------------------------------+
| HEADER (sticky, 64px desktop / 56px mobile)                   |
| Logo [left] | How It Works | Success Stories | Plans | Login  |
|             |              |                 |       | Sign Up |
+---------------------------------------------------------------+
| CONTENT AREA                                                   |
+---------------------------------------------------------------+
| FOOTER                                                         |
| About | Contact | Privacy | Terms | Safety | Blog | Careers   |
| Trust badges: ISO cert, member count, verified profiles count  |
+---------------------------------------------------------------+

LOGGED-IN STATE
+---------------------------------------------------------------+
| HEADER (sticky)                                                |
| Logo [left] | Dashboard | Search | Messages(badge) |          |
|             | Notifications(bell) | Avatar+Dropdown            |
+---------------------------------------------------------------+
| LEFT SIDEBAR (desktop only, 240px, collapsible)                |
|  Profile completion bar                                        |
|  Quick links: Matches, Interests, Shortlist, Viewed Me,       |
|               Horoscope Matches, Settings                      |
+---------------------------------------------------------------+
| CONTENT AREA (fluid)                                           |
+---------------------------------------------------------------+
| FOOTER (minimal: Help | Privacy | Terms)                      |
+---------------------------------------------------------------+

MOBILE LOGGED-IN (bottom tab bar, 56px)
+-------------------------------------------+
| [Home] [Search] [Interests] [Chat] [More] |
+-------------------------------------------+
```

## 1.2 Sitemap

```
/                           Landing Page
/how-it-works               Process explainer
/success-stories            Verified success stories
/plans                      Premium pricing
/register                   Sign Up (role selection)
/register/individual        Individual registration
/register/parent            Parent/guardian registration
/onboarding/step-1..6       Profile wizard (6 steps)
/dashboard                  Match dashboard (home)
/search                     Advanced search
/search/results             Search results
/profile/:id                View a profile
/profile/me                 Own profile (edit mode)
/interests                  Interest inbox/outbox
/interests/received         Received interests
/interests/sent             Sent interests
/interests/accepted         Mutual interests
/chat                       Chat list
/chat/:conversationId       Chat thread
/horoscope-match/:id        Horoscope comparison
/shortlist                  Saved profiles
/who-viewed-me              Profile visitors
/premium                    Upgrade page
/settings                   Account settings
/settings/privacy           Privacy controls
/settings/partner-prefs     Partner preference filters
/parent-dashboard           Parent/guardian view
/help                       Help center
```

## 1.3 Role-Based Access Matrix

```
Feature              | Free   | Premium | Parent/Guardian
---------------------|--------|---------|----------------
View matches         | 10/day | Unlim.  | Unlim.
View contact details | No     | Yes     | Yes
Send interests       | 5/day  | Unlim.  | Unlim.
Chat                 | No     | Yes     | Yes (monitored)
Horoscope matching   | Basic  | Full    | Full
Profile boost        | No     | Yes     | No
Who viewed me        | Blur   | Full    | Full
Advanced filters     | Basic  | Full    | Full
Download horoscope   | No     | Yes     | Yes
```

---

# 2. USER FLOWS

## 2.1 Flow: Onboarding → Profile Setup

```
[Landing Page]
     |
     v
[Sign Up] ── Role Selection ── "I'm registering for..."
     |                          |                |
     v                          v                v
  [Myself]              [Son/Daughter]     [Sibling/Relative]
     |                          |                |
     v                          v                v
[Phone/Email + OTP Verification] ←───────────────┘
     |
     v
[Profile Wizard - 6 Steps]
     |
     ├── Step 1: Basic Info (name, DOB, height, mother tongue,
     |           sub-caste/community, marital status)
     |
     ├── Step 2: Religious & Family (religion, gothra, star/nakshatra,
     |           dosham, family type, family values, family status)
     |
     ├── Step 3: Education & Career (degree, institution, occupation,
     |           employer, income range, work location)
     |
     ├── Step 4: Lifestyle & About (diet, habits, hobbies, about me
     |           text, what I'm looking for text)
     |
     ├── Step 5: Photos & Horoscope (min 1 photo, optional horoscope
     |           upload — JPG/PDF, ID verification prompt)
     |
     └── Step 6: Partner Preferences (age range, height range,
                 education, occupation, community, location,
                 star compatibility, dosham preference)
     |
     v
[Verification Queue] → Admin reviews photo + ID
     |
     v
[Dashboard] ← Profile goes live after approval
```

**Wizard Behavior:**
- Progress bar at top showing step X/6 with step labels
- "Save & Continue" primary CTA, "Back" secondary, "Save Draft" tertiary
- Each step auto-saves on field blur
- Can skip Steps 4-6 with gentle nudge ("Complete profiles get 3x more responses")
- Step 5 photo upload: real-time face detection hint, crop tool, max 6 photos
- Mobile: full-screen wizard, one section per viewport scroll

## 2.2 Flow: Match Dashboard → Profile View → Express Interest

```
[Dashboard]
  |
  ├── Daily Recommendations (algorithm: community + star + location weighted)
  |     |
  |     └── Profile Card (photo, name, age, occupation, location, community)
  |           |
  |           ├── [View Full Profile] ──→ [Profile View Page]
  |           |                               |
  |           |                               ├── [Express Interest] → confirmation
  |           |                               |     modal → [Interest Sent] toast
  |           |                               |
  |           |                               ├── [Shortlist] → heart icon toggle
  |           |                               |
  |           |                               ├── [Share with Parent] → sends link
  |           |                               |     to connected parent account
  |           |                               |
  |           |                               └── [Block/Report] → reason modal
  |           |
  |           ├── [Shortlist] (heart icon on card)
  |           └── [Skip / Not Interested] (X icon, with optional reason)
  |
  ├── New Matches This Week (carousel)
  ├── Matches Near You (if location enabled)
  ├── Recently Active (online status)
  └── Premium Matches (blurred, upsell)
```

## 2.3 Flow: Interest Lifecycle

```
[User A sends interest to User B]
     |
     v
[User B receives notification + inbox item]
     |
     ├── [Accept] → Both see "Mutual Interest"
     |       |
     |       ├── Free: "Upgrade to chat" CTA
     |       └── Premium: Chat unlocks immediately
     |
     ├── [Decline] → User A sees "Declined" (generic message:
     |               "They've chosen not to proceed at this time")
     |
     └── [Pending] → Auto-reminder to B after 3 days
                      Auto-expire after 15 days with notice to A
```

## 2.4 Flow: Chat

```
[Mutual Interest Established]
     |
     v
[Chat Thread Opens]
  |
  ├── Text messages (no media initially — trust/safety)
  ├── After 5 messages exchanged: photo sharing unlocks
  ├── After 10 messages: voice note unlocks
  ├── Contact number sharing: explicit opt-in toggle
  |     └── "Share my phone number with [Name]?" confirmation
  └── Chat moderation: AI flagging for inappropriate content
       └── Warning → Temp block → Permanent block (escalation)
```

## 2.5 Flow: Premium Upgrade

```
[Trigger Points]
  ├── Viewing blurred contact info → "Unlock with Premium"
  ├── Exceeded daily interest limit → "Get unlimited interests"
  ├── Blurred "Who viewed me" → "See who's interested"
  ├── Horoscope deep match → "Get detailed compatibility"
  └── Explicit /premium page visit
     |
     v
[Premium Page]
  ├── Plan comparison (3-month, 6-month, 12-month)
  ├── Feature comparison table
  ├── Trust elements (member count, success stories)
  └── [Choose Plan] → Payment gateway (Razorpay)
           |
           ├── UPI / Netbanking / Card / Wallet
           └── Success → Instant activation + confirmation email
```

## 2.6 Flow: Parent Dashboard

```
[Parent Registration]
     |
     v
[Link to Child's Profile] ← invite code or phone number match
     |
     v
[Parent Dashboard]
  ├── Child's profile overview + completion status
  ├── Matches (filtered through parent's partner prefs overlay)
  ├── Interest inbox (can accept/decline on behalf, with child notification)
  ├── Chat (parent's messages tagged as "Message from [Name]'s Mother/Father")
  ├── Shortlist (separate from child's shortlist, shareable)
  └── Activity log (what child has done, privacy-respecting summary)

Permission Model:
  ├── Child controls: own bio, photos, chat
  ├── Parent controls: partner prefs (overlay), interest responses (if delegated)
  └── Shared: shortlist, profile visibility toggle
```

---

# 3. SCREEN BREAKDOWNS

## 3.1 Landing Page

**Purpose:** Convert visitors into registered users. Establish trust and cultural alignment.

**Grid Layout (12-col):**
```
MOBILE (< 768px): single column, all 12 cols
TABLET (768-1024px): content areas 10 cols centered
DESKTOP (> 1024px): max-width 1280px, centered

+--------------------------------------------------+
| HERO SECTION (full-width, 80vh mobile / 70vh desktop)
| cols 1-12                                         |
|                                                   |
|  [Left cols 1-7]              [Right cols 8-12]   |
|  Headline:                    Hero image:          |
|  "Find Your Life Partner      Tasteful couple      |
|   the Traditional Way,        illustration or       |
|   Made Simple"                photo with South      |
|                               Indian cultural       |
|  Subtext: "Trusted by         elements (temple,     |
|  50,000+ South Indian         kolam, jasmine)       |
|  families since 2024"                              |
|                                                   |
|  [Register Free — CTA primary, full-width mobile] |
|  [Browse Profiles — CTA secondary]                |
|                                                   |
|  Trust strip: "Photos Verified | Aadhaar ID       |
|  Checked | 1,200+ Marriages | 100% Privacy"      |
+--------------------------------------------------+

+--------------------------------------------------+
| HOW IT WORKS (cols 1-12, 4 steps)                 |
| cols 1-3 | cols 4-6 | cols 7-9 | cols 10-12      |
|                                                   |
| Step 1     Step 2     Step 3      Step 4          |
| Register   Create     Browse &    Connect &       |
| [icon]     Profile    Match       Meet             |
|            [icon]     [icon]      [icon]           |
|                                                   |
| (Mobile: horizontal scroll or vertical stack)      |
+--------------------------------------------------+

+--------------------------------------------------+
| TRUST & SOCIAL PROOF (cols 1-12)                  |
|                                                   |
| Success story carousel (3 cards visible desktop)  |
| Each card: couple photo, names, community,        |
|            "Married in [month, year]", short quote |
|                                                   |
| (Mobile: single card with swipe)                  |
+--------------------------------------------------+

+--------------------------------------------------+
| COMMUNITY SECTION (cols 1-12)                     |
|                                                   |
| "Serving All South Indian Communities"            |
| Grid of community tags: Tamil Brahmin, Mudaliar,  |
| Nadar, Gounder, Chettiar, Nair, Ezhava, Reddy,   |
| Kamma, Lingayat, Vokkaliga, etc.                  |
|                                                   |
| Each tag is clickable → filtered registration     |
+--------------------------------------------------+

+--------------------------------------------------+
| PARENT CTA SECTION (cols 1-12, highlight bg)      |
|                                                   |
| "Searching for your Son or Daughter?"             |
| "Create a profile on their behalf with our        |
|  Parent-Friendly Dashboard"                       |
|                                                   |
| [Register as Parent/Guardian — CTA secondary]     |
+--------------------------------------------------+

+--------------------------------------------------+
| PREMIUM TEASER (cols 1-12)                        |
| Feature highlights with plan starting price       |
| [View Plans — CTA tertiary]                       |
+--------------------------------------------------+

+--------------------------------------------------+
| FOOTER                                            |
+--------------------------------------------------+
```

**CTAs:** Primary: "Register Free", Secondary: "Browse Profiles", "Register as Parent"
**Trust Elements:** Verification badges, member count (live counter), success story count, media logos ("As seen in...")
**Empty State:** N/A (static page)
**Error State:** If API for stats fails, show static fallback numbers

---

## 3.2 Sign Up Page

**Purpose:** Capture registration with role selection and phone/email verification.

```
+--------------------------------------------------+
| HEADER (minimal: logo + "Already a member? Login")|
+--------------------------------------------------+

+--------------------------------------------------+
| SIGN UP CARD (cols 3-10 desktop / cols 1-12 mobile)
| centered, max-width 520px                         |
|                                                   |
| "Create Your Matrimony Profile"                   |
|                                                   |
| ROLE SELECTION (radio cards, horizontal):         |
| +-------------+ +-------------+ +-------------+  |
| | [icon]      | | [icon]      | | [icon]      |  |
| | For Myself  | | For My      | | For My      |  |
| |             | | Son/Daughter | | Sibling     |  |
| +-------------+ +-------------+ +-------------+  |
|                                                   |
| FORM FIELDS:                                      |
| ┌─ Full Name ─────────────────────────────────┐  |
| └──────────────────────────────────────────────┘  |
| ┌─ Gender ── ( ) Male  ( ) Female ────────────┐  |
| └──────────────────────────────────────────────┘  |
| ┌─ Phone Number ── [+91 ▼] [__________] ─────┐  |
| └──────────────────────────────────────────────┘  |
|   OR                                              |
| ┌─ Email Address ─────────────────────────────┐  |
| └──────────────────────────────────────────────┘  |
|                                                   |
| ☐ I agree to Terms & Privacy Policy              |
|                                                   |
| [ Send OTP ─── primary button, full width ]       |
|                                                   |
| ─── or register with ───                          |
| [ Google ] [ Apple ] (social auth buttons)         |
|                                                   |
| Already registered? [Login]                       |
+--------------------------------------------------+

OTP VERIFICATION (replaces form after Send OTP):
+--------------------------------------------------+
| "Enter the 6-digit code sent to +91 98XXXXX34"   |
|                                                   |
| [ _ ] [ _ ] [ _ ] [ _ ] [ _ ] [ _ ]              |
|                                                   |
| Resend OTP in 0:28  |  [Change number]           |
|                                                   |
| [ Verify & Continue ─── primary ]                 |
+--------------------------------------------------+
```

**Error States:**
- Phone already registered → "This number is already registered. [Login instead]"
- Invalid OTP → shake animation + "Incorrect code. X attempts remaining."
- Rate limit → "Too many attempts. Try again in 10 minutes."
- Network error → inline banner "Connection issue. Please try again."

---

## 3.3 Profile Wizard (6-step)

**Purpose:** Guided, step-by-step profile creation that feels lightweight despite collecting detailed data.

```
+--------------------------------------------------+
| HEADER (minimal: logo + step indicator)           |
+--------------------------------------------------+

+--------------------------------------------------+
| PROGRESS BAR (cols 1-12)                          |
| ●━━━━●━━━━○━━━━○━━━━○━━━━○                       |
| Basic  Religion  Career  About  Photos  Partner   |
|  Info   & Family         & Life         Prefs     |
+--------------------------------------------------+

+--------------------------------------------------+
| STEP CONTENT (cols 2-8 desktop / cols 1-12 mobile)|
| max-width 640px, centered                         |
|                                                   |
| Step title: "Tell us about yourself"              |
| Step subtitle: "This helps us find the right      |
|  matches for you"                                 |
|                                                   |
| [Form fields for current step — see below]        |
|                                                   |
+--------------------------------------------------+

+--------------------------------------------------+
| BOTTOM ACTION BAR (sticky on mobile)              |
|                                                   |
| [← Back]          [Save Draft]    [Save & Continue →]
| (text btn)        (ghost btn)     (primary btn)    |
|                                                   |
| "Your information is private and secure 🔒"       |
+--------------------------------------------------+
```

**Step 1 — Basic Info fields:**
- Full Name (text, required)
- Date of Birth (date picker, required)
- Height (dropdown: 4'0" to 7'0", required)
- Mother Tongue (dropdown: Tamil, Telugu, Kannada, Malayalam, Tulu, Konkani, required)
- Community / Sub-caste (searchable dropdown, required)
- Marital Status (radio: Never Married, Divorced, Widowed, Awaiting Divorce)
  - If not "Never Married": Children? (Yes → How many, No)

**Step 2 — Religious & Family fields:**
- Religion (dropdown, pre-filled from community)
- Gothra (text/dropdown)
- Star / Nakshatra (dropdown: 27 stars)
- Rashi (auto-calculated from star, editable)
- Dosham (radio: Yes, No, Don't Know)
- Family Type (radio: Joint, Nuclear)
- Family Status (dropdown: Middle Class, Upper Middle, Rich, Affluent)
- Father's Occupation (text)
- Mother's Occupation (text)
- Siblings (structured: brothers married/unmarried, sisters married/unmarried)

**Step 3 — Education & Career:**
- Highest Degree (dropdown: grouped by level)
- Institution / University (text with autocomplete)
- Occupation (searchable dropdown)
- Employer Name (text, optional)
- Annual Income (range dropdown: "Prefer not to say" option)
- Work Location (city search)

**Step 4 — Lifestyle & About:**
- Diet (radio: Vegetarian, Non-Vegetarian, Eggetarian)
- Smoking (radio: No, Occasionally, Yes)
- Drinking (radio: No, Occasionally, Yes)
- Hobbies (multi-select chips: Music, Dance, Reading, Travel, Cooking, Sports, Yoga, etc.)
- About Me (textarea, 50-500 chars, with writing prompts/hints)
- What I'm Looking For (textarea, 50-300 chars)

**Step 5 — Photos & Verification:**
- Photo Upload (drag-drop zone, min 1 required, max 6)
  - Guidelines shown: "Clear face photo, no sunglasses, no group photos"
  - Client-side face detection hint (green checkmark if face detected)
  - Crop/rotate tool on each photo
  - Primary photo selection (first by default)
- Horoscope Upload (optional, drag-drop, JPG/PDF)
  - "Your horoscope enables star-based matching"
- ID Verification prompt (optional but incentivized)
  - "Verified profiles get 40% more responses"
  - Aadhaar / Passport / Voter ID upload
  - Badge shown on profile after admin approval

**Step 6 — Partner Preferences:**
- Age Range (dual slider: 18-60)
- Height Range (dual slider)
- Education (multi-select checkboxes grouped by level)
- Occupation (multi-select)
- Communities (multi-select, "Any" toggle)
- Locations (multi-select city/state)
- Star Compatibility (toggle: Must match, Preferred, Not important)
- Dosham (radio: Must not have, Doesn't matter)
- Diet (radio: Must be veg, Doesn't matter)
- Marital Status (multi-select)

**Empty State (mid-wizard save & return):**
"Welcome back, [Name]! You're on step 3 of 6. [Continue where you left off →]"

---

## 3.4 Dashboard (Match Home)

**Purpose:** Primary logged-in screen. Surface high-quality matches and drive engagement.

```
DESKTOP LAYOUT:
+-------+------------------------------------------+
| LEFT   | MAIN CONTENT (cols 4-12)                |
| SIDEBAR|                                          |
| (cols  | +--------------------------------------+ |
| 1-3)   | | PROFILE COMPLETION BANNER            | |
|        | | "Complete your profile to get 3x     | |
| Profile| | more matches" [Complete Now]          | |
| Comple-| | Progress: ████████░░ 75%             | |
| tion   | +--------------------------------------+ |
| 75%    |                                          |
|        | SECTION: "Today's Matches" (8-12 cards)  |
| Quick  | +--------+ +--------+ +--------+         |
| Links: | | Photo  | | Photo  | | Photo  |         |
| --------| | Name   | | Name   | | Name   |         |
| My      | | Age,Occ| | Age,Occ| | Age,Occ|         |
| Matches | | Loc,Com| | Loc,Com| | Loc,Com|         |
| --------| |[View][♡]| |[View][♡]| |[View][♡]|        |
| New(12) | +--------+ +--------+ +--------+         |
| Interests|                                         |
| --------| SECTION: "New This Week" (carousel →)   |
| Received| +--------+ +--------+ +--------+ [→]    |
| (3)     |                                          |
| Sent(5) | SECTION: "Mutual Star Matches" ⭐        |
| Accepted| (profiles matching nakshatra compat.)    |
| --------|                                          |
| Shortlist| SECTION: "Premium Matches" (blurred)    |
| (7)     | "Upgrade to see 25+ premium matches"     |
| --------| [See Plans →]                            |
| Viewed  |                                          |
| Me(15)  | SECTION: "Recently Active"               |
| --------| (online/active in last 24h)              |
| Horo-   |                                          |
| scope   +------------------------------------------+
| Match   |
| --------|
| Settings|
+--------+

MOBILE LAYOUT:
+------------------------------------------+
| Header + notification bell               |
+------------------------------------------+
| Profile completion card (collapsible)    |
+------------------------------------------+
| Tab pills: [All] [New] [Star] [Near Me] |
+------------------------------------------+
| Profile card (full-width, stacked)       |
| Profile card                             |
| Profile card                             |
| ... infinite scroll ...                  |
+------------------------------------------+
| Bottom Tab Bar                           |
+------------------------------------------+
```

**Card Component (Profile Card):**
```
+----------------------------------+
| [Photo — 3:4 aspect, object-fit] |
| ┌──────────────────────────────┐ |
| │ Verified ✓  |  Online 🟢    │ |
| └──────────────────────────────┘ |
| Name, Age                        |
| Occupation                       |
| Location | Community             |
| ┌──────────────────────────────┐ |
| │ [View Profile]  [♡ Shortlist]│ |
| └──────────────────────────────┘ |
+----------------------------------+
Desktop: 3 cards per row (cols 4 each) within content area
Tablet: 2 cards per row
Mobile: 1 card full-width or 2 compact cards
```

**Empty States:**
- No matches today: "We're finding the best matches for you. Check back soon or [broaden your preferences]."
- No interests received: "Your profile is new! Complete it fully to attract more interest."
- Profile incomplete: Prominent card with step indicator and CTA

**Error State:**
- API failure: "Something went wrong loading matches. [Retry]" with illustration

---

## 3.5 Search & Results

**Purpose:** Let users actively find profiles with granular South Indian-specific filters.

```
DESKTOP:
+-------+------------------------------------------+
| FILTER | RESULTS (cols 4-12)                      |
| PANEL  |                                          |
| (cols  | Sort: [Relevance ▼] | Showing 248 results|
| 1-3)   |                                          |
|        | +--------+ +--------+ +--------+         |
| Basic: | | Card   | | Card   | | Card   |         |
| Age    | +--------+ +--------+ +--------+         |
| Height | +--------+ +--------+ +--------+         |
| -------| | Card   | | Card   | | Card   |         |
| Commun-| +--------+ +--------+ +--------+         |
| ity &  |                                          |
| Religion| [Load More — secondary btn]              |
| -------|                                           |
| Educat-|                                           |
| ion    |                                           |
| -------|                                           |
| Occupa-|                                           |
| tion   |                                           |
| -------|                                           |
| Loca-  |                                           |
| tion   |                                           |
| -------|                                           |
| Star & |                                           |
| Dosham |                                           |
| -------|                                           |
| Diet & |                                           |
| Habits |                                           |
| -------|                                           |
| [Clear]|                                           |
| [Apply]|                                           |
+--------+------------------------------------------+

MOBILE:
+------------------------------------------+
| Search bar (keyword: name, ID)           |
+------------------------------------------+
| [Filter 🔽] [Sort ▼] | 248 results      |
+------------------------------------------+
| Results (stacked cards, infinite scroll) |
+------------------------------------------+

Filter sheet: slides up as bottom sheet on mobile
```

**Empty State (no results):**
"No profiles match these filters. Try [broadening your search] or [removing some filters]."

---

## 3.6 Profile View

**Purpose:** Detailed profile page for evaluating a match. Decision point for interest/shortlist.

```
DESKTOP (cols 2-11, max-width 960px, centered):
+--------------------------------------------------+
| PHOTO GALLERY (cols 1-5)   | QUICK INFO (cols 6-12)
| ┌────────────────────┐     | Name, Age              |
| │                    │     | Occupation, Location   |
| │   Primary Photo    │     | Community              |
| │   (expandable)     │     | "Online now" / "Active |
| │                    │     |  2 hours ago"          |
| └────────────────────┘     |                        |
| [thumb][thumb][thumb]      | [Express Interest — primary]
|                            | [Shortlist ♡ — secondary]  |
|                            | [Share with Parent — ghost] |
|                            |                        |
|                            | Compatibility Score    |
|                            | ██████████░░ 82%       |
|                            | (Star: ✓ | Community: ✓|
|                            |  Location: ✓ | Age: ✓) |
+--------------------------------------------------+

+--------------------------------------------------+
| TABBED CONTENT (cols 1-12)                        |
|                                                   |
| [About] [Family] [Education] [Partner Prefs]     |
|         [Horoscope]                               |
|                                                   |
| TAB: About                                        |
| ┌──────────────────────────────────────────────┐ |
| │ "About Me" text                               │ |
| │                                               │ |
| │ Basic Details          | Lifestyle            │ |
| │ ─────────────          | ─────────            │ |
| │ Height: 5'8"           | Diet: Vegetarian     │ |
| │ Weight: 72 kg          | Smoking: No          │ |
| │ Mother Tongue: Tamil   | Drinking: No         │ |
| │ Marital Status: Never  | Hobbies: Music,      │ |
| │ Married                |  Reading, Travel     │ |
| │ Body Type: Athletic    |                      │ |
| └──────────────────────────────────────────────┘ |
|                                                   |
| TAB: Family                                       |
| ┌──────────────────────────────────────────────┐ |
| │ Family Type: Joint                            │ |
| │ Family Status: Upper Middle Class             │ |
| │ Father: Retired Government Officer            │ |
| │ Mother: Homemaker                             │ |
| │ Siblings: 1 Brother (Married),               │ |
| │           1 Sister (Unmarried)                │ |
| │ Family Values: Traditional                    │ |
| └──────────────────────────────────────────────┘ |
|                                                   |
| TAB: Horoscope                                    |
| ┌──────────────────────────────────────────────┐ |
| │ Star: Ashwini | Rashi: Mesha | Dosham: No    │ |
| │                                               │ |
| │ [View Horoscope Match — premium CTA]          │ |
| │ "See detailed star compatibility analysis"    │ |
| └──────────────────────────────────────────────┘ |
+--------------------------------------------------+

+--------------------------------------------------+
| SIMILAR PROFILES (cols 1-12)                      |
| "You might also like"                             |
| [card] [card] [card] [card]                       |
+--------------------------------------------------+

+--------------------------------------------------+
| REPORT/BLOCK (subtle, bottom)                     |
| [Report this profile] | [Block this person]       |
+--------------------------------------------------+
```

**Mobile:** Photo gallery becomes horizontal swiper. Quick info stacks below. Tabs become scrollable pills. Sticky bottom bar with [Express Interest] [♡] [Share] actions.

**Error State:** Profile not found → "This profile is no longer available. [Back to matches]"
**Privacy State:** Blurred photo for free users who haven't been accepted → "Accept their interest to view photos"

---

## 3.7 Interest Page

**Purpose:** Manage sent/received/accepted interests. Key conversion funnel.

```
+--------------------------------------------------+
| TAB NAVIGATION                                    |
| [Received (3)] [Sent (5)] [Accepted (2)]         |
+--------------------------------------------------+

RECEIVED TAB:
+--------------------------------------------------+
| Interest Card (horizontal, full-width)            |
| +------+----------------------------------------+ |
| | Photo| Name, Age, Occupation, Location        | |
| | 80px | Community | Star                       | |
| |      | "Interested in you" · 2 days ago        | |
| |      |                                        | |
| |      | [Accept — primary] [Decline — ghost]   | |
| |      | [View Profile — text link]              | |
| +------+----------------------------------------+ |
+--------------------------------------------------+

SENT TAB:
+--------------------------------------------------+
| +------+----------------------------------------+ |
| | Photo| Name, Age, Occupation, Location        | |
| |      | Status: Pending ⏳ / Accepted ✓ /      | |
| |      |         Declined ✗                      | |
| |      | Sent 3 days ago                         | |
| |      | [View Profile] [Withdraw — if pending]  | |
| +------+----------------------------------------+ |
+--------------------------------------------------+

ACCEPTED TAB:
+--------------------------------------------------+
| +------+----------------------------------------+ |
| | Photo| Name, Age, Occupation, Location        | |
| |      | "It's a mutual match!"                  | |
| |      | [Start Chat — primary] [View Profile]   | |
| |      | Contact: +91 98XXXXX34 (premium only)   | |
| +------+----------------------------------------+ |
+--------------------------------------------------+
```

**Empty States:**
- Received: "No new interests yet. A complete profile attracts more interest. [Improve your profile]"
- Sent: "You haven't expressed interest in anyone yet. [Browse matches]"
- Accepted: "No mutual interests yet. Keep exploring! [Find matches]"

---

## 3.8 Chat

**Purpose:** Secure messaging between mutually interested profiles.

```
DESKTOP:
+------------------+-------------------------------+
| CHAT LIST        | CHAT THREAD (cols 5-12)       |
| (cols 1-4)       |                               |
|                  | +---------------------------+ |
| Search chats     | | Header: Photo, Name, Age  | |
|                  | | Online status | [···] menu | |
| +──────────────+ | +---------------------------+ |
| | [Avatar] Name| |                               |
| | Last message | | Message bubbles:              |
| | Time · ● unr.| | ┌──────────────────┐          |
| +──────────────+ | │ Their message     │ (left)   |
| | [Avatar] Name| | └──────────────────┘          |
| | Last message | |          ┌──────────────────┐  |
| | Time         | |          │ Your message      │  |
| +──────────────+ |          └──────────────────┘  |
| | [Avatar] Name| |                               |
| | ...          | | ┌──────────────────┐          |
| +──────────────+ | │ System: "You've been│        |
|                  | │ chatting for a week.│        |
|                  | │ Ready to exchange  │        |
|                  | │ numbers?"          │        |
|                  | └──────────────────┘          |
|                  |                               |
|                  | +---------------------------+ |
|                  | | [Type a message...] [Send]| |
|                  | | [📷 if unlocked]          | |
|                  | +---------------------------+ |
+------------------+-------------------------------+

MOBILE: Full-screen chat list → tap → full-screen thread
with back arrow navigation
```

**Empty State (no chats):** "No conversations yet. When you and a match both accept interest, you can start chatting here. [Find matches]"

**Error State:** Message failed to send → "Message not sent. [Retry] [Delete]" with red indicator

---

## 3.9 Horoscope Match

**Purpose:** Star-based compatibility analysis — a critical trust feature for South Indian families.

```
+--------------------------------------------------+
| HEADER: "Horoscope Compatibility"                 |
+--------------------------------------------------+

+--------------------------------------------------+
| PROFILES COMPARED (cols 1-12)                     |
|                                                   |
| +----------+      ⟷       +----------+           |
| | Your     |    Match      | Their    |           |
| | Photo    |    Score       | Photo    |           |
| | Name     |               | Name     |           |
| +----------+               +----------+           |
|                                                   |
|        Compatibility: 7/10 ⭐⭐⭐⭐⭐⭐⭐☆☆☆        |
|           "Good Match"                            |
+--------------------------------------------------+

+--------------------------------------------------+
| PORUTHHAM / KUTA ANALYSIS (cols 1-12)             |
| (10 matches analyzed for Tamil tradition)         |
|                                                   |
| Dina Porutham       ✅ Compatible                 |
| Gana Porutham       ✅ Compatible                 |
| Mahendra Porutham   ✅ Compatible                 |
| Stree Deergha       ✅ Compatible                 |
| Yoni Porutham       ⚠️  Partially Compatible      |
| Rasi Porutham       ✅ Compatible                 |
| Rasiyathipathi      ❌ Not Compatible             |
| Vasya Porutham      ✅ Compatible                 |
| Rajju Porutham      ✅ Compatible                 |
| Vedha Porutham      ✅ Compatible                 |
|                                                   |
| [What do these mean? — expandable info]           |
+--------------------------------------------------+

+--------------------------------------------------+
| DOSHAM STATUS (cols 1-12)                         |
|                                                   |
| You: No Dosham | They: No Dosham                  |
| Result: ✅ No dosham concerns                     |
+--------------------------------------------------+

+--------------------------------------------------+
| DETAILED REPORT (premium only)                    |
| ┌────────────────────────────────────────┐       |
| │ 🔒 Full detailed analysis including   │       |
| │ planetary positions, dasha analysis,   │       |
| │ and remedial suggestions               │       |
| │                                        │       |
| │ [Unlock with Premium — CTA]            │       |
| └────────────────────────────────────────┘       |
+--------------------------------------------------+

+--------------------------------------------------+
| [Download as PDF — premium] [Share — premium]     |
| [Back to Profile]                                 |
+--------------------------------------------------+
```

**Empty State (no horoscope uploaded):** "Upload your horoscope to see star-based compatibility. [Upload Horoscope]"
**Error State (their horoscope missing):** "[Name] hasn't uploaded their horoscope yet. We'll notify you when it's available."

---

## 3.10 Premium Page

**Purpose:** Convert free users to paid subscribers with clear value demonstration.

```
+--------------------------------------------------+
| HERO (cols 1-12, gradient background)             |
|                                                   |
| "Find Your Match Faster with Premium"             |
| "Join 12,000+ premium members who found their     |
|  life partner"                                    |
+--------------------------------------------------+

+--------------------------------------------------+
| PLAN CARDS (cols 1-12, 3 cards)                   |
|                                                   |
| +------------+ +--POPULAR--+ +------------+      |
| | 3 Months   | | 6 Months  | | 12 Months  |      |
| |            | |           | |            |      |
| | ₹2,999     | | ₹4,999   | | ₹7,999     |      |
| | ₹999/mo    | | ₹833/mo  | | ₹666/mo    |      |
| |            | | Save 17%  | | Save 33%   |      |
| |            | |           | |            |      |
| | [Choose]   | | [Choose ★]| | [Choose]   |      |
| +------------+ +-----------+ +------------+      |
|                                                   |
| (Mobile: horizontal scroll with 6-month centered) |
+--------------------------------------------------+

+--------------------------------------------------+
| FEATURE COMPARISON TABLE (cols 2-11)              |
|                                                   |
| Feature              | Free    | Premium          |
| ─────────────────────|─────────|──────────        |
| Daily matches        | 10      | Unlimited        |
| Express interest     | 5/day   | Unlimited        |
| View contact details | ✗       | ✓                |
| Chat with matches    | ✗       | ✓                |
| Who viewed my profile| Blurred | Full access      |
| Advanced search      | Basic   | All filters      |
| Horoscope matching   | Basic   | Detailed report  |
| Profile boost        | ✗       | 1x/week          |
| Priority support     | ✗       | ✓                |
+--------------------------------------------------+

+--------------------------------------------------+
| TRUST ELEMENTS (cols 1-12)                        |
|                                                   |
| "Trusted by 50,000+ families"                    |
| [Testimonial slider from premium members]         |
|                                                   |
| Secure payment icons: Razorpay, UPI, Visa, etc.  |
| "Cancel anytime · No auto-renewal · Full refund   |
|  within 7 days if not satisfied"                  |
+--------------------------------------------------+

+--------------------------------------------------+
| FAQ Accordion                                     |
| "How does Premium work?" [expand]                 |
| "Can I cancel?" [expand]                          |
| "Is my payment secure?" [expand]                  |
| "Do you offer family plans?" [expand]             |
+--------------------------------------------------+
```

---

## 3.11 Settings

**Purpose:** Account management, privacy controls, and preference tuning.

```
+--------------------------------------------------+
| SETTINGS NAVIGATION (left sidebar or top tabs)    |
|                                                   |
| [Account] [Privacy] [Partner Preferences]         |
| [Notifications] [Subscription] [Help]             |
+--------------------------------------------------+

ACCOUNT TAB:
+--------------------------------------------------+
| Profile Photo [Change]                            |
| Name: [editable]                                  |
| Phone: +91 98XXXXX34 [Change → OTP flow]         |
| Email: user@email.com [Change → verify]          |
| Password: ●●●●●●●● [Change]                      |
|                                                   |
| Linked Parent Account: [Name] [Unlink]            |
|                                                   |
| ─── Danger Zone ───                               |
| [Deactivate Profile] — hides from search          |
| [Delete Account] — permanent, requires password   |
+--------------------------------------------------+

PRIVACY TAB:
+--------------------------------------------------+
| Profile Visibility:                               |
|   ( ) Visible to all members                     |
|   ( ) Visible only to premium members            |
|   ( ) Hidden (only visible to people I contact)  |
|                                                   |
| Photo Privacy:                                    |
|   ( ) Visible to all                             |
|   ( ) Visible only to accepted interests          |
|   ( ) Protected (watermarked + request to view)   |
|                                                   |
| Contact Number Display:                           |
|   [toggle] Show to accepted matches               |
|                                                   |
| Horoscope Visibility:                             |
|   [toggle] Show horoscope details on profile      |
|                                                   |
| Blocked Profiles: [Manage blocked list]           |
|                                                   |
| Activity Status:                                  |
|   [toggle] Show when I'm online                   |
+--------------------------------------------------+

NOTIFICATIONS TAB:
+--------------------------------------------------+
| Email Notifications:                              |
|   [toggle] New matches                            |
|   [toggle] Interests received                     |
|   [toggle] Interest accepted                      |
|   [toggle] New messages                           |
|   [toggle] Profile views                          |
|   [toggle] Weekly match digest                    |
|                                                   |
| Push Notifications:                               |
|   [toggle] Interests                              |
|   [toggle] Messages                               |
|   [toggle] Match alerts                           |
+--------------------------------------------------+
```

---

# 4. DESIGN SYSTEM

## 4.1 Typography

```
Font Stack:
  Primary: "Inter" (headings, body, UI)
  Fallback: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
  Tamil/Regional: "Noto Sans Tamil" (for names, community labels)

Scale (desktop / mobile):
  Display:    36px / 28px  · weight 700 · line-height 1.2 · letter-spacing -0.02em
  H1:         30px / 24px  · weight 700 · line-height 1.25
  H2:         24px / 20px  · weight 600 · line-height 1.3
  H3:         20px / 18px  · weight 600 · line-height 1.35
  Body Large: 18px / 16px  · weight 400 · line-height 1.5
  Body:       16px / 15px  · weight 400 · line-height 1.5
  Body Small: 14px / 13px  · weight 400 · line-height 1.45
  Caption:    12px / 12px  · weight 500 · line-height 1.4 · letter-spacing 0.02em
  Overline:   11px / 11px  · weight 600 · line-height 1.4 · letter-spacing 0.08em
              uppercase

Usage Rules:
  - Headlines: weight 600-700, color $neutral-900
  - Body text: weight 400, color $neutral-700
  - Secondary text: weight 400, color $neutral-500
  - Links: weight 500, color $primary-600, underline on hover only
  - Form labels: Body Small, weight 500, color $neutral-600
  - Button text: Body Small or Body, weight 600, uppercase for primary
```

## 4.2 Color Palette

```
PRIMARY (Deep Maroon — auspicious, South Indian cultural resonance):
  $primary-50:   #FEF2F2
  $primary-100:  #FDE3E3
  $primary-200:  #FBC7C7
  $primary-300:  #F7A0A0
  $primary-400:  #F06B6B
  $primary-500:  #E63E3E
  $primary-600:  #C62828    ← Primary brand color
  $primary-700:  #A52222
  $primary-800:  #881E1E
  $primary-900:  #711E1E

SECONDARY (Warm Gold — mangalsutra, temple jewelry):
  $secondary-50:  #FFFBEB
  $secondary-100: #FEF3C7
  $secondary-200: #FDE68A
  $secondary-300: #FCD34D
  $secondary-400: #FBBF24
  $secondary-500: #D4A017    ← Secondary accent
  $secondary-600: #B8860B
  $secondary-700: #92400E

NEUTRAL (Warm Gray):
  $neutral-50:   #FAFAF9
  $neutral-100:  #F5F5F4
  $neutral-200:  #E7E5E4
  $neutral-300:  #D6D3D1
  $neutral-400:  #A8A29E
  $neutral-500:  #78716C
  $neutral-600:  #57534E
  $neutral-700:  #44403C
  $neutral-800:  #292524
  $neutral-900:  #1C1917

SEMANTIC:
  $success:    #16A34A (green — verified, compatible)
  $warning:    #D97706 (amber — partial match, attention)
  $error:      #DC2626 (red — errors, incompatible)
  $info:       #2563EB (blue — informational)

SURFACES:
  $bg-primary:     #FFFFFF
  $bg-secondary:   #FAFAF9
  $bg-tertiary:    #F5F5F4
  $bg-accent:      #FEF2F2 (light maroon tint)
  $bg-premium:     linear-gradient(135deg, #1C1917 0%, #44403C 100%)

USAGE RULES:
  - Primary maroon for CTAs, headers, active states, brand moments
  - Gold for premium badges, highlights, star ratings, auspicious indicators
  - Success green for verified badges, compatibility matches
  - Large surfaces should be white/neutral — color is used for emphasis only
  - Avoid red as the dominant page color despite primary being maroon;
    use it for CTAs and accents, not backgrounds
  - Dark mode: NOT in MVP (add later)
```

## 4.3 Button Hierarchy

```
PRIMARY BUTTON:
  Background: $primary-600
  Text: white, 14px/16px, weight 600, uppercase, letter-spacing 0.05em
  Padding: 12px 24px (md) | 16px 32px (lg) | 8px 16px (sm)
  Border-radius: 8px
  Shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)
  Hover: $primary-700, shadow elevation increase, translateY(-1px)
  Active: $primary-800, shadow decrease, translateY(0)
  Disabled: opacity 0.5, cursor not-allowed
  Loading: spinner replaces text, same dimensions maintained
  Transition: all 150ms ease

SECONDARY BUTTON:
  Background: transparent
  Border: 1.5px solid $primary-600
  Text: $primary-600, same typography as primary
  Hover: background $primary-50, border $primary-700
  Active: background $primary-100

GHOST BUTTON:
  Background: transparent
  Border: 1.5px solid $neutral-300
  Text: $neutral-700
  Hover: background $neutral-100, border $neutral-400
  Active: background $neutral-200

TEXT BUTTON:
  Background: none
  Text: $primary-600, weight 500
  Padding: 8px 12px
  Hover: text $primary-700, underline
  Active: text $primary-800

PREMIUM/GOLD BUTTON:
  Background: linear-gradient(135deg, $secondary-500, $secondary-600)
  Text: white
  Shadow: 0 2px 8px rgba(212, 160, 23, 0.3)
  Hover: brightness increase, shadow expand

ICON BUTTON:
  Size: 40px × 40px (touch target)
  Border-radius: 50%
  Hover: background $neutral-100
  Active: background $neutral-200

DESTRUCTIVE BUTTON:
  Background: $error
  Text: white
  Used only for: Block, Delete Account, Report

ALL BUTTONS:
  Min touch target: 44px × 44px (mobile)
  Focus ring: 2px offset, $primary-400, visible on keyboard nav
  Full-width variant available for mobile/modal contexts
```

## 4.4 Card Styles

```
PROFILE CARD (search results, dashboard):
  Background: white
  Border: 1px solid $neutral-200
  Border-radius: 12px
  Shadow: 0 1px 3px rgba(0,0,0,0.05)
  Overflow: hidden (for photo bleed)
  Hover: shadow 0 4px 12px rgba(0,0,0,0.1), translateY(-2px)
  Transition: all 200ms ease
  Padding: 0 (photo) + 16px (content area)

  Photo section: aspect-ratio 3:4, object-fit cover
  Badge overlay: top-right, 8px from edges
    Verified: green pill with checkmark
    Premium: gold pill with star
    Online: green dot, 10px, positioned on avatar edge

INTEREST CARD (horizontal):
  Background: white
  Border: 1px solid $neutral-200
  Border-radius: 12px
  Padding: 16px
  Layout: flex row, avatar 64px left, content center, actions right
  Hover: background $neutral-50
  New/Unread: left border 3px solid $primary-600

INFO CARD (static content, settings sections):
  Background: $bg-secondary
  Border: 1px solid $neutral-200
  Border-radius: 8px
  Padding: 20px 24px

PREMIUM UPSELL CARD:
  Background: $bg-premium (dark gradient)
  Text: white
  Border-radius: 12px
  Padding: 24px
  Gold accent line at top (3px)
  CTA: Premium/Gold button style

ALERT/BANNER CARD:
  Border-radius: 8px
  Padding: 12px 16px
  Variants:
    Info: bg $info/10%, border-left 3px $info, icon info-circle
    Success: bg $success/10%, border-left 3px $success
    Warning: bg $warning/10%, border-left 3px $warning
    Error: bg $error/10%, border-left 3px $error
```

## 4.5 Spacing System

```
Base unit: 4px

$space-0:   0px
$space-1:   4px     (tight internal padding)
$space-2:   8px     (between related elements)
$space-3:   12px    (input internal padding)
$space-4:   16px    (card padding, standard gap)
$space-5:   20px    (section internal padding)
$space-6:   24px    (between cards)
$space-8:   32px    (between sections)
$space-10:  40px    (major section separation)
$space-12:  48px    (page section gaps)
$space-16:  64px    (hero sections, major separations)
$space-20:  80px    (page top/bottom padding desktop)

Grid:
  Columns: 12
  Gutter: 24px (desktop), 16px (tablet), 12px (mobile)
  Max-width: 1280px (content), 1440px (full-bleed)
  Side margins: 80px (desktop), 32px (tablet), 16px (mobile)

Component-specific:
  Card gap: $space-6 (24px)
  Form field gap: $space-5 (20px)
  Button group gap: $space-3 (12px)
  Section title to content: $space-6 (24px)
  Page title to first section: $space-8 (32px)
```

## 4.6 Additional Design Tokens

```
BORDER RADIUS:
  $radius-sm:   4px   (tags, badges)
  $radius-md:   8px   (buttons, inputs)
  $radius-lg:   12px  (cards)
  $radius-xl:   16px  (modals, bottom sheets)
  $radius-full: 9999px (avatar, pills)

SHADOWS:
  $shadow-sm:   0 1px 2px rgba(0,0,0,0.05)
  $shadow-md:   0 4px 6px rgba(0,0,0,0.07)
  $shadow-lg:   0 10px 15px rgba(0,0,0,0.1)
  $shadow-xl:   0 20px 25px rgba(0,0,0,0.1)
  $shadow-inner: inset 0 2px 4px rgba(0,0,0,0.05)

TRANSITIONS:
  $transition-fast:    150ms ease
  $transition-normal:  200ms ease
  $transition-slow:    300ms ease
  $transition-spring:  300ms cubic-bezier(0.34, 1.56, 0.64, 1)

Z-INDEX SCALE:
  $z-dropdown:   100
  $z-sticky:     200
  $z-header:     300
  $z-overlay:    400
  $z-modal:      500
  $z-toast:      600
  $z-tooltip:    700

FORM INPUTS:
  Height: 44px (mobile), 40px (desktop)
  Padding: 12px 16px
  Border: 1.5px solid $neutral-300
  Border-radius: $radius-md
  Focus: border $primary-500, ring 3px $primary-100
  Error: border $error, ring 3px rgba($error, 0.1)
  Disabled: bg $neutral-100, text $neutral-400
  Placeholder: $neutral-400
  Label-to-input gap: $space-1 (4px)

AVATAR SIZES:
  xs: 24px (inline mentions)
  sm: 32px (chat list)
  md: 40px (header, comments)
  lg: 64px (interest cards)
  xl: 96px (profile header)
  2xl: 128px (own profile edit)
```

---

# 5. CLICKABLE PROTOTYPE LOGIC

## 5.1 Screen Flow Map (Clickable Connections)

```
┌──────────┐     ┌──────────┐     ┌──────────────┐
│ Landing  │────→│ Sign Up  │────→│ OTP Verify   │
│ Page     │     │ (role    │     │              │
│          │     │ select)  │     │              │
└──────────┘     └──────────┘     └──────┬───────┘
     │                                    │
     │ (Login)                            │
     ▼                                    ▼
┌──────────┐     ┌──────────────────────────────────────────┐
│ Login    │     │ Profile Wizard (Step 1→2→3→4→5→6)       │
│ Page     │     │  [linear, with back navigation]          │
└────┬─────┘     └──────────────────────────┬───────────────┘
     │                                       │
     ▼                                       ▼
┌─────────────────────────────────────────────────────────┐
│                     DASHBOARD                            │
│                                                         │
│  ┌─────────────┐  ┌──────────┐  ┌──────────────┐      │
│  │ Profile     │  │ Search   │  │ Interests    │      │
│  │ Cards       │  │ Results  │  │ (3 tabs)     │      │
│  │  │          │  │  │       │  │  │            │      │
│  │  ▼          │  │  ▼       │  │  ▼            │      │
│  │ Profile     │  │ Profile  │  │ Accept →Chat  │      │
│  │ View ───────┼──┼─View     │  │ Decline       │      │
│  │  │          │  │  │       │  │               │      │
│  │  ├→Interest │  │  ├→Int.  │  └───────────────┘      │
│  │  ├→Shortlist│  │  ├→Short │                          │
│  │  ├→Horoscope│  │  └───────┘  ┌──────────────┐      │
│  │  │  Match   │  │             │ Chat List    │      │
│  │  └→Share    │  │             │  │            │      │
│  └─────────────┘  │             │  ▼            │      │
│                    │             │ Chat Thread  │      │
│  ┌─────────────┐  │             └──────────────┘      │
│  │ Shortlist   │  │                                    │
│  └─────────────┘  │  ┌──────────────┐                  │
│                    │  │ Premium Page │                  │
│  ┌─────────────┐  │  │  │           │                  │
│  │ Viewed Me   │  │  │  ▼           │                  │
│  └─────────────┘  │  │ Payment Flow│                  │
│                    │  └──────────────┘                  │
│  ┌─────────────┐  │                                    │
│  │ Settings    │  │  ┌──────────────┐                  │
│  │ (tabs)      │  │  │ Parent       │                  │
│  └─────────────┘  │  │ Dashboard    │                  │
│                    │  └──────────────┘                  │
└─────────────────────────────────────────────────────────┘
```

## 5.2 Interaction Specifications

```
PROFILE CARD INTERACTIONS:
  Tap/Click card body     → Navigate to Profile View
  Tap heart icon          → Toggle shortlist (animate: scale bounce 1→1.3→1)
  Tap X icon              → "Not Interested" (card slides left, next card slides in)
  Long press (mobile)     → Quick preview (bottom sheet with key details)

INTEREST FLOW:
  "Express Interest" click → Confirmation modal:
    "Send interest to [Name]?"
    Optional: Add a personal note (text field, 200 char max)
    [Send Interest] [Cancel]
  → Success: toast notification "Interest sent to [Name]"
  → Error: toast "Something went wrong. Please try again."

CHAT:
  Message send            → Optimistic update (show immediately, confirm async)
  Failed message          → Red exclamation, tap to retry
  Typing indicator        → Three dots animation in their bubble area
  New message while scrolled up → "New message ↓" pill at bottom

SEARCH FILTERS:
  Filter change           → Results update after 300ms debounce
  Mobile filter sheet     → Slides up from bottom, full-height
  "Apply Filters" on mobile → Sheet closes, results update with count

WIZARD:
  Step transition         → Slide animation (left-to-right forward, right-to-left back)
  Field validation        → On blur for each field, on submit for step
  Photo upload            → Progress bar on each photo, reorder via drag

PREMIUM UPSELL (contextual):
  Blurred content tap     → Slide-up modal explaining what Premium unlocks
  "Upgrade" in modal      → Navigate to Premium page with context preserved

PAGE TRANSITIONS:
  Forward navigation      → Slide from right (200ms ease)
  Back navigation         → Slide from left (200ms ease)
  Modal open              → Fade overlay (150ms) + slide up content (200ms spring)
  Modal close             → Reverse of open
  Toast notification      → Slide down from top, auto-dismiss 4s, swipe to dismiss
```

## 5.3 State Management Across Screens

```
GLOBAL STATE:
  - Auth (logged in/out, token, role)
  - User profile (completion %, basic info for header)
  - Unread counts (interests, messages, notifications)
  - Premium status (free/plan type/expiry)

PERSISTED STATE:
  - Wizard draft (localStorage until submission)
  - Search filters (last used, per session)
  - Shortlist IDs (instant heart toggle)
  - Chat draft messages (per conversation)

REAL-TIME STATE:
  - Online status of profiles (WebSocket or polling)
  - New interest notifications
  - Chat messages
  - Unread counts

URL STATE:
  - Search filters encoded in query params (?age=25-30&community=brahmin)
  - Profile view by ID (/profile/TM12345)
  - Chat thread by conversation ID
  - Wizard step in URL (/onboarding/step-3)
```

---

# 6. MVP SCOPE DEFINITION

## 6.1 MVP (Version 1.0) — Must Have

```
SCREENS:
  ✓ Landing page (simplified: hero + how it works + CTA)
  ✓ Sign up (individual only, phone OTP)
  ✓ Profile wizard (all 6 steps)
  ✓ Dashboard (daily matches, basic sections)
  ✓ Search (basic filters: age, community, location, education)
  ✓ Profile view (full detail page)
  ✓ Express interest (send, receive, accept, decline)
  ✓ Basic chat (text only, after mutual interest)
  ✓ Settings (account basics, privacy toggle)

FEATURES:
  ✓ Phone OTP auth
  ✓ Profile CRUD
  ✓ Photo upload (max 6, basic crop)
  ✓ Partner preference filters
  ✓ Daily match algorithm (community + location + age weighted)
  ✓ Interest send/receive/accept/decline lifecycle
  ✓ Text chat between mutual interests
  ✓ Basic horoscope display (star/nakshatra, dosham — no compatibility calc)
  ✓ Shortlist
  ✓ Responsive design (mobile-first)
  ✓ Admin panel: profile approval, photo moderation

NOT IN MVP:
  ✗ Parent dashboard (V1.1)
  ✗ Premium/payments (V1.1)
  ✗ Horoscope compatibility calculator (V1.1)
  ✗ Chat media sharing (V1.2)
  ✗ Who viewed me (V1.1)
  ✗ Profile boost (V1.2)
  ✗ Social login (V1.1)
  ✗ Push notifications (V1.1)
  ✗ Email notifications beyond transactional (V1.1)
  ✗ Success stories CMS (V1.2)
  ✗ Multi-language support (V1.2)
  ✗ Dark mode (V2.0)
```

## 6.2 Tech Stack Recommendation (for implementation reference)

```
Frontend:   Next.js 14+ (App Router) + TypeScript
Styling:    Tailwind CSS + Radix UI primitives
State:      Zustand (client) + React Query (server)
Forms:      React Hook Form + Zod validation
Chat:       Socket.io or Ably
Backend:    Node.js + Express or Next.js API routes
Database:   PostgreSQL + Prisma ORM
Auth:       Phone OTP via MSG91 or Twilio
Storage:    AWS S3 / Cloudflare R2 (photos, horoscopes)
Payments:   Razorpay (when Premium ships)
Search:     PostgreSQL full-text + pg_trgm (MVP), Elasticsearch later
Hosting:    Vercel (frontend) + Railway/Render (backend)
CDN:        Cloudflare
Monitoring: Sentry + Posthog analytics
```

## 6.3 MVP Screen Priority & Build Order

```
Phase 1 (Foundation):
  1. Design system setup (tokens, components in Storybook)
  2. Auth flow (signup, OTP, login)
  3. Profile wizard (all 6 steps)
  4. Own profile view/edit

Phase 2 (Core Loop):
  5. Dashboard with match cards
  6. Profile view (other users)
  7. Search with filters
  8. Interest system (send/receive/accept/decline)

Phase 3 (Engagement):
  9. Chat (text, mutual interest gate)
  10. Shortlist
  11. Settings & privacy
  12. Notification system (in-app)

Phase 4 (Polish & Launch):
  13. Admin panel (profile moderation)
  14. Empty states, error states, loading skeletons
  15. SEO, meta tags, OG images
  16. Performance optimization, image lazy-loading
  17. Mobile testing, accessibility audit
```

---

# 7. RESPONSIVE BREAKPOINTS

```
$breakpoint-sm:   640px   (large phones landscape)
$breakpoint-md:   768px   (tablets portrait)
$breakpoint-lg:   1024px  (tablets landscape / small desktops)
$breakpoint-xl:   1280px  (desktops)
$breakpoint-2xl:  1440px  (large desktops)

Layout Behavior:
  < 768px:   Single column, bottom tab nav, full-width cards,
             bottom sheets for modals, sticky action bars
  768-1024:  2-column cards, side-by-side on some pages,
             top nav with hamburger
  > 1024:    Sidebar nav, 3-column card grids, desktop modals,
             hover states active

Touch Targets:
  Minimum: 44px × 44px (all interactive elements on mobile)
  Recommended: 48px × 48px for primary actions
```

---

# 8. ACCESSIBILITY CONSIDERATIONS

```
- WCAG 2.1 AA compliance target
- Color contrast: all text meets 4.5:1 ratio minimum
- Focus visible: 2px ring on all interactive elements
- Screen reader: ARIA labels on icons, alt text on photos
- Keyboard navigation: full tab order, Escape closes modals
- Form errors: associated with fields via aria-describedby
- Loading states: aria-live regions for dynamic content
- Reduced motion: respect prefers-reduced-motion media query
- Skip to content link on every page
- Regional language: support Tamil, Telugu, Kannada, Malayalam
  script rendering in names and community labels
```

---

*Document version: 1.0*
*Last updated: 2026-02-17*
*Design framework: Mobile-first, trust-centric, culturally aligned*
