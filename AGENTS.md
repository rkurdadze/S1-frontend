# AGENT Instructions for Studio101 Frontend

## Overview
This repository contains an Angular 18 frontend application (CLI 18.2.x) with supporting SSR stubs, shared UI components, pages, and lightweight data models/services. The project is organized to keep UI composition, data contracts, and utility helpers separated for clarity.

### Directory layout (depth trimmed to app sources)
- `angular.json`, `package.json`, `tsconfig*.json`: Angular workspace configuration, build/tsconfig profiles, and scripts.
- `public/`: Static assets (favicons, OAuth verification file, privacy policy) plus `assets/` with UI images and icons.
- `ssr_backup/`: Legacy server-side rendering entry points (`main.server.ts`, `server.ts`, `app.config.server.ts`).
- `src/`
  - `main.ts`, `app.config.ts`, `app.routes.ts`: Angular bootstrap, standalone configuration, and route definitions.
  - `app/`
    - `app.component.*`: Root shell markup/styles/logic.
    - `pages/`: Page-level components (`login`, `item-page`, `outwear`).
    - `common-ui/`: Reusable UI widgets such as `banner`, `layout`, `loading`, `item-card`, `edit-modal`, `item-images-carousel`, `item-visual-panel`, `item-meta-panel`, `item-colors`, `item-sizes`, `item-suggestion-rail`, `color-picker`, `login-button`, and `header`.
    - `data/`
      - `interfaces/`: Data contracts for items, colors, sizes, inventories, and photos.
      - `services/`: Client-side services for authentication (`google-auth.service.ts`), CRUD interactions (`inventory.service.ts`, `item.service.ts`, `size.service.ts`, `photo.service.ts`), events (`event.service.ts`), and loading states (`loader.service.ts`).
    - `helpers/`: Utility helpers (`ItemHelpers.ts`, `color-transform.pipe.ts`).
  - `styles.scss`, `index.html`: Global styles and SPA host document.

### Data schema
- **Item (`data/interfaces/item.interface.ts`)**: `{ id?: number; name: string; description: string; publish: boolean; colors: Color[]; }`.
- **Color (`data/interfaces/color.interface.ts`)**: `{ id: number; name: string; photoIds: number[]; inventories: Inventories[]; item_id?: number; }`.
- **Inventories (`data/interfaces/inventories.interface.ts`)**: `{ id: number; stockCount: number; size: Size; colorId: number; }`.
- **Size (`data/interfaces/size.interface.ts`)**: `{ id: number; name: string; inventory: number; }`.
- **Photo (`data/interfaces/photo.interface.ts`)**: `{ id?: number; name: string; image: string; colorId?: number; colorName?: string; }` (IDs and color links are optional, image is a Base64/URL string).

### Agent requirements
1. Before delivering any final answer, run the full unit test suite via `npm test -- --watch=false --browsers=ChromeHeadless` and report results.
2. Maintain the established directory separation (pages vs common-ui vs data vs helpers) when adding files.
3. Keep schemas in `src/app/data/interfaces/` authoritative; update documentation and dependent services if schema changes.
4. Summaries or PR notes should reference relevant file paths to help future contributors navigate quickly. 
5. If any changes are needed for the backend - generate AI prompt optimized for codex/gemini, describing all requirement and changes made.
