import './style.css';
// Global variables
const sideNav = document.getElementById('side-nav');
const navigationContainer = document.getElementById('navigation-ul');
const tabsContainer = document.getElementById('tabs-container');
const searchInput = document.getElementById('searchInput');
const expansionStateMap = new Map();
const btnNavOptionsMenu = document.getElementById('btn-nav-options-menu');
const navOptionsMenu = document.getElementById('nav-options-menu');
const childNav = document.getElementById('child-nav');
const firstTabButton = tabsContainer.querySelector('button');

let lastClickedTab = null;
let isExpanded = false;
let originalNavigationAnchors;
let currentVisibleSubmenu = null;

async function fetchNavigationData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw response;
    }
    return response.json();
  } catch (error) {
    if (error instanceof Response) {
      console.error(
        `HTTP error while fetching JSON data from ${url}:`,
        error.statusText
      );
      return new Error(`HTTP error! Status: ${error.status}`);
    } else {
      console.error(
        `Error fetching or parsing the JSON data from ${url}:`,
        error
      );
      return error;
    }
  }
}

// Define constants for cache keys
const DEFAULT_MODULE = 'profile';
const DEFAULT_MODULE_PATH = 'https://raw.githubusercontent.com/MichaelScottBurke/msb-data/main/';

// preload data for the default tab
async function preloadDefaultModuleData() {
  const defaultModuleData = await fetchNavigationData(DEFAULT_MODULE_PATH);

  // Check if the result is an instance of an Error
  if (defaultModuleData instanceof Error) {
    console.error(
      `Failed to preload default module data: ${defaultModuleData.message}`
    );
    // Decide what to do in case of an error. Maybe set a flag or call a different function.
  } else {
    // Assuming defaultModuleData is valid, cache it and load the content into main.
    moduleDataCache[DEFAULT_MODULE] = defaultModuleData;
    loadContentIntoMain(DEFAULT_MODULE); // Assuming this function can handle module data.
  }
}
  
function createMenuItem(item, isTopLevel = false, level = 1) {
  const listItem = document.createElement('li');
  const anchor = document.createElement('a');

  // Use the same level for both listItem and anchor
  const itemClass = level > 1 ? `nav-item-child-lvl-${level - 1}` : 'nav-item-parent';
  listItem.classList.add(itemClass);
  anchor.classList.add(`lvl-${level > 1 ? level - 1 : 'parent'}`);

  anchor.href = item.url || `${item.label.replace(/\s+/g, '_')}.html`;
  anchor.textContent = item.label;
  listItem.appendChild(anchor);

  if (item.children && item.children.length > 0) {
    const btnSubMenuToggle = document.createElement('button');
    btnSubMenuToggle.className = 'msb-icon-button expand-contract-button';
    btnSubMenuToggle.innerHTML = '&#8963;';
    listItem.appendChild(btnSubMenuToggle);

    // Create submenu and add it to the DOM before filling it to avoid reflows
    const submenu = document.createElement('ul');
    submenu.classList.add(`nav-container-lvl-${level}`, 'msb-hide');
    listItem.appendChild(submenu);

    // Use document fragments to avoid live DOM manipulation
    const fragment = document.createDocumentFragment();
    item.children.forEach((child) =>
      fragment.appendChild(createMenuItem(child, false, level + 1))
    );
    submenu.appendChild(fragment);

    // Event Delegation: Consider moving this to a parent element and checking event target
    btnSubMenuToggle.addEventListener('click', function () {
      submenu.classList.toggle('msb-hide');
      this.style.transform = submenu.classList.contains('msb-hide')
        ? 'rotate(0deg)'
        : 'rotate(-180deg)';
      // This assumes `expansionStateMap` is a global variable that tracks state
      expansionStateMap.set(submenu, submenu.classList.contains('msb-hide'));
    });
  }

  if (isTopLevel) {
    listItem.classList.add('top-level-item');
    const uniqueDataAttribute = item.id;
    listItem.setAttribute('data-top-level-id', uniqueDataAttribute);

    // Cache the submenu query
    const submenu = listItem.querySelector('ul');
    if (submenu) {
      submenu.setAttribute('data-submenu-id', uniqueDataAttribute);
    }
  }

  return listItem;
}

// Global map to store the association between item ids and their DOM elements
let idToElementMap = new Map();

