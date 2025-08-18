require 'redmine'
require_relative 'lib/jira_theme/hooks'
Redmine::Plugin.register :redmine_jira_theme do
  name 'Jira Theme Plugin'
  author 'Sivamanikandan'
  description 'Responsive Jira-like theme with light/dark modes and sidebar toggle'
  version '0.0.1'
  url 'http://example.com/path/to/plugin'
  author_url 'http://example.com/about'
  requires_redmine version_or_higher: '4.2.0'  # adjust if needed

  settings default: {
    'mode'               => 'system', # light|dark|system
    'allow_user_toggle'  => '1',
    'compact'            => '0',
    'remember_sidebar'   => '1'
  }, partial: 'settings/jira_theme'
end
