// src/components/bottle_V1.1/tools/integrationTool.js

/**
 * IntegrationTool - Handles external service integrations (Google Calendar, GitHub, etc.)
 * Provides a unified interface for side-effect operations that require user confirmation.
 */

export class IntegrationTool {
  constructor({ onConfirmation, integrations = {} }) {
    this.onConfirmation = onConfirmation;
    this.integrations = integrations;
    this.pendingActions = [];
  }

  /**
   * Request user confirmation for an action
   * @param {object} action - { type, title, description, data, service }
   * @returns {Promise<boolean>} - true if confirmed, false if rejected
   */
  async requestConfirmation(action) {
    return new Promise((resolve) => {
      const confirmationRequest = {
        id: `${Date.now()}-${Math.random()}`,
        ...action,
        onConfirm: () => {
          this.pendingActions = this.pendingActions.filter(a => a.id !== confirmationRequest.id);
          resolve(true);
        },
        onReject: () => {
          this.pendingActions = this.pendingActions.filter(a => a.id !== confirmationRequest.id);
          resolve(false);
        },
      };

      this.pendingActions.push(confirmationRequest);
      if (this.onConfirmation) {
        this.onConfirmation(confirmationRequest);
      }
    });
  }

  /**
   * Create a Google Calendar event
   * @param {object} params - { title, description, startTime, endTime, attendees }
   * @returns {Promise<object>} - { success, eventId, message }
   */
  async createCalendarEvent(params) {
    const { title, description, startTime, endTime, attendees } = params;

    const confirmed = await this.requestConfirmation({
      type: 'calendar_event',
      service: 'google-calendar',
      title: 'Create Calendar Event',
      description: `Create event: "${title}" on ${new Date(startTime).toLocaleDateString()}`,
      data: { title, description, startTime, endTime, attendees },
    });

    if (!confirmed) {
      return { success: false, message: 'Calendar event creation cancelled' };
    }

    try {
      const response = await fetch('/api/calendar/create-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, startTime, endTime, attendees }),
      });

      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        eventId: data.eventId,
        message: `Event "${title}" created successfully`,
      };
    } catch (error) {
      console.error('Calendar event creation failed:', error);
      return {
        success: false,
        message: `Failed to create event: ${error.message}`,
      };
    }
  }

  /**
   * Create a GitHub issue
   * @param {object} params - { repo, title, body, labels, assignees }
   * @returns {Promise<object>} - { success, issueUrl, message }
   */
  async createGitHubIssue(params) {
    const { repo, title, body, labels, assignees } = params;

    const confirmed = await this.requestConfirmation({
      type: 'github_issue',
      service: 'github',
      title: 'Create GitHub Issue',
      description: `Create issue: "${title}" in ${repo}`,
      data: { repo, title, body, labels, assignees },
    });

    if (!confirmed) {
      return { success: false, message: 'GitHub issue creation cancelled' };
    }

    try {
      const response = await fetch('/api/github/create-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo, title, body, labels, assignees }),
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        issueUrl: data.issueUrl,
        message: `Issue created: ${data.issueUrl}`,
      };
    } catch (error) {
      console.error('GitHub issue creation failed:', error);
      return {
        success: false,
        message: `Failed to create issue: ${error.message}`,
      };
    }
  }

  /**
   * Send an email
   * @param {object} params - { to, subject, body, cc, bcc }
   * @returns {Promise<object>} - { success, message }
   */
  async sendEmail(params) {
    const { to, subject, body, cc, bcc } = params;

    const confirmed = await this.requestConfirmation({
      type: 'email',
      service: 'email',
      title: 'Send Email',
      description: `Send email to ${to} with subject: "${subject}"`,
      data: { to, subject, body, cc, bcc },
    });

    if (!confirmed) {
      return { success: false, message: 'Email sending cancelled' };
    }

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, body, cc, bcc }),
      });

      if (!response.ok) {
        throw new Error(`Email API error: ${response.statusText}`);
      }

      return {
        success: true,
        message: `Email sent to ${to}`,
      };
    } catch (error) {
      console.error('Email sending failed:', error);
      return {
        success: false,
        message: `Failed to send email: ${error.message}`,
      };
    }
  }

  /**
   * Get pending confirmations
   * @returns {Array} - Array of pending confirmation requests
   */
  getPendingConfirmations() {
    return [...this.pendingActions];
  }

  /**
   * Check if a service is available
   * @param {string} service - Service name (google-calendar, github, email)
   * @returns {boolean}
   */
  isServiceAvailable(service) {
    return !!this.integrations[service];
  }
}

export default IntegrationTool;
