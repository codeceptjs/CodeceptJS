const { parse, serialize } = require('parse5');
const { minify } = require('html-minifier');

// Function to check if an element has the role="tooltip" attribute

function interactiveHTML(html) {
  const cleanedHTML = removeNonInteractiveElements(html);
  return minify(cleanedHTML, {
    collapseWhitespace: true,
    removeComments: true,
    removeEmptyAttributes: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    collapseBooleanAttributes: true,
    useShortDoctype: true,
  }).toString();
}

function removeNonInteractiveElements(html) {
  // Parse the HTML into a document tree
  const document = parse(html);

  // Array to store interactive elements
  const interactiveElements = ['a', 'input', 'button', 'select', 'textarea'];
  const allowedAttrs = ['id', 'class', 'name', 'type', 'value', 'aria-labelledby', 'aria-label', 'label', 'placeholder', 'title', 'alt', 'src', 'href', 'role'];
  const allowedRoles = ['button', 'checkbox', 'search', 'textbox', 'tab'];

  function isFilteredOut(node) {
    if (node.attrs) {
      if (node.attrs.find(attr => attr.name === 'role' && attr.value === 'tooltip')) return true;
    }
    return false;
  }

  // Function to check if an element is interactive
  function isInteractive(element) {
    if (interactiveElements.includes(element.nodeName)) return true;
    if (element.attrs) {
      if (element.attrs.find(attr => attr.name === 'contenteditable')) return true;
      const role = element.attrs.find(attr => attr.name === 'role');
      if (role && allowedRoles.includes(role.value)) return true;
    }
    return false;
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

      const hasInteractiveDescendant = node.childNodes && node.childNodes.some(child => isInteractive(child) || removeNonInteractive(child));
      if (!hasInteractiveDescendant && !isInteractive(node)) {
        parent.childNodes.splice(index, 1);
        return true;
      }
    }

    if (node.attrs) {
      // Filter and keep allowed attributes, accessibility attributes, and attributes with data- prefix
      node.attrs = node.attrs.filter(attr => {
        const { name, value } = attr;
        if (name === 'class') {
          // Remove classes containing digits
          attr.value = value.split(' ')
            .filter(className => !/\d/.test(className))
            .filter(className => !className.includes(':'))
            .join(' ');
        }

        return allowedAttrs.includes(name) || name.startsWith('data-');
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

function scanForErrorMessages(html) {
  // Parse the HTML into a document tree
  const document = parse(html);

  // Array of error classes to scan for
  const errorClasses = ['error', 'danger', 'warning', 'alert', 'warning'];

  // Array to store error messages
  const errorMessages = [];

  // Function to recursively scan for error classes and messages
  function scanErrors(node) {
    if (node.attrs) {
      const classAttr = node.attrs.find(attr => attr.name === 'class');
      if (classAttr && classAttr.value) {
        const classNameChunks = classAttr.value.split(' ').split('-');
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

  console.log(errorMessages);

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

module.exports = {
  scanForErrorMessages,
  interactiveHTML,
};
