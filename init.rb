
require 'securerandom'
Redmine::Plugin.register :redmine_jira_theme do
  name 'Jira Theme Plugin'
  author 'Sivamanikandan'
  description 'Responsive Jira-like theme with light/dark modes and sidebar toggle'
  version '0.0.1'
  url 'https://github.com/sivamca19/redmine_jira_theme'
  author_url 'https://github.com/sivamca19'
  requires_redmine version_or_higher: '4.2.0'  # adjust if needed

  tracker_colors = {}
  Tracker.all.each do |status|
    tracker_colors[status.name] = "##{SecureRandom.hex(3)}"
  end

  status_colors = {}
  IssueStatus.all.each do |status|
    status_colors[status.name] = "##{SecureRandom.hex(3)}"
  end

  priority_colors = {}
  IssuePriority.all.each do |status|
    priority_colors[status.name] = "##{SecureRandom.hex(3)}"
  end
  settings default: {
    'enabled'            => '1',
    'mode'               => 'system', # light|dark|system
    'allow_user_toggle'  => '1',
    'remember_sidebar'   => '1',
    'logo_light'         => nil,
    'logo_dark'          => nil,
    'tracker_colors'     => tracker_colors,
    'status_colors'      => status_colors,
    'priority_colors'    => priority_colors,
    'auto_generate_dark' => '1',
    'use_same_logo_for_dark' => '1',
    'theme_colors_light' => {
      'primary'          => '#285236',
      'primary_hover'    => '#2b8248',
      'bg'               => '#e5f0e9',
      'border'           => '#acd2b9',
      'transparent'      => 'rgba(229, 240, 233, .72)',
      'radius'           => '8px'
    },
    'theme_colors_dark'  => {
      'primary'          => '#2b8248',
      'primary_hover'    => '#3ea05a',
      'bg'               => '#1a2920',
      'border'           => '#4a6b52',
      'transparent'      => 'rgba(43, 130, 72, .2)'
    }
  }, partial: 'settings/jira_theme'
end

require 'redmine'
require_relative 'lib/jira_theme/hooks'
require_relative 'lib/jira_theme/view_issues_hook'
require_relative 'lib/jira_theme/settings_controller_patch'
SettingsController.send(:include, JiraTheme::SettingsControllerPatch) unless SettingsController.included_modules.include?(JiraTheme::SettingsControllerPatch)