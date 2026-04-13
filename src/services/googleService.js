const { GoogleGenerativeAI } = require("@google/generative-ai");
const { zones } = require('../data/venueData');
const { SYSTEM } = require('../utils/constants');

/**
 * Google Services Orchestrator
 * Integrates Gemini AI, Structured Logging, and Maps Directions Logic.
 */
class GoogleService {
  constructor() {
    this.genAI = null;
    if (process.env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
  }

  /**
   * Gemini AI Analysis: Natural Language Routing
   * Interrogates current venue stats to provide contextual advice.
   * 
   * @param {string} query - The user's natural language question
   * @returns {Promise<Object>} The AI's recommendation and status.
   */
  async analyzeVenueNeeds(query) {
    if (!this.genAI) {
      this.logEvent('WARN', 'Gemini API key missing, using simulated response');
      return { 
          suggestion: "I'm looking for the food court.", 
          analysis: "AI services are currently in simulation mode. Based on standard patterns, the Food Court is centrally located near Gate B." 
      };
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const currentStats = zones.map(z => `${z.name} (Density: ${z.density}%)`).join(', ');
      
      const prompt = `
        You are the 'VenueCrowd' Smart Assistant for a large sporting stadium.
        User Query: "${query}"
        
        Current Live Data:
        ${currentStats}
        
        Your Mission:
        1. Provide a helpful, concise response to the user's query.
        2. If they are looking for a location, recommend a path using the available zones.
        3. ALWAYS avoid recommending zones with >70% density if possible.
        4. Suggest the clearest gate for entry/exit if relevant.
        5. Tone: Professional, helpful, and energetic.
        
        Keep your response under 100 words.
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      this.logEvent('INFO', 'Gemini Analysis Successful', { queryLength: query.length });
      return { analysis: text };
    } catch (err) {
      this.logEvent('ERROR', 'Gemini AI reasoning failed', { error: err.message });
      return { 
        error: "AI Assistant is experiencing high load.", 
        fallback: "Please follow the overhead displays. Currently, Gate B is the clearest path to the seating areas." 
      };
    }
  }

  /**
   * Structured Cloud Logging (Simulated for GCP Insights)
   * 
   * @param {string} severity - INFO, WARN, ERROR
   * @param {string} message - Human readable log message
   * @param {Object} metadata - Contextual data keys
   */
  logEvent(severity, message, metadata = {}) {
    const entry = {
        severity,
        message,
        timestamp: new Date().toISOString(),
        service: SYSTEM.SERVICE_NAME,
        ...metadata
    };
    // Standard output for log aggregators (e.g. Cloud Logging agent)
    console.log(`[${severity}] ${message}`, JSON.stringify(metadata));
    return entry;
  }

  /**
   * Polyline Simulation for Maps Visualization
   * 
   * @param {Array<string>} pathIds - List of zones in order
   * @returns {Object} Maps-compatible data payload
   */
  generatePathPolyline(pathIds) {
    return {
        path: pathIds,
        encoded: "a~l~Fjk~uOnA@wD?gA@yC?gC@gA@yC?", 
        distance: `${pathIds.length * 200}m`,
        duration: `${pathIds.length * 2}min`
    };
  }
}

module.exports = new GoogleService();
