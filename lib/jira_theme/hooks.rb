module JiraTheme
  class Hooks < Redmine::Hook::ViewListener
    
    COMPONENT_MAPPING = {
      core: {
        css: ['jira_core', 'jira_layout', 'jira_header', 'jira_filters', 'jira_tables', 'jira_logo', 'jira_admin'],
        js: ['jira_core', 'jira_theme', 'jira_logo']
      },
      issues: {
        css: ['jira_issues', 'jira_tables', 'jira_forms'],
        js: ['jira_tables', 'jira_forms']
      },
      projects: {
        css: ['jira_projects', 'jira_tables', 'jira_forms'],
        js: ['jira_tables']
      },
      my: {
        css: ['jira_dashboard', 'jira_tables', 'jira_forms'],
        js: ['jira_tables']
      },
      admin: {
        css: ['jira_forms', 'jira_tables'],
        js: ['jira_forms', 'jira_tables']
      },
      account: {
        css: ['jira_forms', 'jira_login'],
        js: ['jira_forms', 'jira_login']
      },
      calendar: {
        css: ['jira_calendar'],
        js: ['jira_calendar', 'jira_filters']
      },
      sidebar: {
        css: ['jira_sidebar'],
        js: ['jira_sidebar']
      },
      mobile: {
        css: ['jira_mobile'],
        js: ['jira_responsive', 'jira_keyboard']
      },
      others: {
        css: ['jira_forms']
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
      # Logo handling - use custom logos if available, otherwise fallback to defaults
      logo_white_tag = get_logo_html('dark')
      logo_black_tag = get_logo_html('light')

      output << content_tag(:script, <<~JS.html_safe, type: 'text/javascript')
        window.PLUGIN_WHITE_LOGO_HTML = `#{logo_white_tag}`;
        window.PLUGIN_BLACK_LOGO_HTML = `#{logo_black_tag}`;
      JS

      # logo_white_tag = image_tag('logo-white.png', plugin: 'redmine_jira_theme', alt: 'Company Logo', id: 'plugin-white-logo', style: 'display:none;')
      # logo_black_tag = image_tag('logo-black.png', plugin: 'redmine_jira_theme', alt: 'Company Logo', id: 'plugin-dark-logo', style: 'display:none;')

      # output << content_tag(:script, <<~JS.html_safe, type: 'text/javascript')
      #   window.PLUGIN_WHITE_LOGO_HTML = `#{logo_white_tag}`;
      #   window.PLUGIN_BLACK_LOGO_HTML = `#{logo_black_tag}`;
      # JS
      
      output.join("\n").html_safe
    end
    
    def view_layouts_base_body_bottom(context = {})
      return '' unless jira_theme_enabled?
      content_tag(:script, raw(initialization_script), type: 'text/javascript')
    end
    
    private
    
    def jira_theme_enabled?
      defined?(Setting) &&
      Setting.respond_to?(:plugin_redmine_jira_theme) &&
      Setting.plugin_redmine_jira_theme['enabled'] == '1'
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
      else
        files.concat(COMPONENT_MAPPING[:others][:css])
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
      mode_setting = Setting.plugin_redmine_jira_theme['mode'] || 'system'
      allow_user_toggle = Setting.plugin_redmine_jira_theme['allow_user_toggle'] == '1'
      <<~JS
        (function() {
          try {
            window.ALLOWUSERTOGGLETHEME = #{allow_user_toggle};
            const pluginMode = '#{mode_setting}';
            function resolveTheme(mode) {
              localStorage.setItem('jiralike-theme', mode);
              if (mode === 'system') {
                return window.matchMedia &&
                  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              }
              return mode;
            }

            const theme = resolveTheme(pluginMode);
            document.documentElement.setAttribute('data-theme', theme);
            function applyBodyClasses() {
              if (!document.body) return; // wait until body exists
              document.body.classList.remove('jiralike-light','jiralike-dark');
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

    def get_logo_html(theme_type)
      options = {}
      options[:id] = theme_type == 'light' ? 'plugin-black-logo' : 'plugin-white-logo'
      if Setting.plugin_redmine_jira_theme["logo_#{theme_type}"].present?
       url = Setting.plugin_redmine_jira_theme["logo_#{theme_type}"]
      else
        url = theme_type == 'light' ? 'logo-black.png' : 'logo-white.png'
        options[:plugin]='redmine_jira_theme'
      end
      build_image_html(url, options)
    end

    def build_image_html(image_url, options = {})
      image_tag(image_url,options.merge!({alt: 'Company Logo', style: 'display:none;'}))
    end
  end
end