// Adjusted generateNavigationElements function
function generateNavigationElements(container, items, level = 0) {
  items.forEach(item => {
    // Create the menu item
    let element = createMenuItem(item, level === 0); // Pass level to createMenuItem if needed
    
    // Store the element in the map using its id
    idToElementMap.set(item.id, element);
    
    // Append the element to the container
    container.appendChild(element);
    
    // If there are children, create a submenu container
    if (item.children && item.children.length > 0) {
      let submenuContainer = document.createElement('ul');
      
      // If this is a top-level item, add a class to the submenu to control visibility
      if (level === 0) {
        submenuContainer.classList.add('submenu');
        // Initially hide all submenus, they will be shown when their parent tab is active
        submenuContainer.style.display = 'none';
      }
      
      generateNavigationElements(submenuContainer, item.children, level + 1);
      element.appendChild(submenuContainer);
    }
  });

  // After the generation process, make sure to display the submenu of the active tab
  if (level === 0) {
    let activeTab = container.querySelector('.active-tab');
    if (activeTab) {
      let submenu = activeTab.querySelector('.submenu');
      if (submenu) {
        submenu.style.display = 'block'; // or use a class to control visibility
      }
    }
  }
}

function generateTabs(items) {
  items.forEach((item) => {
    const uniqueDataAttribute = item.id;

    // Check if a tab button with this unique attribute already exists
    const existingTabButton = tabsContainer.querySelector(
      `button[data-tab-id="${uniqueDataAttribute}"]`
    );

    if (!existingTabButton) {
      const tabButton = document.createElement('button');
      tabButton.setAttribute('data-tab-id', uniqueDataAttribute);
      tabButton.textContent = item.label;

      // tabButton.addEventListener("click", () => {
      tabsContainer.addEventListener('click', (event) => {
        const tabButton = event.target.closest('button[data-tab-id]');
        if (!tabButton) return;

        const uniqueDataAttribute = tabButton.getAttribute('data-tab-id');

        if (lastClickedTab) {
          lastClickedTab.classList.remove('selected-tab');
        }

        lastClickedTab = tabButton;
        showOnlyCurrentTabContent();

        // 1. Hide all top-level items
        document
          .querySelectorAll('.top-level-item')
          .forEach((item) => item.classList.add('msb-hide'));

        // 2. Hide all submenus
        document
          .querySelectorAll('#navigation-ul > li > ul')
          .forEach((submenu) => submenu.classList.add('msb-hide'));

        // 3. Show the clicked tab"s top-level item
        const correspondingTopLevel = document.querySelector(
          `[data-top-level-id="${uniqueDataAttribute}"]`
        );
        // if (correspondingTopLevel) {
        //   correspondingTopLevel.classList.remove("msb-hide");
        // }
        if (correspondingTopLevel) {
          correspondingTopLevel.classList.add('nav-menu-title');
          correspondingTopLevel.classList.remove(
            'nav-menu-title_filtering',
            'msb-hide'
          );
        }

        // 4. Show only the clicked tab"s submenu and its first-level children
        const correspondingSubmenu = document.querySelector(
          `[data-submenu-id="${uniqueDataAttribute}"]`
        );
        if (correspondingSubmenu) {
          correspondingSubmenu.classList.remove('msb-hide');
        }
      });

      tabsContainer.appendChild(tabButton);

      const correspondingTopLevel = document.querySelector(
        `[data-top-level-id="${uniqueDataAttribute}"] > a`
      );
      if (correspondingTopLevel) {
        correspondingTopLevel.classList.add('nav-menu-title');
        correspondingTopLevel.classList.remove('nav-menu-title_filtering');
      }
    }
  });
}

