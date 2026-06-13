const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API client if API key is provided
let genAI = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE') {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

/**
 * Evaluates the match between a student's resume/profile and a job description.
 * Uses Google Gemini API to analyze strengths/gaps and returns structured recommendations.
 * 
 * @param {string} studentProfileText Skills, branch, and resume details
 * @param {string} jobDescription Details, requirements, and responsibilities
 * @returns {Promise<{matchScore: number, recommendedKeywords: string[], matchFeedback: string}>}
 */
const evaluateResumeMatch = async (studentProfileText, jobDescription) => {
  if (!genAI) {
    console.log('Gemini API Key missing or mock mode active. Generating fallback mock match...');
    return getMockMatch(studentProfileText, jobDescription);
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `
      You are an expert technical recruiter. Analyze the match between a student's resume profile and a job description.
      
      STUDENT RESUME/PROFILE DETAILS:
      """
      ${studentProfileText}
      """
      
      JOB DESCRIPTION & REQUIREMENTS:
      """
      ${jobDescription}
      """
      
      Provide a rigorous evaluation. Return a JSON object with the exact format:
      {
        "matchScore": <number between 0 and 100 based on overall alignment of skills and credentials>,
        "recommendedKeywords": ["keyword1", "keyword2", "keyword3", ...], // List 4-8 crucial technical keywords, skills, or methodologies from the job description that are missing or weak in the student's profile
        "matchFeedback": "<A clear, encouraging, but objective 2-3 sentence analysis of strengths, gaps, and how to improve.>"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the structured JSON response
    const evaluation = JSON.parse(text.trim());
    
    // Ensure all required fields exist
    return {
      matchScore: Math.min(100, Math.max(0, parseInt(evaluation.matchScore) || 50)),
      recommendedKeywords: Array.isArray(evaluation.recommendedKeywords) ? evaluation.recommendedKeywords : [],
      matchFeedback: evaluation.matchFeedback || 'Analysis completed successfully.'
    };
  } catch (error) {
    console.error('Error contacting Gemini API:', error.message);
    // Fall back gracefully to mock analysis to keep the system responsive
    return getMockMatch(studentProfileText, jobDescription);
  }
};

/**
 * Fallback local text similarity logic to simulate resume matching
 */
const getMockMatch = (profile, jobDesc) => {
  const profileLower = (profile || '').toLowerCase();
  const jobLower = (jobDesc || '').toLowerCase();
  
  // Find matching words/skills to make the mock calculation realistic
  const possibleKeywords = [
    'react', 'nodejs', 'express', 'mongodb', 'javascript', 'typescript', 
    'python', 'sql', 'docker', 'aws', 'kubernetes', 'html', 'css', 
    'rest api', 'graphql', 'java', 'c++', 'git', 'ci/cd', 'agile'
  ];
  
  const matchedKeywords = [];
  const recommendedKeywords = [];
  
  possibleKeywords.forEach(kw => {
    const isNode = kw === 'nodejs';
    const inJob = isNode
      ? (jobLower.includes('nodejs') || jobLower.includes('node.js'))
      : jobLower.includes(kw);
      
    const inProfile = isNode
      ? (profileLower.includes('nodejs') || profileLower.includes('node.js'))
      : profileLower.includes(kw);
    
    if (inJob) {
      if (inProfile) {
        matchedKeywords.push(kw);
      } else {
        recommendedKeywords.push(kw.toUpperCase());
      }
    }
  });

  // Calculate matching score
  let score = 30; // base score
  if (possibleKeywords.length > 0) {
    const totalJobKws = matchedKeywords.length + recommendedKeywords.length;
    if (totalJobKws > 0) {
      score = Math.round((matchedKeywords.length / totalJobKws) * 70) + 30;
    }
  }

  // Adjust score based on length of resume
  if (profileLower.length > 100) score = Math.min(100, score + 10);
  
  let feedback = '';
  if (score >= 85) {
    feedback = 'Outstanding match! Your profile shows deep alignment with this role. Focus on practicing coding challenges and behavioral questions.';
  } else if (score >= 60) {
    feedback = 'Good match with a few skill gaps. Your core abilities match the requirements, but adding the recommended keywords will significantly strengthen your profile.';
  } else {
    feedback = 'Your profile has limited overlap with the job requirements. We recommend brushing up on the highlighted skills and updating your resume.';
  }

  return {
    matchScore: score,
    recommendedKeywords: recommendedKeywords.length > 0 ? recommendedKeywords.slice(0, 5) : ['REACT', 'REST API', 'SYSTEM DESIGN'],
    matchFeedback: feedback
  };
};

/**
 * Generates 3 interview questions based on student profile and job description.
 */
const generateMockQuestions = async (studentProfileText, jobDescription) => {
  if (!genAI) {
    console.log('Gemini API Key missing. Generating fallback mock questions...');
    return [
      "Explain how you would design a REST API with Express and MongoDB for this role.",
      "How do you handle state management in React, and which Hook would you use to share state globally?",
      "Tell me about a time you encountered a challenging bug in JavaScript. How did you diagnose and resolve it?"
    ];
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `
      You are an expert technical interviewer. Generate exactly 3 technical or behavioral interview questions for a student based on their resume profile and the job description.
      
      STUDENT RESUME/PROFILE DETAILS:
      """
      ${studentProfileText}
      """
      
      JOB DESCRIPTION:
      """
      ${jobDescription}
      """
      
      Provide a highly relevant list of questions. Return a JSON object with the exact format:
      {
        "questions": [
          "question 1 (specific to technical requirements or student skills)",
          "question 2 (problem solving or architecture related)",
          "question 3 (behavioral or project related)"
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const parsed = JSON.parse(text.trim());
    return Array.isArray(parsed.questions) ? parsed.questions : [
      "Tell us about your experience with modern frontend/backend technologies.",
      "Explain how you would design a scalable database schema for this application.",
      "How do you prioritize tasks under tight deadlines or ambiguous requirements?"
    ];
  } catch (error) {
    console.error('Error generating questions with Gemini:', error.message);
    return [
      "Explain how you would design a REST API with Express and MongoDB for this role.",
      "How do you handle state management in React, and which Hook would you use to share state globally?",
      "Tell me about a time you encountered a challenging bug in JavaScript. How did you diagnose and resolve it?"
    ];
  }
};

/**
 * Evaluates the student's answers to the generated questions.
 */
const evaluateMockAnswers = async (questions, answers, jobDescription) => {
  if (!genAI) {
    console.log('Gemini API Key missing. Evaluating fallback mock answers...');
    return {
      score: 75,
      feedback: "Great effort! You showed good fundamental knowledge, but your answers could be more detailed. Focus on using specific technical keywords (e.g., REST API, state management) and structuring behavioral questions using the STAR method."
    };
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    let QA_Pairs = '';
    questions.forEach((q, i) => {
      QA_Pairs += `Question ${i+1}: ${q}\nAnswer ${i+1}: ${answers[i] || 'No answer provided.'}\n\n`;
    });

    const prompt = `
      You are an expert technical recruiter. Evaluate the following interview answers submitted by a candidate applying for this job.
      
      JOB DESCRIPTION:
      """
      ${jobDescription}
      """
      
      QUESTIONS AND CANDIDATE ANSWERS:
      """
      ${QA_Pairs}
      """
      
      Analyze the technical accuracy, depth, and communication clarity of the answers. Provide a score out of 100, and a concise 3-4 sentence constructive feedback summary with bullet points of improvement areas.
      Return a JSON object with the exact format:
      {
        "score": <number between 0 and 100>,
        "feedback": "<Structured critique and improvement recommendations>"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const evaluation = JSON.parse(text.trim());
    return {
      score: Math.min(100, Math.max(0, parseInt(evaluation.score) || 60)),
      feedback: evaluation.feedback || 'Evaluation complete. Keep practicing!'
    };
  } catch (error) {
    console.error('Error evaluating answers with Gemini:', error.message);
    return {
      score: 70,
      feedback: "Answer evaluation completed. Focus on explaining concrete coding examples and using industry-standard terminologies."
    };
  }
};

/**
 * Analyzes current student resume profile and job description, then recommends optimized content.
 */
const optimizeProfile = async (studentProfileText, jobDescription) => {
  if (!genAI) {
    console.log('Gemini API Key missing. Generating fallback mock profile suggestions...');
    return {
      strengths: "Good technical foundation, clear branch specification.",
      skills: ["REACT", "EXPRESS", "MONGODB", "REST API", "CLEAN CODE"],
      optimizedResume: `Objective: Detail-oriented developer looking to leverage JavaScript engineering skills in a dynamic environment.\n\nKey Projects:\n- Full-Stack Placement Tracker: Designed and built modular Node.js REST APIs and real-time state synchronization using React, TailwindCSS, and WebSockets (Socket.io).\n- High-Performance Web Services: Built secure routes, implemented custom rate-limiting middleware, and established responsive UI/UX dashboards.`
    };
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `
      You are an elite career coach. Analyze the student's resume profile and a target job description. Recommend specific optimizations to help them pass resume-screening filters.
      
      STUDENT RESUME/PROFILE DETAILS:
      """
      ${studentProfileText}
      """
      
      TARGET JOB DESCRIPTION:
      """
      ${jobDescription}
      """
      
      Provide:
      1. Key strengths of their current resume profile.
      2. 4-6 target skill tags (words) that they should add to their profile.
      3. An optimized, rewritten draft of their Resume Plain Text Contents that integrates relevant keywords from the job description naturally.
      
      Return a JSON object in the exact format:
      {
        "strengths": "<A 2-sentence summary of strengths>",
        "skills": ["SKILL1", "SKILL2", "SKILL3", "SKILL4"],
        "optimizedResume": "<Rewritten keyword-enriched resume plain text>"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const suggestions = JSON.parse(text.trim());
    return {
      strengths: suggestions.strengths || 'Profile shows a solid base of general software development skills.',
      skills: Array.isArray(suggestions.skills) ? suggestions.skills.map(s => s.toUpperCase()) : [],
      optimizedResume: suggestions.optimizedResume || studentProfileText
    };
  } catch (error) {
    console.error('Error optimizing profile with Gemini:', error.message);
    return {
      strengths: "Good technical foundation, clear branch specification.",
      skills: ["REACT", "EXPRESS", "MONGODB", "REST API", "CLEAN CODE"],
      optimizedResume: studentProfileText
    };
  }
};

module.exports = {
  evaluateResumeMatch,
  generateMockQuestions,
  evaluateMockAnswers,
  optimizeProfile
};
