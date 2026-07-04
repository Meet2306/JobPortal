const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.evaluateResume = async (req, res) => {
    try {
        const { resumeText } = req.body;
        
        if (!resumeText) {
            return res.status(400).json({ error: "Resume text is required" });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "Gemini API key is not configured" });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });

                const prompt = `
You are a senior HR recruiter, ATS (Applicant Tracking System) expert, and technical hiring manager with 15+ years of experience in hiring for top tech companies.

Your job is to perform a DEEP, STRICT, and REAL-WORLD resume evaluation specifically tailored for FRESHERS, INTERNS, and ENTRY-LEVEL profiles.
Analyze the resume as if it is being scanned by modern ATS systems (like Workday, Greenhouse, Lever) and reviewed by a human recruiter for junior roles.

🔍 ANALYSIS REQUIREMENTS & FRESHER FOCUS:

1. ATS SCORE (out of 10)
- Adjust the scoring logic to reflect entry-level expectations (do NOT penalize for lacking full-time work experience).
- Consider keyword optimization, formatting, readability, and alignment with entry-level/intern roles.

2. KEYWORDS ANALYSIS
- Extract Technical and Soft skills.
- Extract Missing important keywords based on the current IT job market for entry-level profiles.

3. SECTION-WISE REVIEW
- Evaluate each section (Header, Summary/Objective, Skills, Projects, Education, Internships/Certifications).
- Identify issues and suggest exact improvements.
- IMPORTANT: Focus heavily on Education, Projects, and Internships. Ignore the lack of a formal "Work Experience" section.

4. ATS COMPATIBILITY CHECK
- Is it ATS-friendly? Identify problems like bad formatting, tables, missing keywords.

5. STRENGTHS
- What makes this resume good for a fresher or intern?

6. WEAKNESSES (VERY IMPORTANT)
- Be brutally honest but tailor it to entry-level expectations. Identify missing sections (like lack of personal projects or certifications), weak descriptions, lack of impact, etc.

7. BULLET POINT IMPROVEMENTS
- Rewrite 2–3 weak bullet points (from Projects, Education, or Internships) into strong, quantified, action-based points (Action Verb + Task + Result with metrics).

8. PROJECT ANALYSIS
- Check if projects are relevant, technically strong, and demonstrate practical application of skills. Suggest how to improve project descriptions.

9. FINAL SUGGESTIONS
- Actionable steps to increase ATS score to 8+/10 for a fresher profile.

10. JOB ROLE MATCHING
- Suggest best-fit entry-level or intern roles based on skills and resume quality.
Return ONLY valid JSON (no markdown formatting, no extra text) that corresponds to this exact schema:
{
    "ats_score": 0,
    "key_skills": {
        "technical": []
    },
    "ats_compatibility": {
        "is_ats_friendly": true,
        "issues": []
    },
    "section_wise_review": {
        "header": { "issues": [], "suggestions": [] },
        "summary": { "issues": [], "suggestions": [] },
        "skills": { "issues": [], "suggestions": [] },
        "projects": { "issues": [], "suggestions": [] },
        "education": { "issues": [], "suggestions": [] },
        "internships_and_certifications": { "issues": [], "suggestions": [] }
    },
    "strengths": [],
    "weaknesses": [],
    "project_analysis": {
        "feedback": "",
        "suggestions": []
    },
    "final_suggestions": [],
    "suitable_job_roles": []
}

Resume Text:
${resumeText}
`;

        let result;
        let responseText;
        let retries = 3;
        let lastGeminiError = null;

        while (retries > 0) {
            try {
                result = await model.generateContent(prompt);
                responseText = result.response.text();
                break; // If successful, exit the loop
            } catch (err) {
                lastGeminiError = err;
                // Check for Gemini API quota or service errors
                if (err.status === 429) {
                    return res.status(429).json({
                        error: "Gemini API quota exceeded. Please try again later or upgrade your plan."
                    });
                }
                if (err.status === 503) {
                    return res.status(503).json({
                        error: "Gemini API is currently unavailable due to high demand. Please try again later."
                    });
                }
                console.warn(`Gemini API call failed with error: ${err.message}. Retries left: ${retries - 1}`);
                if (retries === 1) {
                    console.error("All retries for Gemini API failed.");
                    throw err; // throw on last failure to be caught by the outer catch block
                }
                retries--;
                await new Promise(res => setTimeout(res, 2000)); // wait 2 seconds before retrying
            }
        }

        // Try to parse the text as JSON
        let jsonResult;
        try {
            // Remove markdown code blocks if any
            const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            jsonResult = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error("Failed to parse Gemini response as JSON", parseError);
            return res.status(500).json({
                error: "Failed to parse Gemini response",
                rawResponse: responseText
            });
        }

        return res.json(jsonResult);

    } catch (error) {
        // Enhanced error handling for Gemini API errors
        if (error && error.status === 429) {
            return res.status(429).json({
                error: "Gemini API quota exceeded. Please try again later or upgrade your plan."
            });
        }
        if (error && error.status === 503) {
            return res.status(503).json({
                error: "Gemini API is currently unavailable due to high demand. Please try again later."
            });
        }
        console.error("Error evaluating resume with Gemini:", error);
        return res.status(500).json({ error: "Internal server error during Gemini analysis", details: error.message, stack: error.stack });
    }
};
