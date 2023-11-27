// DOM elements
const navigationContainer = document.getElementById('navigation-ul');
const tabsContainer = document.getElementById('tabs-container');
const searchInput = document.getElementById('searchInput');

// Cached data 
let navigationData;
let visibleSubmenu;

// Async functions
async function fetchNavigationData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching or parsing the JSON data:", error);
    return null;
  }
}

async function fetchPageContent(url) {
  // Fetch page content  
}

// Render functions
function generateNavigation(data) {
  // Loop through data and generate navigation
} 

function updateTab(tab) {
  // Handle tab selection
}

function updateMainContent(title) {
  // Update main content section
}

function filterNavigation(query) {
  // Filter navigation
}

function clearSearch() {
  // Clear search
}

// Event handlers
function handleNavigationClick(event) {
  // Handle navigation link click  
}

const debouncedFilterNavigation = debounce((event) => {
  filterNavigation(event.target.value);
}, 250);

// Initialization
(async function() {

  // Fetch data
  navigationData = await fetchNavigationData();

  // Generate initial UI
  generateNavigation(navigationData);
  
  // Attach event listeners
  navigationContainer.addEventListener('click', handleNavigationClick);
  searchInput.addEventListener('input', debouncedFilterNavigation);

  // Fetch initial page content
  updateMainContent('Default Page');

})();