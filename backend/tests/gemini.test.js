const { evaluateResumeMatch } = require('../services/gemini.service');

describe('Gemini Resume Matching Engine Unit Tests', () => {
  const jobDescription = `
    Looking for a Software Engineer with deep expertise in React, Node.js, Express, and MongoDB.
    Must have hands-on experience designing REST APIs and working with Git version control.
  `;

  it('should calculate higher match score for high-quality skill overlap profiles', async () => {
    const candidateProfile = `
      Qualified developer with skills in React, Node.js, Express, and MongoDB.
      Designed robust REST APIs and managed projects using Git.
    `;

    const result = await evaluateResumeMatch(candidateProfile, jobDescription);

    // High overlapping keywords should yield high scores (>= 75%)
    expect(result.matchScore).toBeGreaterThanOrEqual(75);
    expect(result.matchScore).toBeLessThanOrEqual(100);
    expect(result.matchFeedback).toContain('match');
    expect(result.recommendedKeywords).toBeInstanceOf(Array);
  });

  it('should calculate low scores and identify recommended missing skills for weak candidates', async () => {
    const candidateProfile = `
      Junior specialist who only knows Python and basic HTML/CSS styling.
    `;

    const result = await evaluateResumeMatch(candidateProfile, jobDescription);

    // Weak alignment should yield lower scores (<= 55%)
    expect(result.matchScore).toBeLessThanOrEqual(55);
    expect(result.recommendedKeywords).toContain('REACT');
    expect(result.recommendedKeywords).toContain('NODEJS');
  });

  it('should format output parameters to be safe and structured', async () => {
    const result = await evaluateResumeMatch('', '');
    
    expect(result).toHaveProperty('matchScore');
    expect(result).toHaveProperty('recommendedKeywords');
    expect(result).toHaveProperty('matchFeedback');
    
    expect(result.matchScore).toBeGreaterThanOrEqual(0);
    expect(result.matchScore).toBeLessThanOrEqual(100);
    expect(result.recommendedKeywords.length).toBeGreaterThanOrEqual(0);
  });
});
