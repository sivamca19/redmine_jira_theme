/**
 * Jira-like Forms JavaScript functionality
 */

(function($) {
  'use strict';

  // Forms namespace
  window.JiraForms = {
    
    // Initialize forms functionality
    init: function() {
      this.setupFilterForm();
      this.setupDynamicFilters();
      this.setupFormValidation();
      this.setupAutoComplete();
      this.setupFormPersistence();
    },

    // Setup filter form functionality
    setupFilterForm: function() {
      var self = this;

      // Initialize filters on page load
      if (typeof initFilters === 'function') {
        initFilters();
      }

      // Add filter select handler
      $('#add_filter_select').on('change', function() {
        var filterName = $(this).val();
        if (filterName) {
          self.addFilter(filterName);
          $(this).val('');
        }
      });

      // Remove filter handlers
      $(document).on('change', '.filter input[type="checkbox"]', function() {
        var $filter = $(this).closest('.filter');
        if (!$(this).is(':checked')) {
          $filter.fadeOut(300, function() {
            $(this).remove();
            self.updateFilterOptions();
          });
        }
      });

      // Operator change handlers
      $(document).on('change', '.filter select[id^="operators_"]', function() {
        self.updateFilterValues($(this));
      });

      // Apply filters button
      $('.icon-checked').on('click', function(e) {
        e.preventDefault();
        self.applyFilters();
      });

      // Clear filters button
      $('.icon-reload').on('click', function(e) {
        e.preventDefault();
        self.clearFilters();
      });

      // Save custom query button
      $('.icon-save').on('click', function(e) {
        e.preventDefault();
        self.saveCustomQuery();
      });
    },

    // Setup dynamic filters
    setupDynamicFilters: function() {
      var self = this;

      // Handle multi-select toggles
      $(document).on('click', '.toggle-multiselect', function() {
        var $select = $(this).prev('select');
        var isMultiple = $select.attr('multiple');
        
        if (isMultiple) {
          $select.removeAttr('multiple').find('option:selected:not(:first)').prop('selected', false);
          $(this).find('.icon-svg use').attr('href', '/assets/icons-b804a055.svg#icon--toggle-plus');
        } else {
          $select.attr('multiple', 'multiple');
          $(this).find('.icon-svg use').attr('href', '/assets/icons-b804a055.svg#icon--toggle-minus');
        }
      });

      // Handle remote filter loading
      $(document).on('focus', 'select[data-remote="true"]', function() {
        if (!$(this).data('loaded')) {
          self.loadRemoteOptions($(this));
        }
      });
    },

    // Add new filter
    addFilter: function(filterName) {
      if (!availableFilters || !availableFilters[filterName]) {
        return;
      }

      var filter = availableFilters[filterName];
      var filterId = 'tr_' + filterName;
      
      // Don't add if already exists
      if ($('#' + filterId).length) {
        return;
      }

      var $filterRow = $('<div class="filter" id="' + filterId + '"></div>');
      
      // Field section
      var $field = $('<div class="field"></div>');
      $field.append('<input type="checkbox" id="cb_' + filterName + '" name="f[]" value="' + filterName + '" checked>');
      $field.append('<label for="cb_' + filterName + '"> ' + filter.name + '</label>');
      
      // Operator section
      var $operator = $('<div class="operator"></div>');
      var $operatorSelect = $('<select id="operators_' + filterName + '" name="op[' + filterName + ']"></select>');
      
      var operators = operatorByType[filter.type] || ['=', '!'];
      operators.forEach(function(op) {
        $operatorSelect.append('<option value="' + op + '">' + (operatorLabels[op] || op) + '</option>');
      });
      
      $operator.append($operatorSelect);
      
      // Values section
      var $values = $('<div class="values"></div>');
      if (filter.values) {
        var $valueSelect = $('<select class="value" name="v[' + filterName + '][]"></select>');
        filter.values.forEach(function(value) {
          $valueSelect.append('<option value="' + value[1] + '">' + value[0] + '</option>');
        });
        $values.append($valueSelect);
      } else if (filter.remote) {
        var $valueSelect = $('<select class="value" name="v[' + filterName + '][]" data-remote="true"></select>');
        $valueSelect.append('<option value="">Loading...</option>');
        $values.append($valueSelect);
      } else {
        $values.append('<input type="text" name="v[' + filterName + '][]" class="value">');
      }

      // Add multi-select toggle for list types
      if (filter.type.indexOf('list') === 0) {
        $values.append('<span class="toggle-multiselect icon-only icon-toggle-plus">' +
          '<svg class="s18 icon-svg" aria-hidden="true">' +
          '<use href="/assets/icons-b804a055.svg#icon--toggle-plus"></use></svg></span>');
      }
      
      $filterRow.append($field).append($operator).append($values);
      $('#filters-table').append($filterRow);
      
      // Update available options
      this.updateFilterOptions();
      
      // Animate in
      $filterRow.hide().fadeIn(300);
      
      // Initialize the filter values based on operator
      this.updateFilterValues($operatorSelect);
    },

    // Update filter values based on operator
    updateFilterValues: function($operatorSelect) {
      var operator = $operatorSelect.val();
      var $valuesDiv = $operatorSelect.closest('.filter').find('.values');
      var $valueElements = $valuesDiv.find('.value');

      // Hide/show values based on operator
      if (operator === '*' || operator === '!*' || operator === 'o' || operator === 'c') {
        $valueElements.hide().prop('disabled', true);
      } else {
        $valueElements.show().prop('disabled', false);
      }

      // Handle date operators
      if (operator.indexOf('t') !== -1 || operator === 'nd' || operator === 'ld') {
        $valueElements.hide().prop('disabled', true);
      }
    },

    // Load remote options for select
    loadRemoteOptions: function($select) {
      var filterName = $select.attr('name').match(/v\[([^\]]+)\]/)[1];
      
      $.ajax({
        url: filtersUrl,
        data: {
          name: filterName
        },
        success: function(data) {
          $select.empty();
          if (data && data.length) {
            data.forEach(function(option) {
              $select.append('<option value="' + option[1] + '">' + option[0] + '</option>');
            });
          } else {
            $select.append('<option value="">No options available</option>');
          }
          $select.data('loaded', true);
        },
        error: function() {
          $select.empty().append('<option value="">Error loading options</option>');
        }
      });
    },

    // Update available filter options
    updateFilterOptions: function() {
      var usedFilters = [];
      $('.filter input[type="checkbox"]:checked').each(function() {
        usedFilters.push($(this).val());
      });

      $('#add_filter_select option').each(function() {
        var value = $(this).val();
        if (value && usedFilters.indexOf(value) !== -1) {
          $(this).prop('disabled', true);
        } else {
          $(this).prop('disabled', false);
        }
      });
    },

    // Apply filters
    applyFilters: function() {
      var $form = $('#query_form');
      
      // Show loading state
      this.showLoadingState($form);
      
      // Submit form
      $form.submit();
    },

    // Clear all filters
    clearFilters: function() {
      if (confirm('Are you sure you want to clear all filters?')) {
        $('.filter').not('#tr_status_id').fadeOut(300, function() {
          $(this).remove();
        });
        
        // Reset status filter to default
        $('#operators_status_id').val('o');
        $('#values_status_id_1').val('').hide().prop('disabled', true);
        
        this.updateFilterOptions();
      }
    },

    // Save custom query
    saveCustomQuery: function() {
      var queryName = prompt('Enter a name for this custom query:');
      if (queryName) {
        var $form = $('#query_form');
        var originalAction = $form.attr('action');
        
        $form.attr('action', '/queries/new');
        $form.append('<input type="hidden" name="query[name]" value="' + queryName + '">');
        
        this.showLoadingState($form);
        $form.submit();
      }
    },

    // Setup form validation
    setupFormValidation: function() {
      var self = this;

      // Validate required fields
      $('form').on('submit', function() {
        var isValid = true;
        
        $(this).find('input[required], select[required]').each(function() {
          if (!$(this).val()) {
            isValid = false;
            $(this).addClass('error');
            
            // Show error message
            var fieldName = $(this).attr('name') || 'This field';
            self.showErrorMessage(fieldName + ' is required');
          } else {
            $(this).removeClass('error');
          }
        });

        return isValid;
      });

      // Clear error state on input
      $(document).on('input change', 'input.error, select.error', function() {
        $(this).removeClass('error');
      });
    },

    // Setup autocomplete functionality
    setupAutoComplete: function() {
      // Text inputs with autocomplete
      $('input[data-autocomplete]').each(function() {
        var $input = $(this);
        var source = $input.data('autocomplete');
        
        $input.autocomplete({
          source: source,
          minLength: 2,
          delay: 300,
          select: function(event, ui) {
            $(this).val(ui.item.value);
          }
        });
      });
    },

    // Setup form persistence
    setupFormPersistence: function() {
      var self = this;
      var storageKey = 'redmine_calendar_filters';

      // Save form state
      $('form#query_form').on('change', 'input, select', function() {
        self.saveFormState(storageKey);
      });

      // Restore form state on page load
      this.restoreFormState(storageKey);
    },

    // Save form state to localStorage
    saveFormState: function(key) {
      try {
        var formData = {};
        $('#query_form').find('input, select').each(function() {
          var $element = $(this);
          var name = $element.attr('name');
          if (name && $element.val()) {
            formData[name] = $element.val();
          }
        });
        
        // Note: We can't use localStorage in Claude artifacts, but this would work in a real environment
        // localStorage.setItem(key, JSON.stringify(formData));
      } catch (e) {
        console.warn('Could not save form state:', e);
      }
    },

    // Restore form state from localStorage
    restoreFormState: function(key) {
      try {
        // Note: We can't use localStorage in Claude artifacts, but this would work in a real environment
        // var formData = JSON.parse(localStorage.getItem(key) || '{}');
        var formData = {};
        
        Object.keys(formData).forEach(function(name) {
          var $element = $('[name="' + name + '"]');
          if ($element.length) {
            $element.val(formData[name]);
          }
        });
      } catch (e) {
        console.warn('Could not restore form state:', e);
      }
    },

    // Utility functions
    showLoadingState: function($form) {
      $form.find('button, input[type="submit"], .icon').prop('disabled', true).addClass('loading');
      $('body').addClass('loading-cursor');
    },

    showErrorMessage: function(message) {
      // Create or update error message
      var $errorDiv = $('#form-errors');
      if (!$errorDiv.length) {
        $errorDiv = $('<div id="form-errors" class="error-message"></div>');
        $('form').prepend($errorDiv);
      }
      
      $errorDiv.text(message).fadeIn();
      
      // Auto-hide after 5 seconds
      setTimeout(function() {
        $errorDiv.fadeOut();
      }, 5000);
    },

    showSuccessMessage: function(message) {
      var $successDiv = $('<div class="success-message">' + message + '</div>');
      $('body').append($successDiv);
      
      $successDiv.fadeIn().delay(3000).fadeOut(function() {
        $(this).remove();
      });
    },

    // Form data utilities
    serializeFormToObject: function($form) {
      var formArray = $form.serializeArray();
      var formObject = {};
      
      formArray.forEach(function(item) {
        if (formObject[item.name]) {
          if (!Array.isArray(formObject[item.name])) {
            formObject[item.name] = [formObject[item.name]];
          }
          formObject[item.name].push(item.value);
        } else {
          formObject[item.name] = item.value;
        }
      });
      
      return formObject;
    },

    // Validate email format
    validateEmail: function(email) {
      var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    },

    // Validate date format
    validateDate: function(date) {
      var re = /^\d{4}-\d{2}-\d{2}$/;
      return re.test(date);
    }
  };

  // Initialize when DOM is ready
  $(document).ready(function() {
    JiraForms.init();
  });

  // Global function to add filters (for compatibility)
  window.addFilter = function(field, operator, values) {
    JiraForms.addFilter(field);
    
    if (operator) {
      $('#operators_' + field).val(operator);
      JiraForms.updateFilterValues($('#operators_' + field));
    }
    
    if (values && values.length) {
      var $valueSelect = $('#values_' + field + '_1');
      if ($valueSelect.length) {
        $valueSelect.val(values[0]);
      }
    }
  };

})(jQuery);