module JiraTheme
  class Hooks < Redmine::Hook::ViewListener

    COMPONENT_MAPPING = {
      core: {
        css: ['jira_core', 'jira_layout', 'jira_header', 'jira_filters', 'jira_tables', 'jira_logo', 'jira_admin'],
        js: ['jira_core', 'jira_theme', 'jira_logo', 'jira_nav_dropdown']
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

      # Dynamic theme colors CSS
      output << content_tag(:style, raw(dynamic_theme_css), type: 'text/css')

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
      remember_sidebar = Setting.plugin_redmine_jira_theme['remember_sidebar'] == '1'
      <<~JS
        (function() {
          try {
            window.ALLOWUSERTOGGLETHEME = #{allow_user_toggle};
            window.REMEMBERSIDEBAR = #{remember_sidebar};
            window.trackerColors = #{(Setting.plugin_redmine_jira_theme['tracker_colors'] || {}).to_json.html_safe};
            window.statusColors = #{(Setting.plugin_redmine_jira_theme['status_colors'] || {}).to_json.html_safe};
            window.priorityColors = #{(Setting.plugin_redmine_jira_theme['priority_colors'] || {}).to_json.html_safe};
            const pluginMode = '#{mode_setting}';
            function resolveTheme(mode) {
              const currentTheme = localStorage.getItem('jiralike-theme') || mode;
              localStorage.setItem('jiralike-theme', currentTheme);
              if (currentTheme === 'system') {
                return window.matchMedia &&
                  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              }
              return currentTheme;
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

      # Check if we should use the same logo for both themes
      use_same_logo = Setting.plugin_redmine_jira_theme['use_same_logo_for_dark'] != '0'

      # If use_same_logo is enabled and this is dark theme, use light theme logo
      actual_theme_type = (use_same_logo && theme_type == 'dark') ? 'light' : theme_type

      if Setting.plugin_redmine_jira_theme["logo_#{actual_theme_type}"].present?
        url = Setting.plugin_redmine_jira_theme["logo_#{actual_theme_type}"]
      else
        # Use default logos, but if using same logo for dark, use light default
        if use_same_logo && theme_type == 'dark'
          url = 'logo-black.png'  # Use light theme default for dark theme
        else
          url = theme_type == 'light' ? 'logo-black.png' : 'logo-white.png'
        end
        options[:plugin] = 'redmine_jira_theme'
      end
      build_image_html(url, options)
    end

    def build_image_html(image_url, options = {})
      image_tag(image_url,options.merge!({alt: 'Company Logo', style: 'display:none;'}))
    end

    def dynamic_theme_css
      settings = Setting.plugin_redmine_jira_theme
      light_colors = settings['theme_colors_light'] || {}
      dark_colors = settings['theme_colors_dark'] || {}
      auto_generate = settings['auto_generate_dark'] == '1'

      # Generate dark colors automatically if enabled
      if auto_generate && light_colors['primary']
        dark_colors = generate_dark_colors(light_colors)
      end

      css = []

      # Light theme overrides
      if light_colors.any?
        css << ":root {"
        css << generate_light_theme_variables(light_colors)
        css << "}"
      end

      # Dark theme overrides
      if dark_colors.any?
        css << "html[data-theme=\"dark\"], body[data-theme=\"dark\"], .theme-dark {"
        css << generate_dark_theme_variables(dark_colors)
        css << "}"
      end

      css.join("\n")
    end

    def generate_light_theme_variables(colors)
      variables = []

      # Core colors
      if colors['primary']
        variables << "  --jira-primary: #{colors['primary']};"
        variables << "  --jira-link: #{colors['primary']};"
        variables << "  --jira-border-focus: #{colors['primary_hover'] || brighten_color(colors['primary'], 0.1)};"
        variables << "  --jira-success: #{colors['primary_hover'] || brighten_color(colors['primary'], 0.1)};"
        variables << "  --jira-info: #{colors['primary_hover'] || brighten_color(colors['primary'], 0.1)};"
      end

      if colors['primary_hover']
        variables << "  --jira-primary-hover: #{colors['primary_hover']};"
      elsif colors['primary']
        variables << "  --jira-primary-hover: #{brighten_color(colors['primary'], 0.1)};"
      end

      if colors['bg']
        variables << "  --jira-bg: #{colors['bg']};"
        variables << "  --jira-surface: #ffffff;"
        variables << "  --jira-surface-alt: #{lighten_color(colors['bg'], 0.3)};"
        variables << "  --jira-surface-raised: #ffffff;"
        variables << "  --jira-bg-alt: #{darken_color(colors['bg'], 0.1)};" if colors['bg']

        # Generate hover color with transparency
        if colors['primary']
          rgb = hex_to_rgb(colors['primary'])
          variables << "  --jira-hover: rgba(#{rgb[:r]}, #{rgb[:g]}, #{rgb[:b]}, 0.1);"
        else
          variables << "  --jira-hover: rgba(229, 240, 233, 0.72);"
        end
      end

      if colors['border']
        variables << "  --jira-border: #{colors['border']};"
        variables << "  --jira-tab-hover: #{colors['border']};"
      end

      # Generate text colors based on primary
      if colors['primary']
        variables << "  --jira-text: #{colors['primary']};"
        variables << "  --jira-text-secondary: #{darken_color(colors['primary'], 0.2)};"
        variables << "  --jira-text-muted: #{lighten_color(colors['primary'], 0.3)};"
      end

      # Static colors
      variables << "  --jira-btn-text: #ffffff;"
      variables << "  --jira-warning: #ffab00;"
      variables << "  --jira-error: #de350b;"
      variables << "  --jira-danger: #d73527;"
      variables << "  --jira-success-hover: #00a86b;"
      variables << "  --jira-surface-dark: #333333;"

      # Generate shadows based on primary color
      if colors['primary']
        rgb = hex_to_rgb(colors['primary'])
        variables << "  --jira-shadow-sm: 0 1px 1px rgba(#{rgb[:r]}, #{rgb[:g]}, #{rgb[:b]}, 0.08);"
        variables << "  --jira-shadow-md: 0 2px 4px rgba(#{rgb[:r]}, #{rgb[:g]}, #{rgb[:b]}, 0.13);"
        variables << "  --jira-shadow-lg: 0 8px 16px rgba(#{rgb[:r]}, #{rgb[:g]}, #{rgb[:b]}, 0.15);"
      end

      variables << "  --jira-radius: #{colors['radius'] || '8px'};"

      variables.join("\n")
    end

    def generate_dark_theme_variables(colors)
      variables = []

      # Core colors
      if colors['primary']
        variables << "  --jira-primary: #{colors['primary']};"
        variables << "  --jira-link: #{colors['primary']};"
        variables << "  --jira-border-focus: #{colors['primary_hover'] || brighten_color(colors['primary'], 0.2)};"
        variables << "  --jira-success: #{colors['primary_hover'] || brighten_color(colors['primary'], 0.2)};"
        variables << "  --jira-info: #{colors['primary_hover'] || brighten_color(colors['primary'], 0.2)};"
      end

      if colors['primary_hover']
        variables << "  --jira-primary-hover: #{colors['primary_hover']};"
      elsif colors['primary']
        variables << "  --jira-primary-hover: #{brighten_color(colors['primary'], 0.2)};"
      end

      if colors['bg']
        variables << "  --jira-bg: #{colors['bg']};"
        variables << "  --jira-surface: #{brighten_color(colors['bg'], 0.1)};"
        variables << "  --jira-surface-alt: #{brighten_color(colors['bg'], 0.15)};"
        variables << "  --jira-surface-raised: #{brighten_color(colors['bg'], 0.2)};"
        variables << "  --jira-bg-alt: #{darken_color(colors['bg'], 0.1)};"

        # Generate hover color with transparency
        if colors['primary']
          rgb = hex_to_rgb(colors['primary'])
          variables << "  --jira-hover: rgba(#{rgb[:r]}, #{rgb[:g]}, #{rgb[:b]}, 0.2);"
        else
          variables << "  --jira-hover: rgba(43, 130, 72, 0.2);"
        end
      end

      if colors['border']
        variables << "  --jira-border: #{colors['border']};"
        variables << "  --jira-tab-hover: #{colors['border']};"
      end

      # Generate text colors for dark theme
      if colors['primary']
        variables << "  --jira-text: #{lighten_color(colors['primary'], 0.6)};"
        variables << "  --jira-text-secondary: #{lighten_color(colors['primary'], 0.4)};"
        variables << "  --jira-text-muted: #{lighten_color(colors['primary'], 0.2)};"
      end

      # Static colors for dark theme
      variables << "  --jira-btn-text: #ffffff;"
      variables << "  --jira-warning: #f5cd47;"
      variables << "  --jira-error: #f87462;"
      variables << "  --jira-danger: #f87462;"
      variables << "  --jira-success-hover: #4ade80;"
      variables << "  --jira-surface-dark: #1a1a1a;"

      # Dark theme shadows
      variables << "  --jira-shadow-sm: 0 1px 1px rgba(0, 0, 0, 0.3);"
      variables << "  --jira-shadow-md: 0 2px 4px rgba(0, 0, 0, 0.4);"
      variables << "  --jira-shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.5);"

      variables << "  --jira-radius: #{colors['radius'] || '8px'};"

      variables.join("\n")
    end

    def generate_dark_colors(light_colors)
      # Simple algorithm to generate dark theme from light theme
      colors = {}

      if light_colors['primary']
        # Make primary color brighter for dark theme
        colors['primary'] = brighten_color(light_colors['primary'], 0.2)
        colors['primary_hover'] = brighten_color(light_colors['primary'], 0.4)
      end

      if light_colors['bg']
        # Make background much darker
        colors['bg'] = darken_color(light_colors['bg'], 0.8)
      end

      if light_colors['border']
        # Make border darker but still visible
        colors['border'] = darken_color(light_colors['border'], 0.6)
      end

      # Generate transparent color
      if colors['primary']
        rgb = hex_to_rgb(colors['primary'])
        colors['transparent'] = "rgba(#{rgb[:r]}, #{rgb[:g]}, #{rgb[:b]}, 0.2)"
      end

      colors
    end


    def hex_to_rgb(hex)
      hex = hex.gsub('#', '')
      {
        r: hex[0..1].to_i(16),
        g: hex[2..3].to_i(16),
        b: hex[4..5].to_i(16)
      }
    end

    def rgb_to_hex(r, g, b)
      "#%02x%02x%02x" % [r.round, g.round, b.round]
    end

    def darken_color(hex, factor)
      rgb = hex_to_rgb(hex)
      rgb_to_hex(
        rgb[:r] * (1 - factor),
        rgb[:g] * (1 - factor),
        rgb[:b] * (1 - factor)
      )
    end

    def brighten_color(hex, factor)
      rgb = hex_to_rgb(hex)
      rgb_to_hex(
        [rgb[:r] + (255 - rgb[:r]) * factor, 255].min,
        [rgb[:g] + (255 - rgb[:g]) * factor, 255].min,
        [rgb[:b] + (255 - rgb[:b]) * factor, 255].min
      )
    end

    def lighten_color(hex, factor)
      brighten_color(hex, factor)
    end
  end
end