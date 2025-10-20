const { parse, serialize } = require('parse5');
const { minify } = require('html-minifier-terser');

async function minifyHtml(html) {
  return minify(html, {
    collapseWhitespace: true,
    removeComments: true,
    removeEmptyAttributes: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    collapseBooleanAttributes: true,
    useShortDoctype: true,
  });
}

const defaultHtmlOpts = {
  interactiveElements: ['a', 'input', 'button', 'select', 'textarea', 'option'],
  textElements: ['label', 'h1', 'h2'],
  allowedAttrs: ['id', 'for', 'class', 'name', 'type', 'value', 'tabindex', 'aria-labelledby', 'aria-label', 'label', 'placeholder', 'title', 'alt', 'src', 'role'],
  allowedRoles: ['button', 'checkbox', 'search', 'textbox', 'tab'],
};

function removeNonInteractiveElements(html, opts = {}) {
  opts = { ...defaultHtmlOpts, ...opts };
  const {
    interactiveElements,
    textElements,
    allowedAttrs,
    allowedRoles,
  } = opts;

  // Parse the HTML into a document tree
  const document = parse(html);

  const trashHtmlClasses = /^(text-|color-|flex-|float-|v-|ember-|d-|border-)/;
  // Array to store interactive elements
  const removeElements = ['path', 'script'];

  function isFilteredOut(node) {
    if (removeElements.includes(node.nodeName)) return true;
    if (node.attrs) {
      if (node.attrs.find(attr => attr.name === 'role' && attr.value === 'tooltip')) return true;
    }
    return false;
  }

  // Function to check if an element is interactive
  function isInteractive(element) {
    if (element.nodeName === 'input' && element.attrs.find(attr => attr.name === 'type' && attr.value === 'hidden')) return false;
    if (interactiveElements.includes(element.nodeName)) return true;
    if (element.attrs) {
      if (element.attrs.find(attr => attr.name === 'contenteditable')) return true;
      if (element.attrs.find(attr => attr.name === 'tabindex')) return true;
      const role = element.attrs.find(attr => attr.name === 'role');
      if (role && allowedRoles.includes(role.value)) return true;
    }
    return false;
  }

  function hasMeaningfulText(node) {
    if (textElements.includes(node.nodeName)) return true;
    return false;
  }

  function hasInteractiveDescendant(node) {
    if (!node.childNodes) return false;
    let result = false;

    for (const childNode of node.childNodes) {
      if (isInteractive(childNode) || hasMeaningfulText(childNode)) return true;
      result = result || hasInteractiveDescendant(childNode);
    }

    return result;
  }

  // Function to remove non-interactive elements recursively
  function removeNonInteractive(node) {
    if (node.nodeName !== '#document') {
      const parent = node.parentNode;
      const index = parent.childNodes.indexOf(node);

      if (isFilteredOut(node)) {
        parent.childNodes.splice(index, 1);
        return true;
      }

      // keep texts for interactive elements
      if ((isInteractive(parent) || hasMeaningfulText(parent)) && node.nodeName === '#text') {
        node.value = node.value.trim().slice(0, 200);
        if (!node.value) return false;
        return true;
      }

      if (
        // if parent is interactive, we may need child element to match
        !isInteractive(parent)
        && !isInteractive(node)
        && !hasInteractiveDescendant(node)
        && !hasMeaningfulText(node)) {
        parent.childNodes.splice(index, 1);
        return true;
      }
    }

    if (node.attrs) {
      // Filter and keep allowed attributes, accessibility attributes
      node.attrs = node.attrs.filter(attr => {
        const { name, value } = attr;
        if (name === 'class') {
          // Remove classes containing digits
          attr.value = value.split(' ')
            // remove classes containing digits/
            .filter(className => !/\d/.test(className))
            // remove popular trash classes
            .filter(className => !className.match(trashHtmlClasses))
            // remove classes with : and __ in them
            .filter(className => !className.match(/(:|__)/))
            .join(' ');
        }

        return allowedAttrs.includes(name);
      });
    }

    if (node.childNodes) {
      for (let i = node.childNodes.length - 1; i >= 0; i--) {
        const childNode = node.childNodes[i];
        removeNonInteractive(childNode);
      }
    }
    return false;
  }

  // Remove non-interactive elements starting from the root element
  removeNonInteractive(document);

  // Serialize the modified document tree back to HTML
  const serializedHTML = serialize(document);

  return serializedHTML;
}

function scanForErrorMessages(html, errorClasses = []) {
  // Parse the HTML into a document tree
  const document = parse(html);

  // Array to store error messages
  const errorMessages = [];

  // Function to recursively scan for error classes and messages
  function scanErrors(node) {
    if (node.attrs) {
      const classAttr = node.attrs.find(attr => attr.name === 'class');
      if (classAttr && classAttr.value) {
        const classNameChunks = classAttr.value.split(' ');
        const errorClassFound = errorClasses.some(errorClass => classNameChunks.includes(errorClass));
        if (errorClassFound && node.childNodes) {
          const errorMessage = sanitizeTextContent(node);
          errorMessages.push(errorMessage);
        }
      }
    }

    if (node.childNodes) {
      for (const childNode of node.childNodes) {
        scanErrors(childNode);
      }
    }
  }

  // Start scanning for error classes and messages from the root element
  scanErrors(document);

  return errorMessages;
}

function sanitizeTextContent(node) {
  if (node.nodeName === '#text') {
    return node.value.trim();
  }

  let sanitizedText = '';

  if (node.childNodes) {
    for (const childNode of node.childNodes) {
      sanitizedText += sanitizeTextContent(childNode);
    }
  }

  return sanitizedText;
}

function buildPath(node, path = '') {
  const tag = node.nodeName;
  let attributes = '';

  if (node.attrs) {
    attributes = node.attrs
      .map(attr => `${attr.name}="${attr.value}"`)
      .join(' ');
  }

  if (!tag.startsWith('#') && tag !== 'body' && tag !== 'html') {
    path += `<${node.nodeName}${node.attrs ? ` ${attributes}` : ''}>`;
  }

  if (!node.childNodes) return path;

  const children = node.childNodes.filter(child => !child.nodeName.startsWith('#'));

  if (children.length) {
    return buildPath(children[children.length - 1], path);
  }
  return path;
}

function splitByChunks(text, chunkSize) {
  chunkSize -= 20;
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }

  const regex = /<\s*\w+(?:\s+\w+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^>\s]+)))*\s*$/;

  // append tag to chunk if it was split out
  for (const index in chunks) {
    const nextIndex = parseInt(index, 10) + 1;
    if (!chunks[nextIndex]) break;

    const currentChunk = chunks[index];
    const nextChunk = chunks[nextIndex];

    const lastTag = currentChunk.match(regex);
    if (lastTag) {
      chunks[nextIndex] = lastTag[0] + nextChunk;
    }

    const path = buildPath(parse(currentChunk));
    if (path) {
      chunks[nextIndex] = path + chunks[nextIndex];
    }

    if (chunks[nextIndex].includes('<html')) continue;
    chunks[nextIndex] = `<html><body>${chunks[nextIndex]}</body></html>`;
  }

  return chunks.map(chunk => chunk.trim());
}

module.exports = {
  scanForErrorMessages,
  removeNonInteractiveElements,
  splitByChunks,
  minifyHtml,
};
