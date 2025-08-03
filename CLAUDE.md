# CLAUDE.md

## Development Commands

This project uses pnpm as the package manager and Astro as the framework.

### Development
```bash
pnpm run dev      # Start development server
pnpm run build    # Build for production
pnpm run preview  # Preview production build
```

## Architecture Overview

### Framework Stack
- **Astro 5** with React integration for SSG (Static Site Generation)
- **React 19** for interactive components
- **Tailwind CSS 4** with custom design system
- **TypeScript** for type safety
- **Shadcn UI** components for accessible UI primitives

### Data Sources
The project depends on two Git submodules that provide the content:
- `/support-matrix` - Contains board specifications and OS compatibility data
- `/packages-index` - Contains device vendor information

Data is imported at build time using Vite's `import.meta.glob()` for static content processing.

### Internationalization
- Supports English (`en`) and Chinese (`zh-CN`) with Astro's built-in i18n
- Translation utilities in `src/i18n/utils.ts` with type-safe translation keys
- Route structure: `/` (English) and `/zh-CN/` (Chinese)

### Core Data Architecture

**Data Processing Flow:**
`src/lib/data.ts` implements a three-phase data loading architecture:

1. **Raw Data Collection Phase:**
   - Board metadata from `/support-matrix/*/README.md` files
   - Test reports from `/support-matrix/[board]/[system]/[file].md` files
   - Additional system data from `/support-matrix/[board]/others.yml` files
   - System display names from `/support-matrix/assets/metadata.yml`

2. **Processing & Validation Phase:**
   - Data validation and consistency checking
   - Aggregation into Board and System views
   - Type-safe conversion to `ReportMetaData` interface

3. **Statistics & Indexing Phase:**
   - Pre-computed site-wide statistics (board counts, status distribution, etc.)
   - Build-time optimization for runtime performance

**Core Data Interfaces:**
- `BoardMetaData` - Board specifications (vendor, CPU, RAM, etc.)
- `ReportMetaData` - Test report data with source tracking
- `Board` - Board with associated system reports grouped by system ID
- `System` - System with all reports across boards
- `SiteData` - Complete site data with statistics and indexes

**System Metadata:**
- System display names loaded from `/support-matrix/assets/metadata.yml`
- Categorized by Linux, BSD, RTOS, Others, and Customized systems
- Flat lookup structure for O(1) name resolution

**Report Status Types:** `GOOD`, `BASIC`, `CFH`, `CFT`, `WIP`, `CFI`

**Device Vendor Detection:**
- `src/lib/package-index.ts` imports `/packages-index/entities/device/*.toml` files
- Used for "sort.ruyi" functionality to prioritize RuyiSDK-supported vendors

### Component Structure

**Layout Components:**
- `Header.tsx` - Main navigation (React component, was recently converted from Astro)
- `Footer.astro` - Site footer (Astro component)

**Page Components:**
- `Overview.tsx` - Main board/system card with filtering and sorting (uses useMemo for performance)
- `DataTable.tsx` - Compatibility matrix table using TanStack Table
- `Matrix.tsx` - Support status visualization

**UI Components:**
- Shadcn/ui components in `src/components/ui/`
- `ModeToggle.tsx` and `LangToggle.tsx` for theme and language switching

### Routing Structure
```
/                           # English board overview
/table/                     # Compatibility table
/reports/                   # Report listings
/boards/[board]            # Individual board pages
/systems/[system]          # Individual system pages
/reports/[board]-[system]-[file]  # Individual reports

/zh-CN/*                   # Chinese versions of all above routes
```


### Build-time Content Processing
All markdown content is processed at build time, not runtime. The app is fully static after build, with no server-side data fetching. Content updates require rebuilding the site with updated submodules.

## Data Access Best Practices

### Performance Optimization
The data loading system uses a caching mechanism to ensure optimal performance:

- **Single Load**: `getSiteData()` loads data only once per application lifecycle
- **Memory Cache**: Subsequent calls return cached data instantly
- **Static Optimization**: All data processing happens at build time

### Data Extraction Utilities
For performance, extract only needed data subsets:

```typescript
// Extract specific vendor boards
const vendorBoards = Array.from(siteData.boards.values())
  .filter(board => board.meta.vendor === 'Sipeed');

// Get system statistics
const systemStats = siteData.systems.get('ubuntu')?.reports.length || 0;

// Access pre-computed statistics
const { totalBoards, statusCounts } = siteData.statistics;
```

### Development Debugging
In development mode, debugging tools are available:

```javascript
// Browser console commands
__verforte_debug.getDataLoadingStats() // Check cache status
__verforte_debug.clearDataCache()      // Clear cache for testing
__verforte_debug.getSiteData()         // Access cached data
```

## UI/UX Guidelines

### Design Principles
This project follows a Linear-inspired design approach with clean, professional aesthetics optimized for technical content display and cross-device compatibility.

### Color System
Based on `src/styles/global.css`, the design uses a sophisticated dual-theme color palette:

**Light Theme:**
- **Primary Blue:** `oklch(0.3176 0.0981 253.0501)` - RISC-V brand blue for primary actions and emphasis
- **Secondary Yellow:** `oklch(0.8197 0.167 79.1074)` - RISC-V brand yellow for secondary elements
- **Background:** Pure white `oklch(1 0 0)` for maximum readability
- **Foreground:** Dark gray `oklch(0.3867 0 0)` for primary text

**Dark Theme:**
- **Background:** Deep blue `oklch(0.2376 0.0753 254.7889)` maintaining brand connection
- **Primary Yellow:** `oklch(0.8197 0.167 79.1074)` - Enhanced yellow for dark mode prominence
- **Card/Surface:** Blue-tinted surfaces for depth and visual hierarchy

### Visual Hierarchy
- **Multi-layered Grayscale:** Use muted (`oklch(0.9702 0 0)` light / `oklch(0.3176 0.0981 253.0501)` dark) and accent colors for content organization
- **Depth Through Shadows:** Utilize the predefined shadow scale (`--shadow-xs` to `--shadow-2xl`) for component elevation
- **Consistent Spacing:** Base spacing of `0.25rem` with systematic scaling

### Typography
- **Primary Font:** Open Sans for optimal readability across technical documentation
- **Letter Spacing:** Neutral tracking (`--tracking-normal: 0rem`) with tighter/wider variants available
- **Font Hierarchy:** Sans-serif for UI, mono for code, serif for special emphasis

### Interactive Elements
- **Focus States:** Ring color matches primary brand blue with 50% opacity
- **Border Radius:** Consistent `0.4rem` radius with sm/md/lg/xl variants
- **Accent Colors:** Reserve RISC-V blue and yellow for interactive elements, CTAs, and user guidance

### Accessibility Standards
- **High Contrast:** All color combinations meet WCAG AA standards
- **Focus Indicators:** Clear ring outlines on interactive elements
- **Semantic Color Usage:** Destructive actions use red (`oklch(0.551 0.227 353.8943)`), success uses chart colors

### Component Guidelines
- **Cards:** Use card background with subtle borders for content grouping
- **Sidebars:** Dedicated sidebar color scheme for navigation hierarchy
- **Charts/Data:** Five-color chart palette for data visualization consistency
- **Responsive Design:** Mobile-first approach with touch-friendly interaction areas

