Rails.application.routes.draw do
  get "jira_theme/options", to: "inline#options"
  scope :jira_theme do
    patch "issues/:issue_id", to: "inline#update", as: "jira_theme_issue_update"
  end
end