function filterMenu(query) {
  if (!searchInput.value.trim() && query) {
    document.querySelectorAll('#navigation-ul > li > ul').forEach((submenu) => {
      const isHidden = submenu.classList.contains('msb-hide');
      expansionStateMap.set(submenu, isHidden);
    });
  }

  const menuItems = Array.from(navigationContainer.querySelectorAll('li'));
  const stack = [...menuItems];
  while (stack.length > 0) {
    const item = stack.pop();
    const labelElement = item.querySelector('a');
    const originalLabel = labelElement.textContent;
    const label = originalLabel.toLowerCase();
    const matches = label.includes(query.toLowerCase());

    const btnSubMenuToggle = item.querySelector('button');
    const submenu = item.querySelector('ul');

    // Check if any child items match
    const childItems = Array.from(item.querySelectorAll('li'));
    const childMatches = childItems.some((childItem) => {
      const childLabelElement = childItem.querySelector('a');
      if (childLabelElement) {
        const childLabel = childLabelElement.textContent.toLowerCase();
        return childLabel.includes(query.toLowerCase());
      }
      return false;
    });

    // If either the current item or its children match, display it
    if (matches || childMatches) {
      item.classList.remove('msb-hide');

      if (matches) {
        const regex = new RegExp(query, 'gi');
        const highlightedLabel = originalLabel.replace(
          regex,
          (match) => `<strong>${match}</strong>`
        );
        labelElement.innerHTML = highlightedLabel;
      } else {
        labelElement.innerHTML = originalLabel;
      }

      // Expand or collapse the submenu based on the stored state
      if (btnSubMenuToggle && submenu) {
        if (expansionStateMap.has(submenu)) {
          submenu.style.display = expansionStateMap.get(submenu)
            ? 'block'
            : 'none';
        } else {
          submenu.classList.remove('msb-hide'); // Default to expanded if not present in the map
        }
      }
    } else {
      item.classList.add('msb-hide');

      // Collapse the submenu programmatically
      if (btnSubMenuToggle && submenu) {
        submenu.classList.add('msb-hide');
      }
    }
    // If it has children, add them to the stack
    if (childItems.length > 0) {
      stack.push(...childItems);
    }
  }

  if (query && query.length > 0) {
    navigationContainer.classList.add('search-active'); // Add the class when there"s a search query
  } else {
    navigationContainer.classList.remove('search-active'); // Remove the class when search is cleared
  }
  //put a different class on top level items when searching vs not
  const topLevelItems = document.querySelectorAll('.top-level-item > a');
  topLevelItems.forEach((item) => {
    //item.classList.add("nav-menu-title_filtering");
    item.classList.remove('nav-menu-title');
  });
}

// Cache DOM elements
const allSubmenus = Array.from(navigationContainer.querySelectorAll('ul'));
const allLabels = Array.from(navigationContainer.querySelectorAll('li a'));
const topLevelSubmenus = Array.from(
  navigationContainer.querySelectorAll('.nav-item-parent > ul')
);
const topLevelItems = Array.from(
  document.querySelectorAll('.top-level-item > a')
);

function clearSearch() {
  console.log('search cleared');
  searchInput.value = '';
  filterMenu('');

  // Collapse all submenus using a class to control the display property
  allSubmenus.forEach((submenu) => {
    submenu.classList.add('msb-hide');
  });

  // Display first children of all top-level tabs
  topLevelSubmenus.forEach((submenu) => {
    submenu.classList.remove('msb-hide');
  });

  // Respect the isExpanded state
  if (isExpanded) {
    expandAll(); // Assuming this function efficiently handles expansion
  } else {
    collapseAll(); // Assuming this function efficiently handles collapsing
  }

  // Ensure that nav-menu-title is added back to both the <li> and the <a>
  const topLevelLiItems = document.querySelectorAll('.top-level-item');
  topLevelLiItems.forEach((li) => {
    li.classList.add('nav-menu-title');
    const childAnchor = li.querySelector('.lvl-parent');
    if (childAnchor) {
      childAnchor.classList.add('nav-menu-title');
    }
  });

  // Remove any filtering classes if they were added
  topLevelItems.forEach((item) => {
    item.classList.remove('nav-menu-title_filtering');
  });

  // Restore the view based on last clicked tab or default to the first tab
  if (lastClickedTab) {
    lastClickedTab.click();
  } else if (firstTabButton) {
    firstTabButton.click();
  }
}

function showOnlyCurrentTabContent() {
  // If there"s a previously visible submenu, hide it
  if (currentVisibleSubmenu) {
    currentVisibleSubmenu.parentElement.classList.add('msb-hide');
  }

  // Get the submenu of the currently selected tab
  const correspondingTopLevel = lastClickedTab
    ? document.querySelector(
        `[data-top-level-id="${lastClickedTab.getAttribute('data-tab-id')}"]`
      )
    : null;
  if (correspondingTopLevel) {
    currentVisibleSubmenu = correspondingTopLevel.querySelector('ul');
    if (currentVisibleSubmenu) {
      correspondingTopLevel.classList.remove('msb-hide');
    }
  }
  if (lastClickedTab) {
    lastClickedTab.classList.add('selected-tab');
  }
}

