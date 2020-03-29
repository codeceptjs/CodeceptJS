module.exports.createValueEngine = () => {
  return {
    name: '__value',
    // Creates a selector that matches given target when queried at the root.
    // Can return undefined if unable to create one.
    create(root, target) {
      return null;
    },

    // Returns the first element matching given selector in the root's subtree.
    query(root, selector) {
      if (!root) {
        return null;
      }
      return `${root.value}`.includes(selector) ? root : null;
    },

    // Returns all elements matching given selector in the root's subtree.
    queryAll(root, selector) {
      if (!root) {
        return null;
      }
      return `${root.value}`.includes(selector) ? root : null;
    },
  };
};
