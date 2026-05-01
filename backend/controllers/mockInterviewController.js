const MockInterview = require('../models/MockInterview');
const StudentProfile = require('../models/StudentProfile');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

exports.createInterview = async (req, res) => {
    try {
        const { jobRole, difficulty } = req.body;

        if (!jobRole) {
            return res.status(400).json({ error: 'Job role is required' });
        }

        if (!genAI) {
            return res.status(500).json({ error: 'GEMINI_API_KEY is missing from environment variables.' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are an expert technical interviewer. Generate 3 interview questions for a candidate applying for the role of ${jobRole} at a ${difficulty || 'Medium'} difficulty level. 
Only output the questions separated by "|||". Do not include any other text, no numbers, no markdown formatting.
For example: What is hoisting in JS?|||Explain event loop.|||What are Closures?`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        let parsedQuestions = text.split("|||").map(q => q.trim()).filter(q => q.length > 0);

        // Fallback for unexpected formats
        if (parsedQuestions.length === 1 && text.includes('\n')) {
            parsedQuestions = text.split('\n').map(q => q.replace(/^\d+\.\s*/, '').trim()).filter(q => q.length > 0);
        }

        const questionsObj = parsedQuestions.map(q => ({
            question: q,
            answer: '',
            feedback: '',
            score: 0,
            isCompleted: false
        }));

        const newInterview = new MockInterview({
            student: req.user.id,
            jobRole,
            difficulty: difficulty || 'Medium',
            questions: questionsObj,
            status: 'Pending'
        });

        await newInterview.save();
        res.status(201).json({ message: 'Mock interview created', interview: newInterview });
    } catch (err) {
        console.error("Error creating mock interview:", err);
        res.status(500).json({ error: 'Failed to create mock interview. Please check your Gemini API key and quota.' });
    }
};

exports.submitAnswer = async (req, res) => {
    try {
        const { answer } = req.body;
        const { id: interviewId, questionId } = req.params;

        if (!answer || answer.trim() === '') {
            return res.status(400).json({ error: 'Answer cannot be empty' });
        }

        if (!genAI) {
            return res.status(500).json({ error: 'GEMINI_API_KEY is missing from environment variables.' });
        }

        const interview = await MockInterview.findById(interviewId);
        if (!interview) return res.status(404).json({ error: 'Interview not found' });

        if (interview.student.toString() !== req.user.id.toString()) {
            return res.status(403).json({ error: 'Unauthorized to modify this interview' });
        }

        const questionObj = interview.questions.id(questionId);
        if (!questionObj) return res.status(404).json({ error: 'Question not found' });

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are a technical interviewer evaluating a candidate for the role of ${interview.jobRole} at a ${interview.difficulty} difficulty level.
            The question asked was: "${questionObj.question}"
            The candidate answered: "${answer}"

            Evaluate the answer based STRICTLY on technical accuracy. Do NOT point out or correct any grammatical mistakes.
            Score the candidate's answer on a scale of 0 to 10 based on technical completeness.
            Under Feedback, briefly evaluate their answer, and then provide the exact, ideal correct answer to the question.

            Format your output EXACTLY like this:
            Score: <Score out of 10>
            Feedback: <Your technical evaluation, followed by the exact ideal answer>

            Do not include any other text before or after this format.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        let score = 0;
        let feedback = '';

        const scoreMatch = text.match(/Score:\s*(\d+(?:\.\d+)?)/i);
        if (scoreMatch) {
            score = parseFloat(scoreMatch[1]);
        }

        const feedbackMatch = text.match(/Feedback:\s*([\s\S]*)/i);
        if (feedbackMatch) {
            feedback = feedbackMatch[1].trim();
        } else {
            feedback = text; // Fallback
        }

        questionObj.answer = answer;
        questionObj.feedback = feedback;
        questionObj.score = score;
        questionObj.isCompleted = true;

        const allCompleted = interview.questions.every(q => q.isCompleted);
        if (allCompleted) {
            interview.status = 'Completed';
            const totalScore = interview.questions.reduce((sum, q) => sum + q.score, 0);
            interview.overallScore = totalScore / interview.questions.length;
        }

        await interview.save();
        res.json({ message: 'Answer evaluated successfully', interview });
    } catch (err) {
        console.error("Error evaluating answer:", err);
        res.status(500).json({ error: 'Failed to evaluate answer' });
    }
};

exports.getInterviews = async (req, res) => {
    try {
        const interviews = await MockInterview.find({ student: req.user.id }).sort({ createdAt: -1 });
        res.json(interviews);
    } catch (err) {
        console.error("Error fetching interviews:", err);
        res.status(500).json({ error: 'Failed to fetch interviews' });
    }
};

exports.getInterviewById = async (req, res) => {
    try {
        const interview = await MockInterview.findById(req.params.id);
        if (!interview) return res.status(404).json({ error: 'Interview not found' });

        if (interview.student.toString() !== req.user.id.toString()) {
            return res.status(403).json({ error: 'Unauthorized to view this interview' });
        }

        res.json(interview);
    } catch (err) {
        console.error("Error fetching interview:", err);
        res.status(500).json({ error: 'Failed to fetch interview' });
    }
};
