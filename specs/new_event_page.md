# New Event Page Specification

## Executive Summary
This document outlines the research findings and implementation specifications for the new event page prototype. **Status: IMPLEMENTED** at `/events_beta.astro` with real event data and full DaisyUI integration.

## Current Architecture Overview

### Technology Stack
- **Framework**: Astro 5.13.2 (Static Site Generator with hybrid rendering)
- **Styling**: 
  - Tailwind CSS 3.4.1
  - DaisyUI 4.7.2 (component library)
  - Flowbite 2.3.0 (UI components)
- **Language**: TypeScript 5.3.3
- **Deployment**: Netlify
- **Package Manager**: Yarn 1.22.22
- **Icons**: Astro-icon with Iconify

### Project Structure
```
ccsf-cs-club/
├── src/
│   ├── components/        # Reusable UI components
│   ├── content/          # Content collections (events)
│   ├── layouts/          # Page layouts
│   ├── pages/           # Route pages
│   └── assets/          # Static assets (images)
├── public/              # Public static files
└── specs/              # Specifications (this document)
```

### Current Event System

#### Data Model (Content Collection)
Events are managed through Astro's content collection system with the following schema:
- **title**: string
- **date**: Date
- **endDate**: Date (optional)
- **location**: string (optional)
- **description**: string
- **featured**: boolean
- **category**: enum ['workshop', 'social', 'conference', 'meeting', 'competition', 'field-notes', 'build-logs', 'speaker-spotlight', 'other']
- **images**: array of strings
- **external_link**: URL (optional)
- **tags**: array of strings
- **status**: enum ['upcoming', 'completed', 'cancelled']
- **author**: string (optional)
- **learning_outcomes**: array of strings (optional)
- **related_links**: array of objects (optional)

#### Key Components
1. **EventCard.astro**: Main event display component
   - Displays event metadata, images, tags
   - Responsive grid layout
   - Category and status badges
   - External link support

2. **Calendar.astro**: Calendar view component
   - Visual calendar display
   - Event date mapping

3. **pages/events/index.astro**: Current events page
   - Multiple sections: Upcoming, Featured, Blog Content, History
   - Grid layouts for event cards
   - Filtering by category and year

## Design Analysis (From Mockup)

### Layout Structure
The mockup shows a sophisticated events page with the following hierarchy:

1. **Header Navigation Tabs** (horizontal pill tabs with underline indicator)
2. **Featured Event Hero Section** (large card with illustration)
3. **Grid of Upcoming Events** (3-column layout on desktop)
4. **Ongoing Sessions Strip** (horizontal layout)
5. **Archive Section** (lower visual priority)

### Detailed UI Component Analysis

#### 1. Tab Navigation
- **Active State**: "All Events" with red underline indicator and bold text
- **Inactive Tabs**: "Build Together", "Hackathons", "Community" with normal font weight
- **Styling**: Clean, minimal pill-shaped tabs with subtle hover states
- **Layout**: Horizontal, left-aligned, with consistent spacing

#### 2. Featured Event Section
- **Layout**: Large hero card spanning full width or majority of container
- **Visual Elements**:
  - Custom penguin illustration (cute character at a laptop in an igloo)
  - Split layout: content on left, illustration on right
- **Content Structure**:
  - Section header: "Featured Event"
  - Badge system: "Policy" (red badge) + "Online" (yellow badge)
  - Event title: "Project Build Night" (large, prominent typography)
  - Description: "Pair program with club members on fun projects!"
  - Primary CTA: Red "RSVP on Luma" button
- **Metadata Display**: "Next 2 Weeks — Sun, Apr 28" (right-aligned)

#### 3. Event Cards Grid (3-column layout)
**Card 1: AI & Education Summit**
- LUMA badge (red, top-left)
- Event illustration (conference/presentation scene)
- Title: "AI & Education Summit"
- Description: "Attend talks on the impact of AI on learning"
- Red "RSVP on Luma" button

