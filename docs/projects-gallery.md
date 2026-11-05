# Works gallery and homepage navigation

The 2026-11-05 redesign replaces the repeated alternating project spreads with the exhibition direction chosen in the earlier layout study. The current request also includes making the homepage's navigation visible and understandable. It supersedes the earlier draft's exclusion of homepage changes.

## Homepage entry

- Four visible destinations use Chinese labels, icons and readable contrast: 作品、艺术、研究、联系.
- The works link has a distinct background, border and work count. Desktop places the navigation below the wordmark; smaller screens use a persistent bottom bar.
- The chat input reserves space above the bottom navigation. Short viewports reduce the portrait size.

## Gallery structure

- A cover introduces the work with actual project previews and two explicit actions: start the exhibition or open the directory.
- Ten existing works retain their descriptions, screenshots, device frames and external URLs. The five rooms remain 上线、命理、玩具、雨夜、空间.
- Desktop uses normal vertical scrolling to move along a horizontal exhibition. Chapter walls, a continuous floor and a warm paper pinboard for the two toys distinguish the sections.
- The directory shows all ten works and jumps directly to the selected exhibit. Chapter controls and previous/next buttons provide alternatives to scrolling.
- Phones, short screens and visitors requesting reduced motion use native vertical scrolling. The chapter controls and directory remain available.

## Navigation and accessibility

- Existing `/projects#<id>` URLs remain valid, including links from chat and same-document hash changes. Unknown hashes and `personal-site` open the cover.
- URL anchors are resolved through `data-anchor`; DOM ids have a `gallery-` prefix so native fragment scrolling cannot independently move the clipped horizontal stage.
- Keyboard focus on an offscreen work brings that work into view. The native directory dialog supports Escape, focus containment and focus return.
- Horizontal movement updates in a scheduled animation frame after scroll events. It does not intercept wheel or touch gestures, and no animation loop runs while idle.
- The gallery has semantic sections and articles, visible focus styles, descriptive navigation labels and a skip link. Reduced motion uses the vertical layout without transitions.

## Scope

No chat API, production credentials, live agent prompt, database schema or project tool data changes are part of this redesign. Existing artwork and contact routes retain their behavior. The earlier untracked exhibition study remains separate.
