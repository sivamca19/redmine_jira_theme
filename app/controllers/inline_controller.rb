class InlineController < ApplicationController
  before_action :find_issue

  def options
    field = params[:field]
    case field
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
    @issue.assign_attributes(issue_params.to_h)
    if @issue.save
      render json: { success: true, issue: @issue }
    else
      render json: { success: false, errors: @issue.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def find_issue
    @issue = Issue.find(params[:issue_id])
  end

  def issue_params
    params.require(:issue).permit(:assigned_to_id, :status_id, :priority_id, :tracker_id, :subject, :description) 
  end
end