/**
 * ELIGIBILITY RULE ENGINE
 * Determines if a student is eligible to apply for a specific job
 * Rules are evaluated server-side to prevent client-side manipulation
 */

class EligibilityRuleEngine {
  /**
   * Check if student is eligible for a job
   * @param {Object} student - Student document
   * @param {Object} job - Job document
   * @returns {Object} { isEligible: boolean, reasons: string[] }
   */
  static evaluateEligibility(student, job) {
    const reasons = [];

    // Rule 1: Student profile must be verified
    if (!student.profileVerified) {
      reasons.push('Your profile has not been verified by the admin');
      return { isEligible: false, reasons };
    }

    // Rule 2: Student can only apply after verification unlock
    if (!student.canApply) {
      reasons.push('You are not eligible to apply yet. Contact TPO.');
      return { isEligible: false, reasons };
    }

    // Rule 3: Check CGPA requirement
    const criteria = job.eligibilityCriteria;
    if (criteria.minimumCgpa && student.cgpa < criteria.minimumCgpa) {
      reasons.push(
        `Your CGPA (${student.cgpa}) is below the minimum required (${criteria.minimumCgpa})`
      );
    }

    // Rule 4: Check Branch eligibility
    if (
      criteria.allowedBranches &&
      criteria.allowedBranches.length > 0 &&
      !criteria.allowedBranches.includes('All')
    ) {
      if (!criteria.allowedBranches.includes(student.branch)) {
        reasons.push(
          `Your branch (${student.branch}) is not eligible. Required: ${criteria.allowedBranches.join(
            ', '
          )}`
        );
      }
    }

    // Rule 5: Check Backlog limit
    if (criteria.maxBacklogs !== undefined && student.backlogs > criteria.maxBacklogs) {
      reasons.push(
        `Your backlogs (${student.backlogs}) exceed the limit (${criteria.maxBacklogs})`
      );
    }

    // Rule 6: Check Passing Year eligibility
    if (
      criteria.allowedPassingYears &&
      criteria.allowedPassingYears.length > 0 &&
      !criteria.allowedPassingYears.includes(student.passingYear)
    ) {
      reasons.push(
        `Your passing year (${student.passingYear}) is not eligible. Required: ${criteria.allowedPassingYears.join(
          ', '
        )}`
      );
    }

    // Rule 7: Check placement status (one-student-one-offer policy - OPTIONAL)
    // Uncomment to enable this rule
    /*
    if (student.placementStatus === 'Placed' || student.placementStatus === 'Offer Received') {
      reasons.push('You are already placed or have a pending offer. You cannot apply for more jobs.');
    }
    */

    return {
      isEligible: reasons.length === 0,
      reasons,
    };
  }

  /**
   * Get eligible jobs for a student
   * @param {Object} student - Student document
   * @param {Array} jobs - Array of job documents
   * @returns {Array} Array of eligible job IDs
   */
  static getEligibleJobs(student, jobs) {
    return jobs
      .filter((job) => {
        const { isEligible } = this.evaluateEligibility(student, job);
        return isEligible;
      })
      .map((job) => job._id);
  }

  /**
   * Filter eligibility violations
   * @param {Object} eligibilityResult
   * @returns {Array} Array of violation messages
   */
  static getViolations(eligibilityResult) {
    return eligibilityResult.isEligible ? [] : eligibilityResult.reasons;
  }

  /**
   * Create custom eligibility criteria for job
   * @param {Object} criteria
   * @returns {Object} Validated criteria
   */
  static validateCriteria(criteria) {
    const validated = {};

    // CGPA check
    if (criteria.minimumCgpa !== undefined) {
      if (criteria.minimumCgpa < 0 || criteria.minimumCgpa > 10) {
        throw new Error('CGPA must be between 0 and 10');
      }
      validated.minimumCgpa = criteria.minimumCgpa;
    }

    // Branches check
    const validBranches = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'OTHER', 'All'];
    if (criteria.allowedBranches && Array.isArray(criteria.allowedBranches)) {
      const invalidBranches = criteria.allowedBranches.filter((b) => !validBranches.includes(b));
      if (invalidBranches.length > 0) {
        throw new Error(`Invalid branches: ${invalidBranches.join(', ')}`);
      }
      validated.allowedBranches = criteria.allowedBranches;
    }

    // Backlogs check
    if (criteria.maxBacklogs !== undefined) {
      if (criteria.maxBacklogs < 0) {
        throw new Error('Max backlogs cannot be negative');
      }
      validated.maxBacklogs = criteria.maxBacklogs;
    }

    // Passing years check
    if (criteria.allowedPassingYears && Array.isArray(criteria.allowedPassingYears)) {
      const currentYear = new Date().getFullYear();
      const invalidYears = criteria.allowedPassingYears.filter(
        (year) => year < 2015 || year > currentYear + 1
      );
      if (invalidYears.length > 0) {
        throw new Error(`Invalid passing years: ${invalidYears.join(', ')}`);
      }
      validated.allowedPassingYears = criteria.allowedPassingYears;
    }

    return validated;
  }
}

export default EligibilityRuleEngine;
