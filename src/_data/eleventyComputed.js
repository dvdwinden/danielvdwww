// ============================================================================
// COMPUTED DATA
//
// Values derived from a page rather than written in its frontmatter, available
// to every template as ordinary globals.
// ============================================================================

module.exports = {
  // Is this page a piece of writing, as opposed to a standing page?
  //
  // Three templates need to agree on the answer and would otherwise each carry
  // their own copy of the rule: webmentions.njk renders mentions only under
  // writing, and base.njk and narrow.njk wrap only writing in an h-entry. A
  // post is a post because of where it lives, so the directory is the test —
  // /links/, /journal/ and /newsletter/, and not the homepage, /photos/,
  // /now/, /library/ or the tag pages.
  isPost: (data) => {
    const stem = data.page.filePathStem || '';
    return (
      stem.startsWith('/links/') ||
      stem.startsWith('/journal/') ||
      stem.startsWith('/newsletter/')
    );
  },
};
