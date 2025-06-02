// src/services/chatbotService.js

/**
 * Service for handling chatbot functionality for Dyslexia Teaching Assistant
 * Uses OpenAI GPT-4 model for specialized teaching guidance
 */

// Define backend URL with fallback
const getBackendUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    // Use the current host as fallback
    return window.location.origin.replace('3000', '5001');
  }
  return 'http://localhost:5001';
};

const BACKEND_URL =
import.meta.env.VITE_BACKEND_URL || getBackendUrl();
/**
 * Generate a response from the chatbot
 * @param {string} query - The user's message
 * @param {Array} conversationHistory - Previous messages for context
 * @param {string} language - The preferred language ('filipino' or 'english')
 * @returns {Promise<string>} - The chatbot's response
 */
export const generateResponse = async (query, conversationHistory = [], language = 'filipino') => {
  try {
    console.log('Using Backend URL:', BACKEND_URL);
    
    // Format the prompt with expert system message for dyslexia teaching
    const systemMessage = language === 'filipino' 
      ? `Ikaw ay isang eksperto sa pagtuturo ng mga batang may dyslexia sa Pilipinas. 

Ang iyong responsibilidad:
- Magbigay ng evidence-based na teaching strategies at interventions para sa Filipino dyslexic learners
- Isaalang-alang ang kultura at wika ng Pilipinas sa mga rekomendasyon
- Magpatuloy na pag-aralan ang pinakabagong research sa reading comprehension at dyslexia intervention
- Maging espesipiko at praktikal sa lahat ng payo at suggestions

Palaging isulat sa Filipino at gawin ang bawat response na:
1. Madaling maintindihan
2. May step-by-step na gabay
3. May mga konkretong halimbawa 
4. Nakabatay sa siyensya at research

Siguruhin na ang bawat sagot ay angkop para sa kontekstong Filipino at may kaugnayan sa actual classroom setting.`
      : `You are an expert in teaching dyslexic students in the Philippines.

Your responsibilities:
- Provide evidence-based teaching strategies and interventions for Filipino dyslexic learners
- Consider the Philippine cultural and linguistic context in recommendations  
- Stay updated with current research on reading comprehension and dyslexia intervention
- Be specific and practical in all advice and suggestions

Always write in English and make each response:
1. Easy to understand
2. Include step-by-step guidance
3. Provide concrete examples
4. Based on scientific research

Ensure every answer is appropriate for the Filipino context and relevant to actual classroom settings.`;
    
    // Create the prompt by combining system message, history, and new query
    let prompt = systemMessage + "\n\n";
    
    // Add conversation history (last 5 messages for context)
    const recentHistory = conversationHistory.slice(-5);
    recentHistory.forEach(msg => {
      prompt += `${msg.sender === 'user' ? 'Teacher' : 'Assistant'}: ${msg.text}\n`;
    });
    
    // Add the current query
    prompt += `Teacher: ${query}\nAssistant:`;
    
    // Call to your backend API with GPT-4 model specification
    const response = await fetch(`${BACKEND_URL}/api/chatbot/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        prompt: prompt,
        model: 'gpt-4'
      })
    });
    
    // Add more detailed error logging
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Full error response:', errorText);
      throw new Error(`Backend API error: ${response.status} ${response.statusText}. Details: ${errorText}`);
    }
    
    const data = await response.json();
    
    // Validate the response for appropriate content
    const validatedResponse = validateTeachingContent(data.reply, language);
    
    return validatedResponse;
  } catch (error) {
    console.error('Error generating response:', error);
    console.error('Error stack:', error.stack);
    return language === 'filipino'
      ? "Pasensya na, nagkaroon ng problema sa pagproseso ng iyong kahilingan. Subukan muli."
      : "I'm sorry, there was an error processing your request. Please try again.";
  }
};

/**
 * Validate that the response is appropriate for teaching dyslexic students
 * @param {string} response - The AI response
 * @param {string} language - The language used
 * @returns {string} - Validated and potentially modified response
 */
const validateTeachingContent = (response, language) => {
  // Check for harmful content (unlikely with GPT-4, but good practice)
  const harmful = ['hate', 'discriminat', 'abus', 'harm'];
  const containsHarmful = harmful.some(word => 
    response.toLowerCase().includes(word)
  );
  
  if (containsHarmful) {
    return language === 'filipino'
      ? "Hindi ko mabigay ang ganitong sagot. Pakiusap na tanungin ulit nang mas maganda."
      : "I cannot provide that type of response. Please rephrase your question.";
  }
  
  // Ensure response includes educational value
  const educationalKeywords = language === 'filipino'
    ? ['stratehiya', 'aktibidad', 'pag-aaral', 'paggamit', 'pag-unawa', 'tulong', 'guro']
    : ['strategy', 'activity', 'learning', 'practice', 'understanding', 'support', 'teacher'];
  
  const hasEducationalContent = educationalKeywords.some(keyword => 
    response.toLowerCase().includes(keyword)
  );
  
  if (!hasEducationalContent) {
    // Add a note about educational context if missing
    const note = language === 'filipino'
      ? "\n\nNota: Alalahanin na ang lahat ng payo ay dapat iangkop sa iyong classroom at sa mga pangangailangan ng iyong mga mag-aaral."
      : "\n\nNote: Remember to adapt all advice to your specific classroom context and student needs.";
    
    return response + note;
  }
  
  return response;
};

/**
 * Format response for better readability
 * @param {string} text - The response text
 * @returns {string} - Formatted text
 */
export const formatResponse = (text) => {
  // Ensure proper spacing after bullet points and numbers
  let formatted = text.replace(/(\d+\.|\•)\s*/g, "$1 ");
  
  // Add extra line break before numbered lists
  formatted = formatted.replace(/\n(\d+\.)/g, "\n\n$1");
  
  // Add extra line break before bullet points
  formatted = formatted.replace(/\n(\•)/g, "\n\n$1");
  
  return formatted;
};

/**
 * Get suggested follow-up questions based on the conversation
 * @param {string} lastResponse - The last assistant response
 * @param {string} language - The language ('filipino' or 'english')
 * @returns {Array} - Array of suggested questions
 */
export const getFollowUpQuestions = (lastResponse, language) => {
  // Extract main topics from the response
  const topics = extractTopics(lastResponse);
  
  if (language === 'filipino') {
    const suggestions = [];
    
    if (topics.includes('strategy') || topics.includes('strategies')) {
      suggestions.push("Paano ko maaapply ang mga strateghiya na ito sa iba't ibang subject?");
    }
    
    if (topics.includes('activity') || topics.includes('activities')) {
      suggestions.push("May mga example exercises ka ba para sa home practice?");
    }
    
    if (topics.includes('reading') || topics.includes('comprehension')) {
      suggestions.push("Ano ang pinakamabuting paraan para ma-track ang progress nila?");
    }
    
    // Add default suggestions
    suggestions.push("Paano ko ma-customize ito para sa mga mag-aaral na nasa iba't ibang level?");
    suggestions.push("May mga common challenges ba na dapat kong bantayan?");
    
    return suggestions.slice(0, 3); // Return up to 3 suggestions
  } else {
    const suggestions = [];
    
    if (topics.includes('strategy') || topics.includes('strategies')) {
      suggestions.push("How can I apply these strategies across different subjects?");
    }
    
    if (topics.includes('activity') || topics.includes('activities')) {
      suggestions.push("Do you have example exercises for home practice?");
    }
    
    if (topics.includes('reading') || topics.includes('comprehension')) {
      suggestions.push("What's the best way to track their progress?");
    }
    
    // Add default suggestions
    suggestions.push("How can I customize this for students at different levels?");
    suggestions.push("What common challenges should I watch out for?");
    
    return suggestions.slice(0, 3); // Return up to 3 suggestions
  }
};

/**
 * Extract main topics from response for follow-up questions
 * @param {string} text - The response text
 * @returns {Array} - Array of topics
 */
const extractTopics = (text) => {
  const commonTopics = ['strategy', 'strategies', 'activity', 'activities', 
                        'reading', 'comprehension', 'assessment', 'intervention',
                        'phonics', 'vocabulary', 'fluency', 'motivation', 'technique'];
  
  return commonTopics.filter(topic => 
    text.toLowerCase().includes(topic)
  );
};

/**
 * Get context-specific prompts based on query category
 * @param {string} category - The category of query
 * @param {string} language - The language ('filipino' or 'english')
 * @returns {string} - Context-specific prompt addition
 */
export const getCategoryContext = (category, language) => {
  const contexts = {
    filipino: {
      teaching: "Isaalang-alang ang evidence-based teaching methods at ang specific challenges ng Filipino dyslexic learners.",
      activities: "Magfocus sa hands-on, interactive activities na angkop sa Filipino cultural context.",
      interventions: "Magbigay ng step-by-step intervention strategies na proven effective para sa dyslexic students.",
      assessment: "Ibahagi ang comprehensive assessment techniques na hindi nakakatakot sa mga bata."
    },
    english: {
      teaching: "Consider evidence-based teaching methods and the specific challenges of Filipino dyslexic learners.",
      activities: "Focus on hands-on, interactive activities appropriate for the Filipino cultural context.",
      interventions: "Provide step-by-step intervention strategies proven effective for dyslexic students.",
      assessment: "Share comprehensive assessment techniques that are non-threatening to children."
    }
  };
  
  return contexts[language][category] || "";
};

// Create a service object with all exported functions
const chatbotService = {
  generateResponse,
  formatResponse,
  getFollowUpQuestions,
  getCategoryContext
};

export default chatbotService;