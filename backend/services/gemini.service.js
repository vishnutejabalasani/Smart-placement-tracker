const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API client if API key is provided
let genAI = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE') {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

const FALLBACK_MODELS = [
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-pro-latest',
  'gemini-flash-latest',
  'gemini-1.5-pro'
];

/**
 * Invokes Gemini content generation trying multiple model names if rate limits or errors are hit.
 */
const generateContentWithFallback = async (prompt, config = {}) => {
  let lastError = null;
  for (const modelName of FALLBACK_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: config
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      lastError = error;
      console.warn(`Model ${modelName} failed or was rate limited: ${error.message}. Retrying with next model...`);
    }
  }
  throw new Error(`All Gemini models failed or were rate limited. Last error: ${lastError?.message}`);
};

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

    const text = await generateContentWithFallback(prompt, { responseMimeType: 'application/json' });
    
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
 * Generates 3 multiple choice questions based on student profile and job description.
 */
const generateMockQuestions = async (studentProfileText, jobDescription) => {
  const mockMcqQuestions = [
    JSON.stringify({
      question: "In a MERN stack application, what is the role of Express.js?",
      options: [
        "It acts as the document-oriented database for storing user data.",
        "It is a web application framework for Node.js that simplifies API routing.",
        "It is the frontend library used to build interactive user interfaces.",
        "It is a runtime engine used to compile JavaScript to machine code."
      ],
      correctAnswer: "B"
    }),
    JSON.stringify({
      question: "Which React hook is most appropriate for sharing state globally across components without prop drilling?",
      options: [
        "useState",
        "useEffect",
        "useContext",
        "useRef"
      ],
      correctAnswer: "C"
    }),
    JSON.stringify({
      question: "What is the purpose of percent-encoding special characters in a MongoDB connection string?",
      options: [
        "To encrypt the password so that it cannot be intercepted during network transit.",
        "To prevent parsing errors caused by characters like '@' or '/' which have special meanings in URIs.",
        "To reduce the length of the URI so that it fits within database driver limitations.",
        "To automatically enable SSL/TLS validation on the connection."
      ],
      correctAnswer: "B"
    })
  ];

  if (!genAI) {
    console.log('Gemini API Key missing. Generating fallback mock questions...');
    return mockMcqQuestions;
  }

  try {
    const prompt = `
      You are an expert technical interviewer. Generate exactly 3 technical multiple choice questions (MCQs) for a student based on their resume profile and the job description.
      Each question must have exactly 4 options and a single correct answer.
      
      STUDENT RESUME/PROFILE DETAILS:
      """
      ${studentProfileText}
      """
      
      JOB DESCRIPTION:
      """
      ${jobDescription}
      """
      
      Provide a highly relevant list of MCQ questions. Return a JSON object with the exact format:
      {
        "questions": [
          {
            "question": "Question text here",
            "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
            "correctAnswer": "A"
          },
          {
            "question": "Question text here",
            "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
            "correctAnswer": "B"
          },
          {
            "question": "Question text here",
            "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
            "correctAnswer": "C"
          }
        ]
      }
    `;

    const text = await generateContentWithFallback(prompt, { responseMimeType: 'application/json' });
    const parsed = JSON.parse(text.trim());
    if (parsed && Array.isArray(parsed.questions)) {
      return parsed.questions.map(q => JSON.stringify(q));
    }
    return mockMcqQuestions;
  } catch (error) {
    console.error('Error generating MCQ questions with Gemini:', error.message);
    return mockMcqQuestions;
  }
};

/**
 * Evaluates the student's answers to the generated MCQ questions.
 */
const evaluateMockAnswers = async (questions, answers, jobDescription) => {
  let QA_Pairs = '';
  let correctCount = 0;
  
  const parsedQuestions = questions.map((qStr, i) => {
    let q;
    try {
      q = JSON.parse(qStr);
    } catch (err) {
      q = { question: qStr, options: [], correctAnswer: '' };
    }
    const studentAns = (answers[i] || '').trim().toUpperCase();
    const correctAns = (q.correctAnswer || '').trim().toUpperCase();
    const isCorrect = correctAns && studentAns === correctAns;
    if (isCorrect) {
      correctCount++;
    }
    
    QA_Pairs += `Question ${i+1}: ${q.question}\n`;
    if (q.options && q.options.length > 0) {
      q.options.forEach((opt, idx) => {
        QA_Pairs += `  ${String.fromCharCode(65 + idx)}) ${opt}\n`;
      });
    }
    QA_Pairs += `Student Selected Option: ${studentAns || 'None'}\n`;
    QA_Pairs += `Correct Option: ${correctAns}\n`;
    QA_Pairs += `Result: ${isCorrect ? 'Correct' : 'Incorrect'}\n\n`;
    
    return { ...q, studentAns, isCorrect };
  });

  const baseScore = Math.round((correctCount / questions.length) * 100);

  if (!genAI) {
    console.log('Gemini API Key missing. Evaluating fallback mock answers...');
    let feedback = `You answered ${correctCount} out of ${questions.length} questions correctly.\n\n`;
    parsedQuestions.forEach((q, i) => {
      feedback += `• Q${i+1}: ${q.isCorrect ? 'Correct! ' : 'Incorrect. '} The correct answer was option ${q.correctAnswer}. ${q.isCorrect ? 'Well done!' : 'Review this concept to strengthen your understanding.'}\n`;
    });
    return {
      score: baseScore,
      feedback
    };
  }

  try {
    const prompt = `
      You are an expert technical recruiter. Evaluate the following multiple-choice interview results submitted by a candidate.
      
      JOB DESCRIPTION:
      """
      ${jobDescription}
      """
      
      QUESTIONS AND CANDIDATE RESPONSES:
      """
      ${QA_Pairs}
      """
      
      Generate a professional 3-4 sentence feedback summary. Focus on explaining the concepts behind any questions the student answered incorrectly, and highlight the significance of the correct options relative to the job description. Do not change the score from the auto-calculated score of ${baseScore}%.
      
      Return a JSON object with the exact format:
      {
        "score": ${baseScore},
        "feedback": "<Constructive critique and coaching feedback based on their results>"
      }
    `;

    const text = await generateContentWithFallback(prompt, { responseMimeType: 'application/json' });
    const evaluation = JSON.parse(text.trim());
    return {
      score: baseScore,
      feedback: evaluation.feedback || `You scored ${baseScore}%. Practice makes perfect!`
    };
  } catch (error) {
    console.error('Error evaluating MCQ answers with Gemini:', error.message);
    let feedback = `You answered ${correctCount} out of ${questions.length} questions correctly. (Score: ${baseScore}%)\n\n`;
    parsedQuestions.forEach((q, i) => {
      feedback += `• Q${i+1}: ${q.isCorrect ? 'Correct! ' : 'Incorrect. '} The correct answer was option ${q.correctAnswer}.\n`;
    });
    return {
      score: baseScore,
      feedback
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

    const text = await generateContentWithFallback(prompt, { responseMimeType: 'application/json' });
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
