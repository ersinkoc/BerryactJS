import { isSignal } from '../core/signal.js';

export function diffAndPatch(oldNode, newNode, container) {
  if (!oldNode) {
    return mountNode(newNode, container);
  }

  if (!newNode) {
    unmountNode(oldNode);
    return null;
  }

  if (typeof oldNode !== typeof newNode) {
    const newElement = mountNode(newNode, container);
    unmountNode(oldNode);
    return newElement;
  }

  if (typeof oldNode === 'string' || typeof oldNode === 'number') {
    if (oldNode !== newNode) {
      const textNode = container.firstChild;
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        textNode.textContent = String(newNode);
      }
    }
    return container.firstChild;
  }

  if (oldNode.type !== newNode.type || oldNode.tag !== newNode.tag) {
    const newElement = mountNode(newNode, container);
    unmountNode(oldNode);
    return newElement;
  }

  if (oldNode.type === 'element') {
    return patchElement(oldNode, newNode, container);
  }

  if (oldNode.type === 'fragment') {
    return patchFragment(oldNode, newNode, container);
  }

  return container.firstChild;
}

function mountNode(node, container) {
  if (typeof node === 'string' || typeof node === 'number') {
    const textNode = document.createTextNode(String(node));
    container.appendChild(textNode);
    return textNode;
  }

  if (node.type === 'element') {
    const element = document.createElement(node.tag);

    updateProps(element, {}, node.props);

    node.children.forEach((child) => {
      mountNode(child, element);
    });

    container.appendChild(element);
    return element;
  }

  if (node.type === 'fragment') {
    const fragment = document.createDocumentFragment();

    node.children.forEach((child) => {
      mountNode(child, fragment);
    });

    container.appendChild(fragment);
    return container.lastChild;
  }

  return null;
}

function unmountNode(node) {
  if (node && node.element && node.element.parentNode) {
    node.element.parentNode.removeChild(node.element);
  }
}

function patchElement(oldNode, newNode, container) {
  const element = container.querySelector(oldNode.tag) || container.firstChild;

  updateProps(element, oldNode.props, newNode.props);
  patchChildren(oldNode.children, newNode.children, element);

  return element;
}

function patchFragment(oldNode, newNode, container) {
  patchChildren(oldNode.children, newNode.children, container);
  return container.firstChild;
}

function updateProps(element, oldProps, newProps) {
  const allProps = new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);

  allProps.forEach((key) => {
    const oldValue = oldProps[key];
    const newValue = newProps[key];

    if (oldValue !== newValue) {
      setProp(element, key, newValue, oldValue);
    }
  });
}

function setProp(element, key, value, oldValue) {
  if (key === 'key') return;

  if (key.startsWith('on') && typeof value === 'function') {
    const eventType = key.slice(2).toLowerCase();
    if (oldValue) {
      element.removeEventListener(eventType, oldValue);
    }
    element.addEventListener(eventType, value);
    return;
  }

  if (value === null || value === undefined) {
    element.removeAttribute(key);
  } else if (key === 'className' || key === 'class') {
    element.className = value;
  } else if (key === 'style' && typeof value === 'object') {
    Object.assign(element.style, value);
  } else if (key in element) {
    element[key] = value;
  } else {
    element.setAttribute(key, value);
  }
}

function patchChildren(oldChildren, newChildren, container) {
  const maxLength = Math.max(oldChildren.length, newChildren.length);

  for (let i = 0; i < maxLength; i++) {
    const oldChild = oldChildren[i];
    const newChild = newChildren[i];

    if (!oldChild && newChild) {
      mountNode(newChild, container);
    } else if (oldChild && !newChild) {
      const childElement = container.childNodes[i];
      if (childElement) {
        container.removeChild(childElement);
      }
    } else if (oldChild && newChild) {
      const childContainer = container.childNodes[i] ? container : container;
      diffAndPatch(oldChild, newChild, childContainer);
    }
  }
}

export function createListDiffer() {
  return {
    diff(oldList, newList, keyFn = (item, index) => index) {
      const oldKeys = oldList.map(keyFn);
      const newKeys = newList.map(keyFn);
      const operations = [];

      const oldKeyMap = new Map();
      oldList.forEach((item, index) => {
        oldKeyMap.set(oldKeys[index], { item, index });
      });

      const newKeyMap = new Map();
      newList.forEach((item, index) => {
        newKeyMap.set(newKeys[index], { item, index });
      });

      newKeys.forEach((key, newIndex) => {
        if (oldKeyMap.has(key)) {
          const oldIndex = oldKeyMap.get(key).index;
          if (oldIndex !== newIndex) {
            operations.push({
              type: 'move',
              from: oldIndex,
              to: newIndex,
              key,
            });
          } else {
            operations.push({
              type: 'update',
              index: newIndex,
              key,
              oldItem: oldKeyMap.get(key).item,
              newItem: newList[newIndex],
            });
          }
        } else {
          operations.push({
            type: 'insert',
            index: newIndex,
            item: newList[newIndex],
            key,
          });
        }
      });

      oldKeys.forEach((key) => {
        if (!newKeyMap.has(key)) {
          operations.push({
            type: 'remove',
            index: oldKeyMap.get(key).index,
            key,
          });
        }
      });

      return operations.sort((a, b) => {
        if (a.type === 'remove') return -1;
        if (b.type === 'remove') return 1;
        if (a.type === 'move') return -1;
        if (b.type === 'move') return 1;
        return 0;
      });
    },
  };
}
