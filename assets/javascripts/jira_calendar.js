/**
 * Jira-like Calendar JavaScript functionality
 */

(function($) {
  'use strict';

  // Calendar namespace
  window.JiraCalendar = {
    
    // Initialize calendar functionality
    init: function() {
      this.setupEventHandlers();
      this.setupTooltips();
      this.setupContextMenu();
      this.setupKeyboardNavigation();
      this.setupDragAndDrop();
      this.enhanceIssueDisplay();
    },

    // Setup event handlers
    setupEventHandlers: function() {
      var self = this;

      // Month/Year change handlers
      $('#month, #year').on('change', function() {
        self.updateCalendar();
      });

      // Issue hover effects
      $('.issue').on('mouseenter', function() {
        $(this).addClass('issue-hover');
        self.showTooltip($(this));
      }).on('mouseleave', function() {
        $(this).removeClass('issue-hover');
        self.hideTooltip();
      });

      // Issue click handlers
      $('.issue').on('click', function(e) {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          self.openIssueModal($(this));
        }
      });

      // Calendar cell click handlers
      $('.calbody').on('click', function(e) {
        if (e.target === this) {
          self.openCreateIssueModal($(this));
        }
      });

      // Navigation keyboard shortcuts
      $(document).on('keydown', function(e) {
        self.handleKeyboardShortcuts(e);
      });
    },

    // Setup tooltips
    setupTooltips: function() {
      $('.tooltip').each(function() {
        var $tooltip = $(this);
        var $tip = $tooltip.find('.tip');
        
        if ($tip.length) {
          $tooltip.on('mouseenter', function(e) {
            $tip.css({
              display: 'block',
              position: 'absolute',
              zIndex: 1000,
              left: Math.min(e.pageX + 10, $(window).width() - $tip.outerWidth() - 20),
              top: e.pageY + 10
            });
          }).on('mouseleave', function() {
            $tip.hide();
          }).on('mousemove', function(e) {
            $tip.css({
              left: Math.min(e.pageX + 10, $(window).width() - $tip.outerWidth() - 20),
              top: e.pageY + 10
            });
          });
        }
      });
    },

    // Setup context menu
    setupContextMenu: function() {
      var self = this;
      
      $('.hascontextmenu').on('contextmenu', function(e) {
        e.preventDefault();
        self.showContextMenu(e, $(this));
      });

      // Hide context menu on click outside
      $(document).on('click', function() {
        $('#context-menu').hide();
      });
    },

    // Setup keyboard navigation
    setupKeyboardNavigation: function() {
      var self = this;
      var $currentCell = null;

      // Arrow key navigation
      $(document).on('keydown', function(e) {
        if (!$currentCell) {
          $currentCell = $('.today').first();
          if (!$currentCell.length) {
            $currentCell = $('.this-month').first();
          }
        }

        switch(e.keyCode) {
          case 37: // Left arrow
            e.preventDefault();
            $currentCell = self.navigateCell($currentCell, 'prev');
            break;
          case 39: // Right arrow
            e.preventDefault();
            $currentCell = self.navigateCell($currentCell, 'next');
            break;
          case 38: // Up arrow
            e.preventDefault();
            $currentCell = self.navigateCell($currentCell, 'up');
            break;
          case 40: // Down arrow
            e.preventDefault();
            $currentCell = self.navigateCell($currentCell, 'down');
            break;
          case 13: // Enter
            if ($currentCell) {
              e.preventDefault();
              self.openCreateIssueModal($currentCell);
            }
            break;
        }
      });
    },

    // Navigate between calendar cells
    navigateCell: function($current, direction) {
      var $cells = $('.calbody');
      var currentIndex = $cells.index($current);
      var $newCell;

      switch(direction) {
        case 'prev':
          $newCell = $cells.eq(Math.max(0, currentIndex - 1));
          break;
        case 'next':
          $newCell = $cells.eq(Math.min($cells.length - 1, currentIndex + 1));
          break;
        case 'up':
          $newCell = $cells.eq(Math.max(0, currentIndex - 7));
          break;
        case 'down':
          $newCell = $cells.eq(Math.min($cells.length - 1, currentIndex + 7));
          break;
      }

      if ($newCell && $newCell.length) {
        $('.cal-selected').removeClass('cal-selected');
        $newCell.addClass('cal-selected');
        this.scrollToCell($newCell);
        return $newCell;
      }
      
      return $current;
    },

    // Scroll to ensure cell is visible
    scrollToCell: function($cell) {
      var cellTop = $cell.offset().top;
      var cellBottom = cellTop + $cell.outerHeight();
      var windowTop = $(window).scrollTop();
      var windowBottom = windowTop + $(window).height();

      if (cellTop < windowTop || cellBottom > windowBottom) {
        $('html, body').animate({
          scrollTop: cellTop - 100
        }, 200);
      }
    },

    // Setup drag and drop for issues
    setupDragAndDrop: function() {
      var self = this;

      $('.issue').attr('draggable', true).on('dragstart', function(e) {
        var $checkbox = $(this).find('input[type="checkbox"]');
        if ($checkbox.length) {
          var issueId = $checkbox.val();
          e.originalEvent.dataTransfer.setData('text/plain', issueId);
          $(this).addClass('dragging');
        }
      }).on('dragend', function() {
        $(this).removeClass('dragging');
      });

      $('.calbody').on('dragover', function(e) {
        e.preventDefault();
        $(this).addClass('drag-over');
      }).on('dragleave', function() {
        $(this).removeClass('drag-over');
      }).on('drop', function(e) {
        e.preventDefault();
        var issueId = e.originalEvent.dataTransfer.getData('text/plain');
        var newDate = self.getCellDate($(this));
        
        $(this).removeClass('drag-over');
        if (issueId) {
          self.moveIssue(issueId, newDate);
        }
      });
    },

    // Get date for a calendar cell
    getCellDate: function($cell) {
      var $dayNum = $cell.find('.day-num');
      var dayNum = $dayNum.length ? $dayNum.text().trim() : '1';
      var month = $('#month').val() || '1';
      var year = $('#year').val() || new Date().getFullYear();
      
      return {
        day: dayNum,
        month: month,
        year: year
      };
    },

    // Move issue to new date
    moveIssue: function(issueId, newDate) {
      if (!issueId || !newDate) {
        return;
      }

      // Make AJAX call to update issue date
      $.ajax({
        url: '/issues/' + issueId,
        method: 'PUT',
        data: {
          issue: {
            start_date: newDate.year + '-' + newDate.month.toString().padStart(2, '0') + '-' + newDate.day.toString().padStart(2, '0')
          }
        },
        success: function() {
          // Refresh calendar or update issue position
          window.location.reload();
        },
        error: function() {
          alert('Failed to move issue. Please try again.');
        }
      });
    },

    // Enhance issue display with proper null checks
    enhanceIssueDisplay: function() {
      var self = this;
      $('.issue').each(function() {
        var $issue = $(this);
        var className = $issue.attr('class');
        
        // Check if className exists before trying to match
        if (!className) {
          return; // Skip this element if it has no class attribute
        }
        
        var priority = className.match(/priority-(\w+)/);
        var status = className.match(/status-(\d+)/);
        var tracker = className.match(/tracker-(\d+)/);

        // Add priority indicator
        if (priority && priority[1]) {
          $issue.prepend('<span class="priority-indicator priority-' + priority[1] + '"></span>');
        }

        // Add status badge
        if (status && status[1]) {
          var statusText = self.getStatusText(status[1]);
          $issue.append('<span class="status-badge status-' + status[1] + '">' + statusText + '</span>');
        }
      });
    },

    // Get status text from status ID
    getStatusText: function(statusId) {
      var statusMap = {
        '1': 'Pending',
        '2': 'New',
        '3': 'Resolved',
        '4': 'Backlogs'
      };
      return statusMap[statusId] || 'Unknown';
    },

    // Handle keyboard shortcuts
    handleKeyboardShortcuts: function(e) {
      // Ctrl/Cmd + N: Create new issue
      if ((e.ctrlKey || e.metaKey) && e.keyCode === 78) {
        e.preventDefault();
        this.openCreateIssueModal();
      }

      // Ctrl/Cmd + F: Focus on filters
      if ((e.ctrlKey || e.metaKey) && e.keyCode === 70) {
        e.preventDefault();
        var $filterSelect = $('#add_filter_select');
        if ($filterSelect.length) {
          $filterSelect.focus();
        }
      }

      // Escape: Clear selections and close modals
      if (e.keyCode === 27) {
        $('.cal-selected').removeClass('cal-selected');
        $('.modal, .tooltip .tip').hide();
        $('#context-menu').hide();
      }
    },

    // Show custom tooltip
    showTooltip: function($element) {
      var $tip = $element.find('.tip');
      if ($tip.length) {
        $tip.show().css({
          position: 'absolute',
          zIndex: 1000
        });
      }
    },

    // Hide tooltip
    hideTooltip: function() {
      $('.tip').hide();
    },

    // Show context menu
    showContextMenu: function(e, $element) {
      var $contextMenu = $('#context-menu');
      var $checkbox = $element.find('input[type="checkbox"]');
      
      if (!$checkbox.length) {
        return; // No checkbox found, skip context menu
      }
      
      var issueId = $checkbox.val();
      if (!issueId) {
        return; // No issue ID found
      }
      
      // Build context menu items
      var menuItems = [
        '<a href="/issues/' + issueId + '" class="context-menu-item">View Issue</a>',
        '<a href="/issues/' + issueId + '/edit" class="context-menu-item">Edit Issue</a>',
        '<hr>',
        '<a href="#" class="context-menu-item" data-action="clone" data-issue="' + issueId + '">Clone Issue</a>',
        '<a href="#" class="context-menu-item" data-action="move" data-issue="' + issueId + '">Move Issue</a>',
        '<hr>',
        '<a href="#" class="context-menu-item context-menu-danger" data-action="delete" data-issue="' + issueId + '">Delete Issue</a>'
      ];

      // Create context menu if it doesn't exist
      if (!$contextMenu.length) {
        $contextMenu = $('<div id="context-menu" class="context-menu" style="display: none;"></div>');
        $('body').append($contextMenu);
      }

      $contextMenu.html(menuItems.join('')).css({
        display: 'block',
        position: 'absolute',
        left: e.pageX,
        top: e.pageY,
        zIndex: 2000
      });

      // Handle context menu actions
      var self = this;
      $contextMenu.find('[data-action]').on('click', function(e) {
        e.preventDefault();
        var action = $(this).data('action');
        var issueId = $(this).data('issue');
        
        switch(action) {
          case 'clone':
            window.location.href = '/issues/' + issueId + '/copy';
            break;
          case 'move':
            self.openMoveIssueModal(issueId);
            break;
          case 'delete':
            self.confirmDeleteIssue(issueId);
            break;
        }
        
        $contextMenu.hide();
      });
    },

    // Open move issue modal
    openMoveIssueModal: function(issueId) {
      // Implementation for move issue modal
      console.log('Move issue:', issueId);
    },

    // Confirm delete issue
    confirmDeleteIssue: function(issueId) {
      if (confirm('Are you sure you want to delete this issue?')) {
        // Implementation for delete issue
        console.log('Delete issue:', issueId);
      }
    },

    // Open issue modal
    openIssueModal: function($issue) {
      var issueUrl = $issue.attr('href') || $issue.find('a').attr('href');
      if (issueUrl) {
        // Open in modal or new tab based on preferences
        window.open(issueUrl, '_blank');
      }
    },

    // Open create issue modal
    openCreateIssueModal: function($cell) {
      var date = null;
      if ($cell) {
        date = this.getCellDate($cell);
      }
      
      var createUrl = '/projects/' + this.getCurrentProject() + '/issues/new';
      if (date) {
        createUrl += '?issue[start_date]=' + date.year + '-' + date.month.toString().padStart(2, '0') + '-' + date.day.toString().padStart(2, '0');
      }
      
      window.open(createUrl, '_blank');
    },

    // Get current project
    getCurrentProject: function() {
      var $projectFilter = $('select[name="v[project_id][]"]');
      var projectFilter = $projectFilter.length ? $projectFilter.val() : null;
      return projectFilter || 'default';
    },

    // Update calendar view
    updateCalendar: function() {
      var month = $('#month').val();
      var year = $('#year').val();
      
      // Update URL and reload
      var currentUrl = new URL(window.location);
      currentUrl.searchParams.set('month', month);
      currentUrl.searchParams.set('year', year);
      
      window.location.href = currentUrl.toString();
    },

    // Quick navigation
    navigateToDate: function(date) {
      var $month = $('#month');
      var $year = $('#year');
      
      if ($month.length) $month.val(date.getMonth() + 1);
      if ($year.length) $year.val(date.getFullYear());
      this.updateCalendar();
    },

    // Go to today
    goToToday: function() {
      this.navigateToDate(new Date());
    },

    // Navigate months
    navigateMonth: function(direction) {
      var $month = $('#month');
      var $year = $('#year');
      
      var currentMonth = parseInt($month.val()) || new Date().getMonth() + 1;
      var currentYear = parseInt($year.val()) || new Date().getFullYear();
      
      var date = new Date(currentYear, currentMonth - 1, 1);
      date.setMonth(date.getMonth() + direction);
      
      this.navigateToDate(date);
    },

    // Filter issues by criteria with proper null checks
    filterIssues: function(criteria) {
      $('.issue').each(function() {
        var $issue = $(this);
        var className = $issue.attr('class');
        var show = true;
        
        // Skip if no class attribute
        if (!className) {
          return;
        }
        
        // Apply filter criteria
        if (criteria.status && !$issue.hasClass('status-' + criteria.status)) {
          show = false;
        }
        
        if (criteria.priority && !$issue.hasClass('priority-' + criteria.priority)) {
          show = false;
        }
        
        if (criteria.tracker && !$issue.hasClass('tracker-' + criteria.tracker)) {
          show = false;
        }
        
        $issue.toggle(show);
      });
    },

    // Highlight issues
    highlightIssues: function(selector) {
      $('.issue').removeClass('highlighted');
      $(selector).addClass('highlighted');
    },

    // Animation utilities
    animateIssueMove: function($issue, $targetCell) {
      if (!$issue.length || !$targetCell.length) {
        return;
      }
      
      var startPos = $issue.offset();
      var endPos = $targetCell.offset();
      
      $issue.css({
        position: 'fixed',
        left: startPos.left,
        top: startPos.top,
        zIndex: 1000
      }).animate({
        left: endPos.left,
        top: endPos.top,
        opacity: 0.7
      }, 300, function() {
        $(this).remove();
      });
    },

    // Issue statistics with proper null checks
    getIssueStats: function() {
      var stats = {
        total: $('.issue').length,
        byStatus: {},
        byPriority: {},
        byTracker: {}
      };
      
      $('.issue').each(function() {
        var className = $(this).attr('class');
        
        // Skip if no class attribute
        if (!className) {
          return;
        }
        
        var classes = className.split(' ');
        
        classes.forEach(function(cls) {
          if (cls.indexOf('status-') === 0) {
            var status = cls.replace('status-', '');
            stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
          } else if (cls.indexOf('priority-') === 0) {
            var priority = cls.replace('priority-', '');
            stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
          } else if (cls.indexOf('tracker-') === 0) {
            var tracker = cls.replace('tracker-', '');
            stats.byTracker[tracker] = (stats.byTracker[tracker] || 0) + 1;
          }
        });
      });
      
      return stats;
    },

    // Export calendar data
    exportCalendarData: function(format) {
      var self = this;
      var data = [];
      
      $('.issue').each(function() {
        var $issue = $(this);
        var $cell = $issue.closest('.calbody');
        var $checkbox = $issue.find('input[type="checkbox"]');
        
        if ($checkbox.length && $cell.length) {
          var date = self.getCellDate($cell);
          var issueUrl = $issue.attr('href') || $issue.find('a').attr('href') || '';
          
          data.push({
            id: $checkbox.val() || '',
            title: $issue.text().trim(),
            date: date.year + '-' + date.month.toString().padStart(2, '0') + '-' + date.day.toString().padStart(2, '0'),
            url: issueUrl
          });
        }
      });
      
      if (format === 'json') {
        return JSON.stringify(data, null, 2);
      } else if (format === 'csv') {
        var csv = 'ID,Title,Date,URL\n';
        data.forEach(function(item) {
          csv += '"' + item.id + '","' + item.title + '","' + item.date + '","' + item.url + '"\n';
        });
        return csv;
      }
      
      return data;
    }
  };

  // Initialize when DOM is ready
  $(document).ready(function() {
    if ($('.cal').length) {
      JiraCalendar.init();
      
      // Add quick navigation buttons
      if ($('.buttons').length) {
        $('.buttons').append(
          '<a href="#" class="icon icon-today" id="go-to-today">' +
          '<svg class="s18 icon-svg" aria-hidden="true"><use href="/assets/icons-b804a055.svg#icon--today"></use></svg>' +
          '<span class="icon-label">Today</span></a>'
        );
        
        $('#go-to-today').on('click', function(e) {
          e.preventDefault();
          JiraCalendar.goToToday();
        });
      }
    }
  });

  // Keyboard shortcuts
  $(document).on('keydown', function(e) {
    // Alt + Left: Previous month
    if (e.altKey && e.keyCode === 37) {
      e.preventDefault();
      JiraCalendar.navigateMonth(-1);
    }
    
    // Alt + Right: Next month
    if (e.altKey && e.keyCode === 39) {
      e.preventDefault();
      JiraCalendar.navigateMonth(1);
    }
    
    // Alt + T: Go to today
    if (e.altKey && e.keyCode === 84) {
      e.preventDefault();
      JiraCalendar.goToToday();
    }
  });

})(jQuery);