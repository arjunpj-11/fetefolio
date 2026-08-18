# Frontend and UI Standards

## Product language

The public product is a literal event programme: ticket stubs, perforations, numbered references and circular confirmation stamps. The provider area becomes a dark call sheet with compact mono labels and high-density tables. This is a purposeful role contrast, not a generic dark-mode switch.

## Responsive behavior

- Desktop: two-column filters/catalog, horizontal ticket cards and fixed provider navigation.
- Tablet: compact cards, slide-in filters and a single-column service detail.
- Mobile: image-first tickets with horizontal stubs, bottom-sheet dialogs, card-form call-sheet rows, collapsed navigation and single-column forms.
- Breakpoints are content-driven at 1050, 820 and 600 pixels.

## Accessibility

Semantic landmarks, labels, table headers, status text, keyboard focus rings, Escape-to-close dialogs and a skip link are included. Color is never the only status signal. Motion is disabled when `prefers-reduced-motion` is set. Touch controls keep practical hit areas.

## State and network behavior

The Axios interceptor reads the latest JWT directly from Zustand and clears stale sessions on `401`. TanStack Query caches lists/details and invalidates affected data after mutations. Server errors are translated into user-facing feedback without exposing internal details.
