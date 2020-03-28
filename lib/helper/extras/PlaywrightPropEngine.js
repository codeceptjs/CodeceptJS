module.exports.createValueEngine = () => {
  return {
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
      return `${root.value}` === selector;
    },

    // Returns all elements matching given selector in the root's subtree.
    queryAll(root, selector) {
      if (!root) {
        return null;
      }
      return `${root.value}` === selector;
    },
  };
};
