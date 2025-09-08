module JiraTheme
  class ViewIssuesHook < Redmine::Hook::ViewListener
    render_on :view_issues_show_details_bottom, partial: 'jira_theme/inline_edit'
  end
end