function expandAll() {
  Array.from(navigationContainer.querySelectorAll('ul')).forEach((submenu) => {
    submenu.classList.remove('msb-hide');
  });
  showOnlyCurrentTabContent();
  isExpanded = true;
}

function collapseAll() {
  // Collapse all level 2 and deeper
  Array.from(
    navigationContainer.querySelectorAll('.nav-item-child-lvl-1 > ul')
  ).forEach((submenu) => {
    submenu.classList.add('msb-hide');
  });

  // Keep first level of children expanded
  Array.from(
    navigationContainer.querySelectorAll('.nav-item-parent > ul')
  ).forEach((submenu) => {
    submenu.classList.remove('msb-hide');
  });
  isExpanded = false;
  showOnlyCurrentTabContent();
}

function sortAlpha() {
  const topLevelItems = Array.from(navigationContainer.children);
  const menuItems = Array.from(navigationContainer.querySelectorAll('li'));
  const hierarchyMap = new Map();

  menuItems.forEach((item) => {
    const parentItem = item.parentElement.closest('li');
    if (parentItem) {
      const parentChildren = hierarchyMap.get(parentItem) || [];
      parentChildren.push(item);
      hierarchyMap.set(parentItem, parentChildren);
    }
  });

  hierarchyMap.forEach((children, parent) => {
    children.sort((a, b) => {
      const labelA = a.querySelector('a').textContent.toLowerCase();
      const labelB = b.querySelector('a').textContent.toLowerCase();
      return labelA.localeCompare(labelB);
    });

    children.forEach((child) => {
      parent.querySelector('ul').appendChild(child);
    });
  });
  if (isExpanded) {
    expandAll();
  } else {
    collapseAll();
  }
}

function reorderNavigation(container, items) {
  let parent = container.parentNode;
  let nextSibling = container.nextSibling;
  parent.removeChild(container);

  // Clear the container before appending reordered items
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  items.forEach(item => {
    let element = idToElementMap.get(item.id);
    if (element) {
      container.appendChild(element);
      if (item.children && item.children.length > 0) {
        let childContainer = element.querySelector('ul'); // assuming child elements are in a 'ul'
        reorderNavigation(childContainer, item.children);
      }
    }
  });

  // Reattach the container
  parent.insertBefore(container, nextSibling);
}

function sortDefault() {
  // Reorder the navigation elements without clearing the innerHTML.
  reorderNavigation(navigationContainer, originalNavigationAnchors);

  // Restore the state of the last clicked tab or the first tab if none was clicked.
  if (lastClickedTab) {
    restoreTabState(lastClickedTab);
  } else {
    let firstTabButton = tabsContainer.querySelector('button');
    if (firstTabButton) {
      restoreTabState(firstTabButton);
    }
  }

  // Update submenu classes as necessary based on the current state.
  // This function should handle any class changes that were being done
  // in the previous version of sortDefault after re-generating the elements.
  updateSubmenuClasses();

  // Clear search if necessary. This assumes clearSearch has been refactored
  // to not interfere with the sorted state.
  clearSearchIfNeeded();

  // Adjust the expansion state based on `isExpanded`.
  // If these functions cause reflows, they should be optimized to minimize performance impact.
  adjustExpansionState();
}

function restoreTabState(tabElement) {
  // Logic that replicates what happens when a tab is clicked.
  // This should handle showing/hiding elements, setting active states, etc.
  // Replace the following with the specific actions required to restore the tab state.
  tabElement.classList.add('active-tab');
  let contentId = tabElement.getAttribute('data-content-id');
  document.getElementById(contentId).style.display = 'block';
}

function updateSubmenuClasses() {
  // If any submenu classes need to be updated after sorting, do it here.
  // Replace the following with the specific class updates needed.
  document.querySelectorAll('.submenu').forEach(submenu => {
    submenu.classList.remove('msb-hide');
  });
}

function clearSearchIfNeeded() {
  // Clear the search if it does not interfere with the sorted state.
  // You might want to check the current search input and clear it only if needed.
  if (searchInput.value) {
    searchInput.value = '';
    // Call any additional functions required to clear the search state.
  }
}

function adjustExpansionState() {
  // Adjust the expansion state based on the `isExpanded` flag.
  if (isExpanded) {
    expandAll();
  } else {
    collapseAll();
  }
}

