# Works gallery and homepage navigation

The 2026-11-05 redesign replaces the repeated alternating project spreads with the exhibition direction chosen in the earlier layout study. The current request also includes making the homepage's navigation visible and understandable. It supersedes the earlier draft's exclusion of homepage changes.

## Homepage entry

- Four visible destinations use Chinese labels, icons and readable contrast: 作品、艺术、研究、联系.
- The works link has a distinct background, border and work count. Desktop places the navigation below the wordmark; smaller screens use a persistent bottom bar.
- The chat input reserves space above the bottom navigation. Short viewports reduce the portrait size.

## Gallery structure

- A cover introduces the work with actual project previews and two explicit actions: start the exhibition or open the directory.
- Ten existing works retain their descriptions, screenshots, device frames and external URLs. The five rooms remain 上线、命理、玩具、雨夜、空间.
- Every viewport uses native horizontal scrolling: visitors swipe left/right, use a horizontal trackpad gesture, or drag with the mouse. Chapter walls, oversized room numbers and a warm paper pinboard for the two toys distinguish the sections.
- The directory shows all ten works and jumps directly to the selected exhibit. Chapter controls, previous/next buttons and the directory provide direct jumps alongside swiping.
- Desktop and phone layouts share the same horizontal exhibition. Long exhibits can scroll vertically inside their own panel so their full descriptions remain readable. Reduced motion keeps horizontal browsing and makes programmatic jumps immediate.

## Navigation and accessibility

- Existing `/projects#<id>` URLs remain valid, including links from chat and same-document hash changes. Unknown hashes and `personal-site` open the cover.
- URL work ids resolve to matching data-anchor targets in the horizontal scroller. DOM ids use a gallery prefix to prevent native fragment handling from competing with centered jumps. Hashes and repeated route selections both work; late fonts cannot reset a visitor's gesture.
- Left/right arrow keys move between exhibits; Home and End reach the cover and exit. Native focus scrolling and focus alignment bring offscreen links into view. The native directory dialog supports Escape, focus containment and focus return.
- The real scrollLeft is the exhibition position. No translated track or artificial vertical page height is used. Native horizontal wheel/touch scrolling remains browser-owned; pointer capture adds mouse dragging with a movement threshold and suppresses accidental clicks after a drag.
- The gallery has semantic sections and articles, visible focus styles, descriptive navigation labels and a skip link. Reduced motion preserves the requested horizontal direction without animated jumps.

## Scope

No chat API, production credentials, live agent prompt, database schema or project tool data changes are part of this redesign. Existing artwork and contact routes retain their behavior. The earlier untracked exhibition study remains separate.

## Horizontal input

- Phone swipes in both directions move the native horizontal scroller.
- Horizontal trackpad/wheel input uses the browser's normal scrolling. Pointer capture adds mouse dragging without changing touch handling; a movement threshold prevents accidental link activation after a drag.
- Left/right buttons and arrow keys select adjacent stops. Home and End reach the cover and exit. Browser modifier shortcuts remain available.
- Each exhibit can scroll vertically when its full copy does not fit. Its horizontal overflow is hidden so decorative images cannot consume the horizontal gesture before it reaches the gallery.
- The directory scrolls vertically and keeps the background gallery still while open.
- All screen widths retain horizontal browsing, including reduced-motion mode.
