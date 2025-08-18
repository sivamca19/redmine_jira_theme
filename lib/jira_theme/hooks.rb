# lib/jira_theme/hooks.rb
module JiraTheme
  class Hooks < Redmine::Hook::ViewListener
    
    COMPONENT_MAPPING = {
      core: {
        css: ['jira_core', 'jira_layout', 'jira_header', 'jira_filters', 'jira_tables'],
        js: ['jira_core', 'jira_theme']
      },
      issues: {
        css: ['jira_issues', 'jira_tables'],
        js: ['jira_tables', 'jira_forms']
      },
      projects: {
        css: ['jira_projects', 'jira_tables'],
        js: ['jira_tables']
      },
      my: {
        css: ['jira_dashboard', 'jira_tables'],
        js: ['jira_tables']
      },
      admin: {
        css: ['jira_forms', 'jira_tables'],
        js: ['jira_forms', 'jira_tables']
      },
      account: {
        css: ['jira_forms'],
        js: ['jira_forms']
      },
      calendar: {
        css: ['jira_calendar'],
        js: ['jira_calendar', 'jira_filters']
      },
      gantt: {
        css: ['jira_gantt']
      },
      sidebar: {
        css: ['jira_sidebar'],
        js: ['jira_sidebar']
      },
      mobile: {
        css: ['jira_mobile'],
        js: ['jira_responsive', 'jira_keyboard']
      }
    }.freeze
    
    def view_layouts_base_html_head(context = {})
      return '' unless jira_theme_enabled?
      
      controller = get_controller(context)
      action     = get_action(context)
      
      css_files = get_css_files_for_page(controller, action)
      js_files  = get_js_files_for_page(controller, action)
      
      output = []
      
      css_files.each do |file|
        output << stylesheet_link_tag(file, plugin: 'redmine_jira_theme')
      end
      
      js_files.each do |file|
        output << javascript_include_tag(file, plugin: 'redmine_jira_theme')
      end
      
      # Proper viewport meta
      output << tag.meta(
        name: 'viewport',
        content: 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes'
      )
      
      # Theme detection script
      output << content_tag(:script, raw(theme_detection_script), type: 'text/javascript')
      
      output.join("\n").html_safe
    end
    
    def view_layouts_base_body_bottom(context = {})
      return '' unless jira_theme_enabled?
      content_tag(:script, raw(initialization_script), type: 'text/javascript')
    end
    
    private
    
    def jira_theme_enabled?
      defined?(Setting) && Setting.respond_to?(:plugin_redmine_jira_theme)
    end
    
    def get_controller(context)
      if context[:controller]
        context[:controller].controller_name.to_s
      elsif context[:request]
        context[:request].params[:controller]
      else
        'unknown'
      end
    end
    
    def get_action(context)
      if context[:controller]
        context[:controller].action_name.to_s
      elsif context[:request]
        context[:request].params[:action]
      else
        'index'
      end
    end
    
    def get_css_files_for_page(controller, action)
      files = COMPONENT_MAPPING[:core][:css].dup
      
      case controller.to_s
      when 'issues'   
        files.concat(COMPONENT_MAPPING[:issues][:css])
        # Add calendar CSS when viewing calendar
        if action == 'calendar'
          files.concat(COMPONENT_MAPPING[:calendar][:css])
        end
      when 'projects' 
        files.concat(COMPONENT_MAPPING[:projects][:css])
      when 'my'       
        files.concat(COMPONENT_MAPPING[:my][:css])
      when 'calendars'
        files.concat(COMPONENT_MAPPING[:calendar][:css])
      when 'admin', 'settings', 'users', 'groups', 'roles'
        files.concat(COMPONENT_MAPPING[:admin][:css])
      when 'account'
        files.concat(COMPONENT_MAPPING[:account][:css])
      when 'gantts'
        files.concat(COMPONENT_MAPPING[:gantt][:css])
      end
      
      files.concat(COMPONENT_MAPPING[:sidebar][:css])
      files.concat(COMPONENT_MAPPING[:mobile][:css])
      files.uniq
    end
    
    def get_js_files_for_page(controller, action)
      files = COMPONENT_MAPPING[:core][:js].dup
      
      case controller.to_s
      when 'issues'   
        files.concat(COMPONENT_MAPPING[:issues][:js])
        # Add calendar JS when viewing calendar
        if action == 'calendar'
          files.concat(COMPONENT_MAPPING[:calendar][:js])
        end
      when 'projects' 
        files.concat(COMPONENT_MAPPING[:projects][:js])
      when 'my'       
        files.concat(COMPONENT_MAPPING[:my][:js])
      when 'calendars'
        files.concat(COMPONENT_MAPPING[:calendar][:js])
      when 'admin', 'settings', 'users', 'groups', 'roles'
        files.concat(COMPONENT_MAPPING[:admin][:js])
      when 'account'
        files.concat(COMPONENT_MAPPING[:account][:js])
      end
      
      files.concat(COMPONENT_MAPPING[:sidebar][:js])
      files.concat(COMPONENT_MAPPING[:mobile][:js])
      files.uniq
    end
    
    def theme_detection_script
      <<~JS
        (function() {
          try {
            const savedTheme = localStorage.getItem('jiralike-theme') || 'system';
            const systemTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            const theme = savedTheme === 'system' ? systemTheme : savedTheme;

            document.documentElement.setAttribute('data-theme', theme);

            function applyBodyClasses() {
              if (!document.body) return; // wait until body exists

              document.body.classList.add('jiralike', 'jiralike-' + theme);

              const isMobile = window.innerWidth < 768;
              const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

              if (isMobile) {
                document.body.classList.add('jl-mobile');
                setTimeout(() => {
                  const sidebar = document.getElementById('sidebar');
                  if (sidebar && sidebar.innerHTML.trim()) {
                    document.documentElement.classList.add('jl-sidebar-collapsed');
                  }
                }, 10);
              } else if (isTablet) {
                document.body.classList.add('jl-tablet');
              } else {
                document.body.classList.add('jl-desktop');
              }
            }

            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', applyBodyClasses);
            } else {
              applyBodyClasses();
            }
          } catch (e) {
            console.error('JiraTheme: initial setup failed:', e);
          }
        })();
      JS
    end

    
    def initialization_script
      <<~JS
        document.addEventListener('DOMContentLoaded', function() {
          try {
            if (window.JiraTheme && typeof window.JiraTheme.init === 'function') {
              window.JiraTheme.init();
            }
          } catch (e) {
            console.error('JiraTheme: DOM ready initialization error:', e);
          }
        });
        
        document.addEventListener('visibilitychange', function() {
          if (document.visibilityState === 'visible' && window.JiraTheme) {
            if (typeof window.JiraTheme.handleResponsive === 'function') {
              window.JiraTheme.handleResponsive();
            }
          }
        });
      JS
    end
  end
end