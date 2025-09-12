module JiraTheme
  module SettingsControllerPatch
    def self.included(base)
      base.class_eval do
        before_action :save_jira_theme_logos, only: [:plugin]
      end
    end

    private

    def save_jira_theme_logos
      # Only run for our plugin settings
      return unless params[:id] == 'redmine_jira_theme' && request.post? && params[:settings]

      # Handle theme color reset
      if params[:reset_theme_colors] == '1'
        # Get default settings from plugin definition
        plugin = Redmine::Plugin.find(:redmine_jira_theme)
        defaults = plugin.settings[:default]

        # Reset theme colors to defaults
        params[:settings]['theme_colors_light'] = defaults['theme_colors_light']
        params[:settings]['theme_colors_dark'] = defaults['theme_colors_dark']
        params[:settings]['auto_generate_dark'] = defaults['auto_generate_dark']
      end

      # Handle checkbox settings that don't get sent when unchecked
      params[:settings]['use_same_logo_for_dark'] = params[:settings]['use_same_logo_for_dark'] || '0'

      upload_dir = Rails.root.join('public/plugin_assets/redmine_jira_theme')
      FileUtils.mkdir_p(upload_dir)

      # -------------------------
      # Light logo
      # -------------------------
      if params[:logo_light].present? && params[:logo_light].is_a?(ActionDispatch::Http::UploadedFile)
        file = params[:logo_light]
        path = upload_dir.join('logo_light.png')
        File.open(path, 'wb') { |f| f.write(file.read) }
        params[:settings]['logo_light'] = "/plugin_assets/redmine_jira_theme/logo_light.png"
      elsif params[:settings]['remove_logo_light'] == '1'
        params[:settings]['logo_light'] = nil
      else
        params[:settings]['logo_light'] = Setting.plugin_redmine_jira_theme["logo_light"]
      end

      # -------------------------
      # Dark logo
      # -------------------------
      if params[:logo_dark].present? && params[:logo_dark].is_a?(ActionDispatch::Http::UploadedFile)
        file = params[:logo_dark]
        path = upload_dir.join('logo_dark.png')
        File.open(path, 'wb') { |f| f.write(file.read) }
        params[:settings]['logo_dark'] = "/plugin_assets/redmine_jira_theme/logo_dark.png"
      elsif params[:settings]['remove_logo_dark'] == '1'
        params[:settings]['logo_dark'] = nil
      else
        params[:settings]['logo_dark'] = Setting.plugin_redmine_jira_theme["logo_dark"]
      end
    end
  end
end