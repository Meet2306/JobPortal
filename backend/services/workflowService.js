/**
 * APPLICATION WORKFLOW STATE MACHINE
 * Manages valid state transitions for job applications
 * 
 * STATE DIAGRAM:
 * Applied --> Shortlisted --> Interview Scheduled --> Selected
 *    |              |               |
 *    └──────────────┴───────────────┴----------> Rejected (terminal state)
 */

class ApplicationWorkflowEngine {
  // Valid state transitions
  static VALID_TRANSITIONS = {
    Applied: ['Shortlisted', 'Rejected'],
    Shortlisted: ['Interview Scheduled', 'Rejected'],
    'Interview Scheduled': ['Selected', 'Rejected'],
    Selected: [], // Terminal state
    Rejected: [], // Terminal state
  };

  // State properties
  static STATE_PROPERTIES = {
    Applied: {
      finalState: false,
      description: 'Application submitted by student',
    },
    Shortlisted: {
      finalState: false,
      description: 'Student has passed initial screening',
    },
    'Interview Scheduled': {
      finalState: false,
      description: 'Interview has been scheduled',
    },
    Selected: {
      finalState: true,
      description: 'Student has been selected - placement confirmed',
    },
    Rejected: {
      finalState: true,
      description: 'Application rejected - no further action possible',
    },
  };

  /**
   * Validate if transition is allowed
   * @param {string} fromStatus - Current status
   * @param {string} toStatus - Target status
   * @returns {Object} { allowed: boolean, reason: string }
   */
  static validateTransition(fromStatus, toStatus) {
    if (!this.VALID_TRANSITIONS[fromStatus]) {
      return {
        allowed: false,
        reason: `Invalid current status: ${fromStatus}`,
      };
    }

    if (!this.VALID_TRANSITIONS[fromStatus].includes(toStatus)) {
      return {
        allowed: false,
        reason: `Cannot transition from '${fromStatus}' to '${toStatus}'`,
      };
    }

    return { allowed: true };
  }

  /**
   * Check if status is a terminal state
   * @param {string} status
   * @returns {boolean}
   */
  static isTerminalState(status) {
    return this.STATE_PROPERTIES[status]?.finalState || false;
  }

  /**
   * Get available next states from current state
   * @param {string} currentStatus
   * @returns {array}
   */
  static getAvailableTransitions(currentStatus) {
    return this.VALID_TRANSITIONS[currentStatus] || [];
  }

  /**
   * Create status history entry
   * @param {string} status
   * @param {string} userId - User making the change
   * @param {string} remarks - Optional remarks for the status change
   * @returns {Object}
   */
  static createStatusHistoryEntry(status, userId, remarks = '') {
    return {
      status,
      changedAt: new Date(),
      changedBy: userId,
      remarks,
    };
  }

  /**
   * Process transition with validation
   * @param {Object} application - Application document
   * @param {string} newStatus - Target status
   * @param {string} userId - User making the change
   * @param {string} remarks - Optional remarks
   * @returns {Object} { success: boolean, error?: string, application?: Object }
   */
  static processTransition(application, newStatus, userId, remarks = '') {
    const validation = this.validateTransition(application.status, newStatus);

    if (!validation.allowed) {
      return {
        success: false,
        error: validation.reason,
      };
    }

    // Add to history
    const historyEntry = this.createStatusHistoryEntry(newStatus, userId, remarks);
    application.statusHistory.push(historyEntry);

    // Update current status
    const previousStatus = application.status;
    application.status = newStatus;

    // Handle terminal state logic
    if (newStatus === 'Selected') {
      application.selectedAt = new Date();
    } else if (newStatus === 'Rejected') {
      application.rejectedAt = new Date();
      application.rejectionReason = remarks || '';
    } else if (newStatus === 'Interview Scheduled') {
      // Interview scheduling requires additional details
      // handled by controller separately
    }

    return {
      success: true,
      message: `Status updated from '${previousStatus}' to '${newStatus}'`,
      application,
    };
  }

  /**
   * Admin override - with audit trail
   * @param {Object} application
   * @param {string} newStatus
   * @param {string} userId
   * @param {string} reason
   */
  static applyAdminOverride(application, newStatus, userId, reason) {
    const historyEntry = this.createStatusHistoryEntry(newStatus, userId, `[ADMIN OVERRIDE] ${reason}`);
    application.statusHistory.push(historyEntry);

    const previousStatus = application.status;
    application.status = newStatus;

    // Log override
    application.adminOverride = {
      overriddenBy: userId,
      overriddenAt: new Date(),
      reason,
      originalStatus: previousStatus,
    };

    return application;
  }

  /**
   * Get detailed state info
   * @param {string} status
   */
  static getStateInfo(status) {
    return {
      status,
      ...this.STATE_PROPERTIES[status],
      availableTransitions: this.getAvailableTransitions(status),
    };
  }
}

export default ApplicationWorkflowEngine;
