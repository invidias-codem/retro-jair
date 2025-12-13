import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import './ConfirmationDialog.css';

/**
 * ConfirmationDialog - Modal for confirming side-effect actions
 * Displays action details and requires explicit user confirmation
 */
const ConfirmationDialog = ({ action, onConfirm, onReject }) => {
  if (!action) return null;

  const getIcon = () => {
    switch (action.type) {
      case 'calendar_event':
        return <AlertCircle size={24} className="icon-warning" />;
      case 'github_issue':
        return <AlertCircle size={24} className="icon-warning" />;
      case 'email':
        return <AlertCircle size={24} className="icon-warning" />;
      default:
        return <AlertCircle size={24} className="icon-warning" />;
    }
  };

  const getServiceColor = () => {
    switch (action.service) {
      case 'google-calendar':
        return '#4285F4';
      case 'github':
        return '#333';
      case 'email':
        return '#EA4335';
      default:
        return '#5f7db4';
    }
  };

  return (
    <div className="confirmation-overlay">
      <div className="confirmation-dialog" role="alertdialog" aria-modal="true">
        <div className="confirmation-header">
          <div className="confirmation-icon" style={{ color: getServiceColor() }}>
            {getIcon()}
          </div>
          <h2 className="confirmation-title">{action.title}</h2>
        </div>

        <div className="confirmation-content">
          <p className="confirmation-description">{action.description}</p>

          {action.data && (
            <div className="confirmation-details">
              <h3>Details:</h3>
              <dl>
                {Object.entries(action.data).map(([key, value]) => {
                  if (Array.isArray(value)) {
                    return (
                      <div key={key} className="detail-item">
                        <dt>{key}:</dt>
                        <dd>{value.join(', ')}</dd>
                      </div>
                    );
                  }
                  if (typeof value === 'object' && value !== null) {
                    return (
                      <div key={key} className="detail-item">
                        <dt>{key}:</dt>
                        <dd>{JSON.stringify(value)}</dd>
                      </div>
                    );
                  }
                  return (
                    <div key={key} className="detail-item">
                      <dt>{key}:</dt>
                      <dd>{String(value)}</dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          )}

          <div className="confirmation-warning">
            <AlertCircle size={16} />
            <span>This action cannot be undone. Please review carefully.</span>
          </div>
        </div>

        <div className="confirmation-actions">
          <button
            className="btn-reject"
            onClick={onReject}
            aria-label="Cancel action"
          >
            <XCircle size={18} />
            <span>Cancel</span>
          </button>
          <button
            className="btn-confirm"
            onClick={onConfirm}
            aria-label="Confirm action"
          >
            <CheckCircle size={18} />
            <span>Confirm</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
