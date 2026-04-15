const mongoose = require('mongoose');

const mockInterviewSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobRole: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    questions: [{
        question: { type: String, required: true },
        answer: { type: String, default: '' },
        feedback: { type: String, default: '' },
        score: { type: Number, default: 0 },
        isCompleted: { type: Boolean, default: false }
    }],
    overallScore: { type: Number, default: 0 },
    status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('MockInterview', mockInterviewSchema);
