# Works gallery and homepage navigation

The 2026-11-05 redesign replaces the repeated alternating project spreads with the exhibition direction chosen in the earlier layout study. The current request also includes making the homepage's navigation visible and understandable. It supersedes the earlier draft's exclusion of homepage changes.

## Homepage entry

- Four visible destinations use Chinese labels, icons and readable contrast: 作品、艺术、研究、联系.
- The works link has a distinct background, border and work count. Desktop places the navigation below the wordmark; smaller screens use a persistent bottom bar.
- The chat input reserves space above the bottom navigation. Short viewports reduce the portrait size.

## Gallery structure

- A cover introduces the work with actual project previews and two explicit actions: start the exhibition or open the directory.
- Ten existing works retain their descriptions, screenshots, device frames and external URLs. The five rooms remain 上线、命理、玩具、雨夜、空间.
- Every viewport uses native vertical document scrolling. Chapter walls, oversized room numbers and a warm paper pinboard for the two toys distinguish the sections.
- The directory shows all ten works and jumps directly to the selected exhibit. Chapter controls provide direct jumps alongside scrolling.
- Desktop and phone layouts share the same vertical flow. The chapter controls and directory remain available; reduced motion disables visual transitions.

## Navigation and accessibility

- Existing `/projects#<id>` URLs remain valid, including links from chat and same-document hash changes. Unknown hashes and `personal-site` open the cover.
- Work ids are real document anchors. Existing hash links align below the fixed header, including same-document navigation; a late font load does not reset scrolling after a user gesture.
- Keyboard focus and PageDown use normal browser scrolling. The native directory dialog supports Escape, focus containment and focus return.
- Scroll observation updates only the chapter highlight and ambient color. It does not translate the content, create an artificial page height, or capture wheel/touch gestures.
- The gallery has semantic sections and articles, visible focus styles, descriptive navigation labels and a skip link. Reduced motion uses the vertical layout without transitions.

## Scope

No chat API, production credentials, live agent prompt, database schema or project tool data changes are part of this redesign. Existing artwork and contact routes retain their behavior. The earlier untracked exhibition study remains separate.

## 2026-11-05 scrolling correction

The initial desktop exhibition mapped an inner vertical scroller to horizontal movement. A horizontal swipe did not advance the work, and the document itself remained one viewport tall. Following the reported scrolling problem, this behavior was removed. The page now scrolls with the document on every screen, while retaining the cover, five chapters, directory and toy pinboard.
