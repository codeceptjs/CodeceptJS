let history = {};
let lastPageObject;
const merge = require('deepmerge');

const insertHistory = (chain) => {
  const unflatten = (arr) => {
    const tree = [];
    const mappedArr = {};
    let arrElem;
    let mappedElem;

    // First map the nodes of the array to an object -> create a hash table.
    for (let i = 0, len = arr.length; i < len; i++) {
      arrElem = arr[i];
      mappedArr[arrElem.id] = arrElem;
      mappedArr[arrElem.id].children = {};
    }

    lastPageObject = arr.slice(0, arr.length - 1);


    for (const id in mappedArr) {
      // eslint-disable-next-line no-prototype-builtins
      if (mappedArr.hasOwnProperty(id)) {
        mappedElem = mappedArr[id];
        // If the element is not at the root level, add it to its parent array of children.
        if (mappedElem.parentid) {
          mappedArr[mappedElem.parentid].children[mappedElem.id] = mappedElem;
        } else {
          // If the element is at the root level, add it to first level elements array.
          tree.push(mappedElem);
        }
      }
    }
    return tree;
  };

  const insert = {};
  const insertTree = unflatten(chain)[0];

  insert[insertTree.id] = insertTree;

  history = merge(history, insert);
};

const getHistory = () => {
  return history;
};

const getLastPageObject = () => {
  return lastPageObject;
};

const clean = () => {
  history = {};
  lastPageObject = undefined;
};


module.exports = {
  insertHistory,
  getHistory,
  getLastPageObject,
};
