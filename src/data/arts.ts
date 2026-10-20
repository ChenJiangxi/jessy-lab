/**
 * Anchor ids on /arts and the titles they carry. The chat turns
 * `/arts#<id>` into a link labelled with the title, and the /arts page
 * uses the same ids as element ids so the link scrolls to the piece.
 */
export const ART_ANCHORS: Record<string, string> = {
  pour: '倾倒之粉',
  fire: '火与烬',
  workshop: '工坊地面',
  decadent: '衰败的生',
  picasso: '致毕加索',
  sculpture: '漩涡之心',
  cats: '三联·猫',
};
