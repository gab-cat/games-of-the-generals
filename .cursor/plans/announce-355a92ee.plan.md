<!-- 355a92ee-f40d-457d-9915-13f616ad2df6 f2b203ec-5f53-4af3-961f-3569153f3368 -->
# Announcements Feature Implementation

## Overview

Create a comprehensive announcements system that allows admins and moderators to create, update, and delete announcements with Markdown support. Announcements will be displayed with pinned items at the top, followed by the 5 most recent announcements. Add an /announcements page to main navigation and move match history to the user avatar dropdown.

## Implementation Breakdown

### 1. Database Schema

- Add `announcements` table to `convex/schema.ts` with fields:
- `title` (string) - announcement title
- `content` (string) - markdown formatted content
- `isPinned` (boolean) - whether announcement is pinned
- `createdBy` (Id<"users">) - admin/moderator who created it
- `createdByUsername` (string) - username for display
- `createdAt` (number) - creation timestamp
- `updatedAt` (number) - last update timestamp
- Indexes: by_pinned_created (for efficient ordering), by_created_at

### 2. Convex Functions

- Create `convex/announcements.ts` with:
- `listAnnouncements` (query) - get pinned first, then 5 recent
- `createAnnouncement` (mutation) - admin/moderator only
- `updateAnnouncement` (mutation) - admin/moderator only
- `deleteAnnouncement` (mutation) - admin/moderator only
- `checkAdminAccess` (internal query) - verify admin/moderator role

### 3. Frontend Pages & Components

- Create `/src/pages/announcements/00.announcements-page.tsx` - main announcements page
- Create `/src/components/announcements/` directory with:
- `AnnouncementsList.tsx` - displays announcements with Markdown rendering
- `AnnouncementCard.tsx` - individual announcement card
- `CreateAnnouncementDialog.tsx` - admin form to create/edit announcements
- `DeleteAnnouncementDialog.tsx` - confirmation for deletion

### 4. Navigation Updates

- Update `src/components/Layout.tsx`:
- Replace "Match History" nav item with "Announcements"
- Add "Match History" to user avatar dropdown menu
- Update navigation items array and routing logic

### 5. Markdown Support

- Use existing markdown library (check current dependencies)
- Install if needed: `react-markdown` for rendering
- Implement syntax highlighting if desired

### 6. Styling & UX

- Match existing design system (Tailwind, shadcn/ui components)
- Create sleek, compact card design for announcements
- Use visual hierarchy: pinned section, followed by recent announcements
- Ensure mobile responsiveness

## Key Files to Modify

- `convex/schema.ts` - add announcements table
- `convex/announcements.ts` - new file with all mutations/queries
- `src/components/Layout.tsx` - update navigation
- `src/pages/announcements/` - new directory with pages
- `src/components/announcements/` - new directory with components

## Key Features

- Pinned announcements always appear at the top
- Display maximum 5 recent announcements after pinned ones
- Admin and moderator access control
- Markdown content support
- Create, read, update, delete operations
- Responsive mobile and desktop design
- Integrated into main navigation

### To-dos

- [ ] Add announcements table to convex/schema.ts with proper fields and indexes
- [ ] Create convex/announcements.ts with query and mutation functions for CRUD operations
- [ ] Update src/components/Layout.tsx to replace match history nav item with announcements and add match history to dropdown
- [ ] Create announcements page at src/pages/announcements/00.announcements-page.tsx
- [ ] Create announcements components (AnnouncementsList, AnnouncementCard, dialogs) in src/components/announcements/
- [ ] Set up markdown rendering library and implement markdown display in components
- [ ] Create admin form component for creating and editing announcements with Markdown editor
- [ ] Test all CRUD operations, access control, and display logic