function updateMainContent(title) {
  const mainElement = document.querySelector('main');
  mainElement.innerHTML = `<h1>${title}</h1>`;
}

function loadContentIntoMain(url) {
  fetch(url)
    .then((response) => response.text())
    .then((content) => {
      const mainElement = document.querySelector('main');
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const h1Element = doc.querySelector('h1');
      mainElement.innerHTML = h1Element
        ? h1Element.outerHTML
        : 'Page not found';
    })
    .catch((error) => {
      console.error('Error loading content:', error);
    });
}

function showDescendantsOfLevel1(anchor) {
  const parentLi = anchor.parentElement;
  // const descendants = parentLi.querySelector('ul');

  // // div to show descendants
  // const overlay = document.createElement('div');
  // overlay.id = 'descendants-overlay';
  // // Create a title from the parent li"s text content and append to the overlay
  // const title = document.createElement('h2');
  // title.textContent = anchor.textContent;
  // overlay.appendChild(title);
  // overlay.appendChild(descendants.cloneNode(true)); // Clone so we don"t remove from the main nav

  // childNav.appendChild(overlay);

  // // Target the <ul> inside the descendants-overlay
  // const ulInsideOverlay = overlay.querySelector('ul');

  // if (descendants) {
  //   ulInsideOverlay.classList.remove('msb-hide');
  // }

  // // From here, you can apply any operations or modifications to the ulInsideOverlay

  // childNav.classList.toggle('msb-hide');
  console.log('show descendent overlay');
}

function hideDescendantsOverlay() {
  console.log('hide descendent overlay');
  // const overlay = document.getElementById('descendants-overlay');
  // if (overlay) {
  //   overlay.remove();
  //   childNav.classList.toggle('msb-hide');
  // }
}

// Cache for module data
const moduleDataCache = {};

const initSideNav = async () => {
  // Fetch navigation data
  const navDataURL =
    'https://raw.githubusercontent.com/MichaelScottBurke/msb-data/main/nav-data-all-modules.min.json';
  const navData = await fetchNavigationData(navDataURL);

  if (navData) {
    originalNavigationAnchors = JSON.parse(JSON.stringify(navData));
    generateNavigationElements(navigationContainer, navData);
    generateTabs(navData);

    // // Pre-fetch "pages" content (in modules) JSONs
    //   for (let module of navData) {  // Assuming navData is an array of modules
    //     prefetchModuleData(module.dataFile);
    // }

    const firstTabButton = tabsContainer.querySelector('button');
    if (firstTabButton) {
      lastClickedTab = firstTabButton;
      showOnlyCurrentTabContent();
    }

    if (firstTabButton) {
      firstTabButton.click();
    }

    if (lastClickedTab) {
      showOnlyCurrentTabContent();
    }

    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim();
      filterMenu(query);
      if (!query) {
        clearSearch();
        showOnlyCurrentTabContent();
      }
    });

    //delegate event listeners
    sideNav.addEventListener('click', (event) => {
      const toggleMenuIDs = [
        'btn-sort-alpha',
        'btn-sort-default',
        'btn-expand-all',
        'btn-collapse-all',
      ];

      switch (event.target.id) {
        case 'btn-expand-all':
          expandAll();
          break;
        case 'btn-collapse-all':
          collapseAll();
          break;
        case 'btn-sort-alpha':
          sortAlpha();
          break;
        case 'btn-sort-default':
          sortDefault();
          break;
        case 'btn-clear-search':
          clearSearch();
          break;
        case 'btn-nav-options-menu':
          navOptionsMenu.classList.toggle('msb-hide');
          break;
        case 'btn-nav-back':
          hideDescendantsOverlay();
      }
      // Check if the clicked button"s ID is in the toggleMenuIDs array
      if (toggleMenuIDs.includes(event.target.id)) {
        navOptionsMenu.classList.toggle('msb-hide');
      }

      const lvl1Item = event.target.closest("a.lvl-1");
      if (lvl1Item) {
        console.log('clicked level 1 item');
        event.preventDefault(); // Prevent navigation
        const label = lvl1Item.textContent; // This assumes the anchor's text is the title you want
        updateMainContent(label);

        // Load content into the <main> tag
      //   loadContentIntoMain(lvl1Item.href);
      //  updateMainContent();

        // Show descendants of the clicked "level 1" item
        showDescendantsOfLevel1(lvl1Item);
      }
    });

      
  }
};

(async function () {
  await initSideNav();
})();
