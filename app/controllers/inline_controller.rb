class InlineController < ApplicationController
  before_action :find_issue
  before_action :find_project_from_association
  before_action :authorize_view, only: [:options]
  before_action :authorize_edit, only: [:update]

  accept_api_auth :options, :update
  skip_before_action :verify_authenticity_token, if: :api_request?

  def options
    case params[:field]
    when "status_id"
      render json: @issue.new_statuses_allowed_to(User.current).map { |s| { id: s.id, name: s.name } }
    when "assigned_to_id"
      render json: @issue.assignable_users.map { |u| { id: u.id, name: u.name } }
    when "priority_id"
      render json: IssuePriority.active.map { |p| { id: p.id, name: p.name } }
    else
      render json: []
    end
  end

  def update
    @issue.init_journal(User.current)
    @issue.assign_attributes(issue_params.to_h)

    if @issue.save
      field = issue_params.keys.first
      updated_text = case field
      when 'status_id'
        @issue.status.name
      when 'assigned_to_id'
        @issue.assigned_to&.name || 'Unassigned'
      when 'priority_id'
        @issue.priority.name
      end

      render json: { success: true, updated_text: updated_text }
    else
      render json: { success: false, errors: @issue.errors.full_messages }, status: :unprocessable_entity
    end
  rescue => e
    render json: { success: false, error: "Update failed #{e.message}" }, status: :forbidden
  end

  private

  def find_issue
    @issue = Issue.find(params[:issue_id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Issue not found" }, status: :not_found
  end

  def find_project_from_association
    @project = @issue.project if @issue
  end

  def authorize_view
    unless User.current.allowed_to?(:view_issues, @project)
      render json: { error: "Access denied" }, status: :forbidden
    end
  end

  def authorize_edit
    unless User.current.allowed_to?(:edit_issues, @project) ||
           (User.current.allowed_to?(:edit_own_issues, @project) && @issue.author == User.current)
      render json: { error: "Edit permission denied" }, status: :forbidden
    end
  end

  def issue_params
    params.require(:issue).permit(:assigned_to_id, :status_id, :priority_id)
  end
end