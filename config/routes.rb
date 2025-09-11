Rails.application.routes.draw do
  get "jira_theme/options", to: "inline#options", defaults: { format: 'json' }
  scope :jira_theme do
    patch "issues/:issue_id", to: "inline#update", as: "jira_theme_issue_update", defaults: { format: 'json' }
  end
end