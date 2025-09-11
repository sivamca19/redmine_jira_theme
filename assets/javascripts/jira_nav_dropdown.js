/**
 * JIRA Theme - Navigation Menu Organizer
 * Organizes menu items into logical groups while preserving original + dropdown functionality
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    INIT_DELAY: 100,
    ANIMATION_DURATION: '0.2s',
    MENU_GROUPS: {
      'Work': {
        description: 'Actions related to managing tasks and reports',
        items: ['Activity', 'Agile Board', 'Manage Sprints', 'Import Data', 'Issues', 'Spent time', 'Gantt', 'Calendar']
      },
      'Content': {
        description: 'Documentation or knowledge sharing',
        items: ['News', 'Documents', 'Wiki', 'Files']
      }
    },
    // Items to exclude from grouping (keep in original position)
    EXCLUDE_FROM_GROUPING: ['Overview', 'Settings']
  };

  /**
   * Initialize the organized menu system
   */
  function initOrganizedMenu() {
    const mainMenu = document.querySelector('#main-menu ul');
    if (!mainMenu) return;

    const menuItems = collectMenuItems(mainMenu);
    const groupedItems = groupMenuItems(menuItems);

    // Only remove items that were actually grouped (not Overview or Settings)
    removeGroupedItemsFromMenu(groupedItems);
    
    // Create organized dropdowns (this will maintain existing menu order)
    createOrganizedDropdowns(groupedItems, mainMenu);
  }

  /**
   * Collect all menu items (excluding existing dropdowns)
   */
  function collectMenuItems(mainMenu) {
    const allMenuItems = [];
    const menuItems = mainMenu.querySelectorAll('li');

    menuItems.forEach(function(menuItem) {
      const link = menuItem.querySelector('a');
      // Skip items that already have dropdowns (like the + menu) AND settings menu
      if (link && !menuItem.querySelector('ul.menu-children') && !link.classList.contains('settings')) {
        allMenuItems.push({
          element: menuItem,
          link: link,
          text: link.textContent.trim(),
          href: link.href
        });
      }
    });

    return allMenuItems;
  }

  /**
   * Group menu items according to configuration
   */
  function groupMenuItems(allMenuItems) {
    const groupedItems = {};

    allMenuItems.forEach(function(item) {
      const groupName = findItemGroup(item);
      if (groupName) {
        if (!groupedItems[groupName]) {
          groupedItems[groupName] = [];
        }
        groupedItems[groupName].push(item);
      }
    });

    return groupedItems;
  }

  /**
   * Find which group an item belongs to
   */
  function findItemGroup(item) {
    // Check if item should be excluded from grouping
    const isExcluded = CONFIG.EXCLUDE_FROM_GROUPING.some(excludeItem =>
      item.text.toLowerCase().includes(excludeItem.toLowerCase())
    );
    
    if (isExcluded) {
      return null;
    }

    for (const [groupName, group] of Object.entries(CONFIG.MENU_GROUPS)) {
      const belongsToGroup = group.items.some(groupItem =>
        item.text.toLowerCase().includes(groupItem.toLowerCase()) ||
        groupItem.toLowerCase().includes(item.text.toLowerCase())
      );

      if (belongsToGroup) {
        return groupName;
      }
    }
    return null;
  }

  /**
   * Remove grouped items from the original menu
   */
  function removeGroupedItemsFromMenu(groupedItems) {
    Object.values(groupedItems).flat().forEach(item => item.element.remove());
  }

  /**
   * Create organized dropdowns without changing existing menu structure
   */
  function createOrganizedDropdowns(groupedItems, parentMenu) {
    // Find the Settings menu item to insert before it
    const settingsItem = parentMenu.querySelector('li a.settings')?.closest('li');
    
    // Define the order we want: Content first, then Work
    const orderedGroups = ['Content', 'Work'];
    
    orderedGroups.forEach(groupName => {
      if (groupedItems[groupName] && groupedItems[groupName].length > 0) {
        const dropdown = createGroupDropdown(groupName, CONFIG.MENU_GROUPS[groupName], groupedItems[groupName]);
        
        // Insert before Settings if it exists, otherwise append to end
        if (settingsItem) {
          parentMenu.insertBefore(dropdown, settingsItem);
        } else {
          parentMenu.appendChild(dropdown);
        }
      }
    });
  }

  /**
   * Create a single dropdown menu for a group
   */
  function createGroupDropdown(groupName, groupConfig, items) {
    const dropdown = createDropdownStructure(groupName, groupConfig, items);
    setupDropdownBehavior(dropdown);
    return dropdown.container;
  }

  /**
   * Create the HTML structure for a dropdown
   */
  function createDropdownStructure(groupName, groupConfig, items) {
    // Create container
    const dropdownContainer = document.createElement('li');
    dropdownContainer.style.position = 'relative';

    // Create trigger
    const trigger = document.createElement('a');
    trigger.href = '#';
    trigger.textContent = groupName;

    // Create dropdown menu
    const dropdownMenu = document.createElement('ul');
    dropdownMenu.className = 'menu-children';

    // Add items to dropdown
    items.forEach(function(item) {
      const dropdownItem = createDropdownItem(item);
      dropdownMenu.appendChild(dropdownItem);
    });

    // Assemble
    dropdownContainer.appendChild(trigger);
    dropdownContainer.appendChild(dropdownMenu);

    return {
      container: dropdownContainer,
      trigger: trigger,
      menu: dropdownMenu
    };
  }

  /**
   * Create a single dropdown item
   */
  function createDropdownItem(item) {
    const dropdownItem = document.createElement('li');
    const dropdownLink = document.createElement('a');

    dropdownLink.href = item.href;
    dropdownLink.textContent = item.text;

    // Add hover effects
    setupItemHoverEffects(dropdownLink);

    dropdownItem.appendChild(dropdownLink);
    return dropdownItem;
  }

  /**
   * Setup hover effects for dropdown items
   */
  function setupItemHoverEffects(link) {
    link.addEventListener('mouseenter', function() {
      this.style.background = 'var(--jira-hover)';
      this.style.transform = 'translateX(2px)';
    });

    link.addEventListener('mouseleave', function() {
      this.style.background = '';
      this.style.transform = 'translateX(0)';
    });
  }

  /**
   * Setup dropdown show/hide behavior
   */
  function setupDropdownBehavior(dropdown) {
    let isOpen = false;

    const showDropdown = () => {
      dropdown.menu.style.opacity = '1';
      dropdown.menu.style.visibility = 'visible';
      dropdown.menu.style.transform = 'translateY(0)';
      dropdown.menu.style.pointerEvents = 'auto';
      isOpen = true;
    };

    const hideDropdown = () => {
      dropdown.menu.style.opacity = '0';
      dropdown.menu.style.visibility = 'hidden';
      dropdown.menu.style.transform = 'translateY(-10px)';
      dropdown.menu.style.pointerEvents = 'none';
      isOpen = false;
    };

    // Mouse events
    dropdown.container.addEventListener('mouseenter', showDropdown);

    dropdown.container.addEventListener('mouseleave', function(e) {
      if (!dropdown.menu.contains(e.relatedTarget)) {
        hideDropdown();
      }
    });

    dropdown.menu.addEventListener('mouseleave', function(e) {
      if (!dropdown.container.contains(e.relatedTarget)) {
        hideDropdown();
      }
    });

    // Click events
    dropdown.trigger.addEventListener('click', function(e) {
      e.preventDefault();
      isOpen ? hideDropdown() : showDropdown();
    });
  }

  /**
   * Legacy function for existing + dropdown compatibility
   */
  function toggleNewObjectDropdown() {
    const newObjectItem = document.querySelector('#main-menu #new-object');
    if (!newObjectItem) return false;

    const menuItem = newObjectItem.closest('li');
    const submenu = menuItem?.querySelector('ul.menu-children');

    if (submenu) {
      const isVisible = submenu.style.opacity === '1';
      const styles = isVisible
        ? { opacity: '0', visibility: 'hidden', transform: 'translateY(-10px)' }
        : { opacity: '1', visibility: 'visible', transform: 'translateY(0)' };

      Object.assign(submenu.style, styles);
    }

    return false;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(initOrganizedMenu, CONFIG.INIT_DELAY);
    });
  } else {
    setTimeout(initOrganizedMenu, CONFIG.INIT_DELAY);
  }

  // Expose legacy function globally for backward compatibility
  window.toggleNewObjectDropdown = toggleNewObjectDropdown;

})();