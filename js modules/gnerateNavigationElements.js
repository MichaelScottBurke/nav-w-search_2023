function generateNavigationElements(
  container,
  items,
  createTabs = true,
  flatten = false,
  level = 1
) {
  if (!Array.isArray(items)) {
    console.error('Error: items is not an array');
    return;
  }

  items.forEach((item) => {
    // Here, we assume createTabs determines if the item is a top-level item
    const menuItem = createMenuItem(item, createTabs && level === 1, level);
    container.appendChild(menuItem);

    // If flatten is true and the item has children, append the children to the same level
    if (flatten && item.children) {
      item.children.forEach((child) => {
        generateNavigationElements(
          container,
          [child],
          false,
          flatten,
          level + 1
        ); // Recursively add children
      });
    }
  });
}