**Card 2: Women in Tech Panel**
- Date badge: "May 1" (blue, top-left)
- Purple/ghost character illustration
- Title: "Women in Tech Panel" 
- Description: "Panel discussion with female tech leaders"
- Red "RSVP on Luma" button

**Card 3: Park Cleanup**
- Community badge (yellow, top-left)
- Bear character illustration with cleaning supplies
- Title: "Park Cleanup"
- Description: "Volunteer to help clean up a local park"
- Red "RSVP on Luma" button

#### 4. Ongoing Sessions Section
- **Layout**: Horizontal card with illustration on left, content on right
- **Visual**: Small penguin character icon
- **Content**:
  - Title: "Wednesday Coding"
  - Badge: "In-Person" (green)
  - Clean, minimal presentation

#### 5. Archive Section
- **Header**: "Archive" with smaller typography
- **Content**: Single item shown - "Intro to Git Workshop"
- **Badge**: "Online" (yellow)
- **Visual Priority**: Lower than main content areas

### Visual Design System

#### Color Palette
- **Background**: Warm cream/beige (#FAF7F0 or similar)
- **Primary Red**: Used for RSVP buttons and active state indicators
- **Badge Colors**:
  - Red: LUMA/Policy events
  - Yellow: Online/Community events  
  - Green: In-Person events
  - Blue: Date indicators

#### Typography Hierarchy
- **Section Headers**: Large, bold sans-serif
- **Event Titles**: Medium-large, bold
- **Descriptions**: Regular weight, readable size
- **Metadata**: Smaller, muted text

#### Card Design System
- **Rounded Corners**: Soft, modern feel (likely 12-16px radius)
- **Subtle Shadows**: Light drop shadows for depth
- **Consistent Padding**: Generous internal spacing
- **Hover States**: Likely subtle lift/shadow increase

#### Illustration Style
- **Character Design**: Cute, friendly animals (penguin, bear, ghost)
- **Art Style**: Flat design with subtle gradients
- **Color Integration**: Illustrations complement the overall warm palette
- **Contextual Relevance**: Each illustration relates to the event type

### Interactive Elements
- **RSVP Buttons**: Prominent red buttons with consistent styling
- **Tab Navigation**: Clear active/inactive states with smooth transitions
- **Card Hover States**: Implied interactive feedback
- **Badge System**: Clear visual categorization for quick scanning

### Responsive Design Considerations
- **Desktop Layout**: 3-column grid for event cards
- **Mobile Adaptation**: Likely stacks to single column
- **Tab Navigation**: May become dropdown or horizontal scroll on mobile
- **Featured Section**: Illustration may stack below content on smaller screens

## Mockup-Specific Implementation Requirements

### Component Specifications from Mockup

#### EventTabNavigation Component
```typescript
interface TabNavigationProps {
  activeTab: 'all' | 'build-together' | 'hackathons' | 'community';
  onTabChange: (tab: string) => void;
}
```
- Use pill-shaped tab design with red underline for active state
- Implement smooth transition animations between tabs
- Ensure keyboard navigation support (arrow keys, tab key)

#### FeaturedEventHero Component
```typescript
interface FeaturedEventProps {
  title: string;
  description: string;
  badges: Array<{type: 'policy' | 'online' | 'in-person' | 'community', label: string}>;
  rsvpUrl: string;
  dateRange: string;
  illustration: string; // path to SVG illustration
}
```
- Split layout: 60% content, 40% illustration on desktop
- Stack vertically on mobile (content first, then illustration)
- Red RSVP button with hover effects
- Badge system with color-coded backgrounds

#### EventCard Component (Enhanced)
```typescript
interface EventCardProps {
  title: string;
  description: string;
  badge: {type: 'luma' | 'date' | 'community' | 'online', label: string, color: 'red' | 'blue' | 'yellow' | 'green'};
  illustration: string;
  rsvpUrl: string;
  cardSize?: 'standard' | 'compact';
}
```
- Consistent aspect ratio for all cards
- Badge positioning: top-left corner with appropriate spacing
- Illustration area: top 40% of card
- Content area: bottom 60% with consistent padding
- Button: full-width red RSVP button at bottom

#### OngoingSessionCard Component
```typescript
interface OngoingSessionProps {
  title: string;
  badge: {type: 'in-person' | 'online' | 'hybrid', label: string};
  icon: string; // small character illustration
  schedule?: string;
}
```
- Horizontal layout with icon on left
- Minimal design compared to main event cards
- Green badge for in-person events

#### ArchiveSection Component
```typescript
interface ArchiveProps {
  events: Array<{
    title: string;
    badge: {type: string, label: string};
    date?: string;
  }>;
  isCollapsed?: boolean;
}
```
- Lower visual hierarchy (smaller text, muted colors)
- Optional collapse/expand functionality
- List format rather than card format

### Illustration Management System
Based on the mockup, implement:
- **Character Library**: Penguin, bear, ghost characters with different poses/contexts
- **Scene Library**: Conference rooms, outdoor settings, coding environments
- **SVG Format**: Scalable, performance-optimized
- **Contextual Mapping**: Algorithm to match event types with appropriate illustrations

### Badge System Specification
```css
.badge-luma { background: #EF4444; color: white; }
.badge-date { background: #3B82F6; color: white; }
.badge-community { background: #F59E0B; color: white; }
.badge-online { background: #F59E0B; color: black; }
.badge-in-person { background: #10B981; color: white; }
.badge-policy { background: #EF4444; color: white; }
```

### Animation & Interaction Specifications
- **Tab Transitions**: 200ms ease-in-out for underline movement
- **Card Hover**: 2px lift with increased shadow (300ms transition)
- **Button Hover**: Slight darken effect on red buttons
- **Badge Animations**: Subtle scale on hover (1.05x)

### Grid System from Mockup
- **Desktop**: 3-column grid with 24px gaps
- **Tablet**: 2-column grid with 20px gaps
- **Mobile**: Single column with 16px vertical gaps
- **Featured Hero**: Full width across all breakpoints
- **Ongoing Sessions**: Full width, horizontal scroll on mobile if needed

## Component Architecture & CSS Layout Strategy

### Page-Level Layout Structure

#### Main Container (`events-page-container`)
- Use CSS Grid for overall page layout with named grid areas
- Define regions: header, navigation, featured, grid, ongoing, archive, footer
- Apply consistent page-level padding and max-width constraints
- Handle vertical spacing between major sections using grid gaps

#### Section Hierarchy & Relationships
1. **Page Header** (`events-header`) - minimal height, clean typography
2. **Tab Navigation** (`events-nav`) - sticky positioning, horizontal flex layout
3. **Featured Section** (`events-featured`) - full-width container for hero content
4. **Main Events Grid** (`events-main-grid`) - responsive grid container
5. **Ongoing Sessions** (`events-ongoing`) - horizontal strip layout
6. **Archive Section** (`events-archive`) - collapsed/expandable list layout

### Component Layout Methodologies

#### Tab Navigation Component (`EventTabNavigation`)
- **Container**: Horizontal flexbox with space-between distribution
- **Tab Items**: Flex items with equal distribution and hover states
- **Active Indicator**: Pseudo-element positioning for underline animation
- **Responsive Strategy**: Transform to horizontal scroll on mobile breakpoints

#### Featured Hero Component (`FeaturedEventHero`)
- **Primary Layout**: CSS Grid with two columns (content + illustration)
- **Content Area**: Nested flexbox for vertical content stacking
- **Badge Container**: Horizontal flex with gap spacing for multiple badges
- **Illustration Area**: Aspect-ratio container with object-fit positioning
- **Responsive Collapse**: Single column stack below tablet breakpoint

#### Event Cards Grid (`EventCardsGrid`)
- **Container Strategy**: CSS Grid with auto-fit minmax for responsive columns
- **Card Sizing**: Aspect-ratio maintenance using CSS aspect-ratio property
- **Gap Management**: Consistent grid-gap values across breakpoints
- **Empty State Handling**: Full-width placeholder when no events exist

#### Individual Event Card (`EventCard`)
- **Card Structure**: CSS Grid with named areas (badge, illustration, content, action)
- **Badge Positioning**: Absolute positioning within relative card container
- **Illustration Area**: Fixed aspect-ratio container with background-image or img
- **Content Area**: Flexbox column for title, description, and metadata stacking
- **Action Area**: Full-width button with consistent bottom placement

#### Ongoing Sessions Component (`OngoingSessionsStrip`)
- **Container**: Horizontal flexbox with potential overflow scroll
- **Session Cards**: Flex items with flex-shrink prevention
- **Icon Integration**: Inline-flex for icon and text alignment
- **Badge Positioning**: Inline badge within content flow

#### Archive Section (`ArchiveSection`)
- **Collapsible Container**: CSS-based disclosure pattern or details/summary
- **List Layout**: Simple vertical flex or CSS Grid for archive items
- **Item Structure**: Horizontal flex for icon, title, and metadata alignment
- **Visual Hierarchy**: Reduced opacity and smaller typography scaling

### Cross-Component Styling Strategies

#### Badge System Architecture
- **Base Badge Class**: Common padding, border-radius, and typography styles
- **Modifier Classes**: Color variants using CSS custom properties
- **Positioning Context**: Absolute positioning within card boundaries
- **Size Variants**: Multiple badge sizes for different component contexts

#### Illustration Integration Approach
- **Container Standardization**: Consistent aspect-ratio containers across components
- **Loading States**: Background-color placeholders during image loading
- **Fallback Strategy**: Default illustration when custom illustration unavailable
- **Responsive Scaling**: Object-fit and object-position for various screen sizes

#### Button System Consistency
- **Primary Button Pattern**: Consistent styling for all RSVP buttons
- **Interactive States**: Hover, focus, and active state definitions
- **Loading States**: Button disabled state during RSVP interactions
- **Size Variants**: Button scaling for different component contexts

### Responsive Layout Coordination

#### Container Query Strategy
- **Card-Level Responsiveness**: Use container queries for individual card breakpoints
- **Grid Adaptation**: Auto-fit grid pattern that responds to container width
- **Typography Scaling**: Fluid typography using clamp() functions

#### Breakpoint Architecture
- **Mobile-First Approach**: Base styles for mobile, enhance for larger screens
- **Major Breakpoints**: Phone, tablet, desktop, wide-screen considerations
- **Component-Specific Breaks**: Some components may need custom breakpoints

#### Cross-Component State Management
- **Tab State Propagation**: Active tab affects content visibility across sections
- **Filter State Integration**: Search and filter states affect multiple grid components
- **Loading State Coordination**: Skeleton loading patterns across related components

### Animation & Interaction Coordination

#### Transition Strategy
- **Consistent Timing**: Unified transition duration and easing across components
- **State Change Animations**: Tab switching, card hover, and selection states
- **Layout Shift Prevention**: Maintain stable layouts during interactive changes

#### Performance Considerations
- **CSS-Only Animations**: Prefer CSS transitions over JavaScript animations
- **Hardware Acceleration**: Transform and opacity changes for smooth performance
- **Reduced Motion Support**: Respect user accessibility preferences

This architectural approach ensures that each component maintains its own styling responsibility while participating in a cohesive overall layout system. The CSS Grid and Flexbox combination provides the flexibility needed for the responsive design while maintaining clean separation of concerns between components.

## Implementation Touchpoints

### 1. New Components Needed
- **EventTabs.astro**: Tab navigation component
- **FeaturedEventHero.astro**: Large featured event display
- **EventTimeline.astro**: Two-week view component
- **OngoingSessionCard.astro**: Recurring event display
- **EventPageLayout.astro**: New layout for event page

### 2. Data Model Extensions
Consider adding to the event schema:
- **track**: enum ['build-nights', 'educational', 'interest-group', 'community', 'ongoing', 'archive']
- **interestGroup**: string (optional, for interest group events)
- **isOngoing**: boolean (for recurring events)
- **recurrence**: object { frequency: 'weekly'|'biweekly'|'monthly', dayOfWeek: string } (optional)
- **rsvpLink**: URL (specifically for Luma or other RSVP platforms)
- **illustration**: string (path to custom illustration)
- **badge**: enum ['policy', 'online', 'in-person', 'luma', 'hybrid']
- **isFeatured**: boolean (for homepage feature rotation)

### 3. Routing Strategy
Options:
1. **Replace current event page**: Update `/events/index.astro`
2. **Create new prototype route**: `/events/new` or `/events/prototype`
3. **Feature flag approach**: Toggle between old and new design

### 4. Styling Approach ✅ COMPLETED
- **Full DaisyUI Integration**: All components use DaisyUI design tokens and semantic classes
- **Minimal Custom CSS**: Only masonry layout CSS remains (unavoidable)
- **Theme Consistency**: All colors, shadows, and components inherit from site master theme
- **Design Token Benefits**: Easy site-wide theme changes via DaisyUI configuration

### 5. Image/Illustration Management ✅ COMPLETED
- **Unsplash Integration**: Using curated, themed placeholder images with claymorphic cute style
- **Optimized URLs**: All images use Unsplash's optimization parameters (w=400&h=300&fit=crop&auto=format&q=80)
- **Contextual Matching**: Each event has illustration matching its theme (farming, coding, networking, etc.)

### 6. Interactive Features ✅ COMPLETED
- **Tab Filtering**: Dynamic JavaScript filtering that properly recalculates masonry layout
- **Flexible CTAs**: Conditional call-to-action system supporting Luma, custom URLs, or no CTA
- **Masonry Layout**: CSS columns-based responsive grid (1→2→3 columns)
- **Real Data Integration**: Events sourced from Luma, Meetup, and actual organizations

## IMPLEMENTED: Real Event Data ✅

### Current Live Events (6 total events across all tracks)

#### Featured Event
- **Fall 2025 General Meetings** - "Hello CCSF!" tagline, recurring weekly meetings
- CTA: Custom URL to club poster (https://ccsf-cs.club/events/headline/)

#### All Events Distribution
1. **AWS AI Hack Day Micro Conference** (Hackathons track)
   - Source: lu.ma/aws-08-22-25 
   - Aug 22, 2025 at AWS GenAI Loft
   - RSVP: Luma integration

2. **SF Civic Tech Weekly Hack Night** (Community track)  
   - Source: sfcivictech.org + meetup.com/sfcivictech
   - Every Wednesday 6:30 PM (virtual)
   - CTA: Join Meetup

3. **Forage and Draw** (Community track)
   - Source: lu.ma/ue3hbx79
   - Sep 7, 2025 at Golden Gate Park
   - RSVP: Luma integration

4. **Work on Our Site with Us** (Build Together track)
   - Source: github.com/ccsf-cs-club/ccsf-cs-club
   - Ongoing Discord-based collaboration
   - CTA: View GitHub Repo

5. **Alemany Farm Volunteering** (Community track)
   - Source: alemanyfarm.org/get-involved/
   - Saturdays 1-5 PM recurring
   - CTA: Learn More

### Track Distribution
- **All Events**: 5 events total
- **Hackathons**: 1 event (AWS AI Hack Day)  
- **Build Together**: 1 event (Work on Our Site)
- **Community**: 3+ events (SF Civic Tech, Forage & Draw, Alemany Farm + Ongoing Sessions)

### Call-to-Action System Implementation
```typescript
interface CallToAction {
  luma_url?: string;           // For Luma RSVP links
  custom_url?: string;         // For custom URLs  
  custom_label?: string;       // Custom button text
  type?: 'luma' | 'custom' | 'none';  // Controls behavior
}
```

## ~~Recommended~~ COMPLETED Implementation Steps ✅

### ~~Phase 1: Foundation~~ ✅ COMPLETED
1. ✅ Created EventTabs.astro, FeaturedEventHero.astro, EventCardBeta.astro, OngoingSessionCard.astro, ArchiveSection.astro
2. ✅ Set up `/events_beta.astro` route 
3. ✅ Implemented full page layout structure with DaisyUI

### ~~Phase 2: Core Features~~ ✅ COMPLETED  
1. ✅ Built tab navigation with dynamic filtering and masonry recalculation
2. ✅ Implemented featured event hero section with flexible CTA system
3. ✅ Created responsive masonry grid layout
4. ✅ Added ongoing sessions display

### ~~Phase 3: Data Integration~~ ✅ COMPLETED
1. ✅ Implemented flexible call-to-action object structure
2. ✅ Integrated 5 real events from external sources (Luma, Meetup, GitHub, etc.)
3. ✅ Connected components with proper track-based filtering

### ~~Phase 4: Polish~~ ✅ COMPLETED
1. ✅ Added hover transitions and DaisyUI animations
2. ✅ Implemented fully responsive design (mobile→tablet→desktop)
3. ✅ Optimized images with Unsplash parameters and lazy loading
4. ✅ Added keyboard navigation and accessibility features

## Technical Considerations

### Performance
- Use Astro's built-in image optimization
- Implement lazy loading for event images
- Consider pagination for archive section

### Accessibility
- Ensure tab navigation is keyboard accessible
- Add proper ARIA labels
- Maintain color contrast ratios

### Responsive Design
- Mobile-first approach
- Collapsible tabs on mobile
- Stack event cards vertically on small screens

### Browser Compatibility
- Test with modern browsers
- Ensure graceful degradation
- Consider progressive enhancement

## Event Track System

### Track Definitions
Based on design requirements, events will be organized into the following tracks:

1. **Build Nights**
   - Regular programming sessions
   - Project collaboration events
   - Pair programming meetups
   - Code reviews and workshops

2. **Educational Events/Talks**
   - Technical workshops
   - Speaker series
   - Industry panels
   - Skill-building sessions
   - Conference presentations

3. **Interest Groups** (Rotating)
   - AI/ML meetups
   - Web development
   - Game development
   - Systems programming
   - Open source contributions
   - Competitive programming

4. **Community Events**
   - Social gatherings
   - Networking events
   - Club celebrations
   - Volunteer activities
   - Park cleanups

5. **Ongoing Events**
   - Weekly coding sessions
   - Regular study groups
   - Recurring workshops
   - Office hours

6. **Archive Samples**
   - Featured past events
   - Historical highlights
   - Success stories
   - Notable achievements

### Mapping to Tab Navigation
- **All Events**: Aggregated view of all tracks
- **Build Together**: Build Nights + relevant Interest Groups
- **Hackathons**: Competition events + hackathon prep
- **Community**: Community Events + Ongoing Events

## Questions for Design Review

1. ~~**Tab Content**: What specific events should appear under each tab?~~ ✓ Answered above
2. **RSVP Integration**: Should we integrate directly with Luma API or just link out?
3. **Date Filtering**: Should the "Next 2 Weeks" be dynamic or fixed?
4. **Archive Organization**: How should archived events be organized (by date, type, etc.)?
5. **Search/Filter**: Should we add search functionality within tabs?
6. **Event Details**: Should clicking an event card lead to a detail page or modal?
7. **Interest Group Rotation**: How often do interest groups rotate? How is the active group selected?

## Next Steps

1. Review this specification with the team
2. Finalize design decisions
3. Create component mockups
4. Begin implementation following the phased approach
5. Set up A/B testing between old and new designs

## Dependencies

- No new npm packages required initially
- May consider adding:
  - Date formatting library (if needed)
  - Animation library for transitions
  - Calendar component library (if current one insufficient)

## Risk Assessment

- **Low Risk**: Using existing tech stack
- **Medium Risk**: Data model changes may affect existing content
- **Mitigation**: Create prototype in parallel, don't modify production initially