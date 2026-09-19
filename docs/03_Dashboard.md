# Phase 3 — Dashboard & UI

## Overview

Full dashboard experience built after login. Every sidebar item routes to a dedicated, fully designed page. No backend integration — all data is mocked. Responsive across desktop, tablet, and mobile.

---

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Overview with stats, activity, quick actions, module cards |
| `/chat` | AI Chat | Split-panel chat UI shell |
| `/knowledge-base` | Knowledge Base | Document manager with upload zone |
| `/planner` | Planner | Interactive task list with filters |
| `/image-generator` | Image Generator | Prompt UI + placeholder gallery |
| `/analytics` | Analytics | CSS charts, metrics, sessions table |
| `/settings` | Settings | Multi-section settings (Profile, Appearance, etc.) |

---

## Sidebar

The sidebar has been updated with the Phase 3 navigation structure:

```
Dashboard        /
Chat             /chat
Knowledge Base   /knowledge-base
Planner          /planner
Image Generator  /image-generator
Analytics        /analytics
────────────────────
Settings         /settings
```

---

## Responsive Behavior

| Breakpoint | Sidebar behavior |
|------------|-----------------|
| `< lg` (mobile/tablet) | Fixed overlay, hidden by default, opens via hamburger |
| `>= lg` (desktop) | Relative in flow, collapses to 68px icon rail |

**Mobile interactions:**
- Hamburger button appears in Navbar on `< lg` screens
- Backdrop appears behind open sidebar — click to close
- Sidebar auto-closes on route change

---

## Dashboard Sections

### Hero Banner
- Time-based greeting using authenticated user's email
- Build progress bar (Phase 3 / 14)
- Current date display

### Stat Cards (4)
| Card | Value |
|------|-------|
| AI Queries Today | 1,247 (+12%) |
| Documents Indexed | 48 (+3) |
| Tasks Due Today | 7 (2 overdue) |
| Images Generated | 23 (+5) |

### Quick Actions
Clickable buttons that navigate to each feature: Chat, Upload Document, Create Task, Generate Image.

### Recent Activity Feed
Timeline of 5 mock recent events with icons and timestamps.

### System Status
4-card grid showing real-time status: API Server ✅, Auth ✅, Database ⏳ (Phase 4), AI ⏳ (Phase 5+).

### Feature Modules
6 clickable cards for all features, each showing phase number and navigation.

---

## Page Highlights

### AI Chat (`/chat`)
- Left panel: conversation list with search + "New Chat" button
- Right panel: mock message bubbles (user/assistant)
- Disabled input bar with Phase 5 notice

### Knowledge Base (`/knowledge-base`)
- Search with live filter across document names and tags
- Upload dropzone with file type icons
- Document cards: size, page count, tags, index status, download/delete actions

### Planner (`/planner`)
- Interactive checkbox toggles (mark tasks complete)
- Filter tabs: All / Today / Upcoming / Completed
- Priority badges: High (rose), Medium (amber), Low (slate)
- Subtask progress bars

### Image Generator (`/image-generator`)
- 6 style presets (Photorealistic, Anime, Oil Painting, Sketch, Watercolor, Pixel Art)
- Model selector (DALL·E 3, Stable Diffusion XL, Midjourney v6)
- Size + advanced sliders (Steps, CFG Scale)
- Placeholder gradient gallery + prompt suggestions
- Disabled generate button (Phase 9)

### Analytics (`/analytics`)
- Date range tabs: Today / This Week / This Month
- CSS bar chart for queries per day
- Feature usage breakdown (progress bars)
- Recent sessions table with token + cost estimates

### Settings (`/settings`)
- **Profile**: Avatar, display name, email, bio
- **Appearance**: Theme picker (Dark/Light/System), accent color swatches, font size slider
- **Notifications**: Toggle switches for email, browser, task reminders, weekly reports
- **API Keys**: Masked key display with show/copy toggles, add key button
- **Privacy**: Data export / delete actions

---

## Files Changed

### New Pages
| File | Lines |
|------|-------|
| `src/pages/Chat.jsx` | Chat split panel |
| `src/pages/KnowledgeBase.jsx` | Document manager |
| `src/pages/Planner.jsx` | Task manager |
| `src/pages/ImageGenerator.jsx` | Image gen UI |
| `src/pages/Analytics.jsx` | Analytics dashboard |
| `src/pages/Settings.jsx` | Settings multi-section |

### Modified
| File | Change |
|------|--------|
| `src/components/layout/Sidebar.jsx` | Updated nav items + mobile responsive (fixed overlay) |
| `src/components/layout/Navbar.jsx` | Mobile hamburger button |
| `src/components/layout/Layout.jsx` | Mobile backdrop + auto-close on route change |
| `src/pages/Dashboard.jsx` | Full redesign |
| `src/hooks/useSidebar.js` | Responsive default (open ≥ lg, closed < lg) |
| `src/App.jsx` | All routes wired to real pages |

---

## Running

```bash
cd frontend
npm run dev    # → http://localhost:5173
```

Log in with your Supabase account → Dashboard loads immediately after auth.

---

## Next Step

➡️ **[Phase 4 — Database & Schema](./04_Database.md)** — Connect Supabase Postgres, define tables, run migrations.
