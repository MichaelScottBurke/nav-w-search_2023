function createMenuItem(item, isTopLevel = false, level = 1) {
  const listItem = document.createElement('li');
  const anchor = document.createElement('a');

  // Assign classes based on the level
  switch (level) {
    case 1:
      listItem.classList.add('nav-item-parent');
      anchor.classList.add('lvl-parent');
      //anchor.classList.add("nav-menu-title");
      break;
    case 2:
      listItem.classList.add('nav-item-child-lvl-1');
      anchor.classList.add('lvl-1');
      break;
    case 3:
      listItem.classList.add('nav-item-child-lvl-2');
      anchor.classList.add('lvl-2');
      break;
    case 4:
      listItem.classList.add('nav-item-child-lvl-3');
      anchor.classList.add('lvl-3');
      break;
    case 5:
      listItem.classList.add('nav-item-child-lvl-4');
      anchor.classList.add('lvl-4');
      break;
  }

  //anchor.href = item.url;
  anchor.href = item.url || `${item.label.replace(/\s+/g, '_')}.html`;
  //console.log(anchor.href);
  anchor.textContent = item.label;
  listItem.appendChild(anchor);
  let submenu;

  if (item.children && item.children.length > 0) {
    const btnSubMenuToggle = document.createElement('button');
    btnSubMenuToggle.className = 'msb-icon-button expand-contract-button';
    btnSubMenuToggle.innerHTML = '&#8963;';
    listItem.appendChild(btnSubMenuToggle);

    submenu = document.createElement('ul');

    switch (level) {
      case 0:
        submenu.classList.add('nav-container-lvl-0');
        break;
      case 1:
        submenu.classList.add('nav-container-lvl-1');
        break;
      case 2:
        submenu.classList.add('nav-container-lvl-2');
        break;
      case 3:
        submenu.classList.add('nav-container-lvl-3');
        break;
      case 4:
        submenu.classList.add('nav-container-lvl-4');
        break;
      case 5:
        submenu.classList.add('nav-container-lvl-5');
        break;
      // continue for deeper levels if needed.
    }
    listItem.appendChild(submenu);
    submenu.classList.add('msb-hide');
    item.children.forEach((child) =>
      submenu.appendChild(createMenuItem(child, false, level + 1))
    );

    // Increase level here
    btnSubMenuToggle.addEventListener('click', () => {
      // Check if the submenu is hidden by checking the presence of the 'msb-hide' class
      const isHidden = submenu.classList.contains('msb-hide');
      if (isHidden) {
        // If it's hidden, remove the class to show it
        submenu.classList.remove('msb-hide');
      } else {
        // If it's not hidden, add the class to hide it
        submenu.classList.add('msb-hide');
      }
      // Rotate the toggle button depending on the state
      btnSubMenuToggle.style.transform = isHidden
        ? 'rotate(-180deg)'
        : 'rotate(0deg)';
      expansionStateMap.set(submenu, !isHidden);
    });
  }

  if (isTopLevel) {
    listItem.classList.add('top-level-item');
    const tabButton = document.createElement('button');
    const uniqueDataAttribute = item.id;
    tabButton.setAttribute('data-tab-id', uniqueDataAttribute);
    listItem.setAttribute('data-top-level-id', uniqueDataAttribute);

    const submenu = listItem.querySelector('ul');
    if (submenu) {
      submenu.setAttribute('data-submenu-id', uniqueDataAttribute);
    }
  }

  return listItem;
}
