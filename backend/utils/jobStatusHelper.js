const Application = require('../models/Application');

/**
 * Updates a job's status based on current date and application count.
 * Logic:
 * 1. If positionsFilled logic is prioritized: If apps >= requiredStudents -> 'Positions Filled'
 * 2. Else by date:
 *    - Now < StartDate -> 'Upcoming'
 *    - Now >= StartDate AND Now <= CloseDate -> 'Open'
 *    - Now > CloseDate -> 'Closed'
 */
const updateJobStatus = async (job) => {
    // Only update status for jobs that are already approved/Live
    if (['Pending Approval', 'Rejected'].includes(job.status)) {
        return job.status;
    }

    const now = new Date();
    const appCount = await Application.countDocuments({ job: job._id });

    // Step 1: Check if positions are filled
    if (appCount >= job.requiredStudents) {
        if (job.status !== 'Positions Filled') {
            job.status = 'Positions Filled';
            await job.save();
        }
        return job.status;
    }

    // Step 2: Check by date
    let newStatus = job.status;
    if (!job.appStartDate || !job.appCloseDate) {
        // Fallback for legacy jobs: if no dates, assume Open if not already Closed/Filled
        if (job.status === 'Upcoming') newStatus = 'Open';
    } else {
        if (now < job.appStartDate) {
            newStatus = 'Upcoming';
        } else if (now >= job.appStartDate && now <= job.appCloseDate) {
            newStatus = 'Open';
        } else if (now > job.appCloseDate) {
            newStatus = 'Closed';
        }
    }

    if (job.status !== newStatus) {
        job.status = newStatus;
        await job.save();
    }

    return newStatus;
};

module.exports = { updateJobStatus };
