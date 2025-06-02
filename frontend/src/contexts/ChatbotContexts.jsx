// src/contexts/ChatbotContext.js
import React, { createContext, useContext, useState, useReducer } from 'react';
import { generateResponse } from '../services/Teachers/chatbotService';

// Create context
const ChatbotContext = createContext();

// Initial state for messages
const initialMessagesState = [
  {
    id: 1,
    sender: 'bot',
    text: 'Magandang araw! Ako ang Literexia Teaching Assistant. Makakatulong ako sa mga estratehiya sa pagtuturo para sa mga mag-aaral na may dyslexia, mga aktibidad sa pagbasa, o mga interbensyon batay sa pagganap ng mag-aaral. Paano kita matutulungan ngayon?',
    timestamp: new Date()
  }
];

// Reducer for managing messages
function messagesReducer(state, action) {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return [...state, action.payload];
    case 'CLEAR_MESSAGES':
      return [initialMessagesState[0]]; // Keep only the welcome message
    default:
      return state;
  }
}

// Provider component
export const ChatbotProvider = ({ children }) => {
  const [messages, dispatch] = useReducer(messagesReducer, initialMessagesState);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [language, setLanguage] = useState('filipino'); // 'filipino' or 'english'
  
  // Sample suggested questions in Filipino
  const suggestedQuestionsFil = {
    all: [
      "Paano ko matutulungan ang mag-aaral na nahihirapan sa pagkilala ng tunog ng mga letra?",
      "Ano ang mga aktibidad na maganda para sa pagkilala ng pantig?",
      "Maaari ka bang magmungkahi ng mga babasahin para sa Grade 2 na mag-aaral?",
      "Ano ang magandang interbensyon para sa mga nahihirapan sa pagkilala ng salita?"
    ],
    teaching: [
      "Anong multisensory na aktibidad ang pwede kong gamitin para ituro ang mga patinig?",
      "Paano ko mababago ang aking paraan ng pagtuturo para sa mga mag-aaral na may dyslexia?",
      "Ano ang mga epektibong estratehiya sa pagtuturo para sa pag-unawa sa pagbasa ng Filipino?",
      "Paano ako makakabuo ng kapaligiran ng silid-aralan na inklusibo sa lahat?"
    ],
    activities: [
      "Anong mga laro ang makakatulong sa pag-ugnay ng letra at tunog?",
      "Maaari ka bang magmungkahi ng mga aktibidad para mapabuti ang kasanayan sa pagbasa?",
      "Ano ang mga nakaka-engganyong ehersisyo sa poniks para sa mga nagsisimula?",
      "Paano ko gagawing mas kawili-wili ang mga aktibidad sa gramatika?"
    ],
    interventions: [
      "Anong interbensyon ang mairerekumenda mo para sa isang mag-aaral na mababa ang iskor sa kamalayan ng ponolohiya?",
      "Gaano kadalas dapat isagawa ang mga sesyon ng interbensyon?",
      "Anong mga materyales ang kailangan ko para sa isang istrukturadong interbensyon sa literasiya?",
      "Paano ko masusubaybayan ang progreso sa mga interbensyon sa pagbasa?"
    ]
  };
  
  // Sample suggested questions in English
  const suggestedQuestionsEng = {
    all: [
      "How can I help a student who struggles with phoneme awareness?",
      "What activities work best for syllable recognition?",
      "Can you suggest reading materials for Grade 2 students?",
      "What's a good intervention for word recognition difficulties?"
    ],
    teaching: [
      "What multisensory activities can I use for teaching vowel sounds?",
      "How can I modify my teaching approach for dyslexic students?",
      "What are effective teaching strategies for Filipino reading comprehension?",
      "How can I create an inclusive classroom environment?"
    ],
    activities: [
      "What games can help with letter-sound association?",
      "Can you suggest activities to improve reading fluency?",
      "What are some engaging phonics exercises for beginners?",
      "How can I make grammar activities more interesting?"
    ],
    interventions: [
      "What intervention would you recommend for a student scoring low in phonological awareness?",
      "How often should I schedule intervention sessions?",
      "What materials do I need for a structured literacy intervention?",
      "How can I track progress during reading interventions?"
    ]
  };

  // Get the appropriate questions based on selected language
  const suggestedQuestions = language === 'filipino' ? suggestedQuestionsFil : suggestedQuestionsEng;

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    
    const userMessage = {
      id: messages.length + 1,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date()
    };
    
    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
    setIsLoading(true);

    try {
      // Get response from chatbot service, passing the current language
      const botResponse = await generateResponse(text, messages, language);
      
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: messages.length + 2,
          sender: 'bot',
          text: botResponse,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Error generating response:', error);
      
      // Error message based on language
      const errorMessage = language === 'filipino' 
        ? 'Paumanhin, ngunit may naganap na error sa pagproseso ng iyong kahilingan. Pakisubukang muli mamaya.'
        : 'I apologize, but I encountered an error processing your request. Please try again later.';
      
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: messages.length + 2,
          sender: 'bot',
          text: errorMessage,
          timestamp: new Date()
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    dispatch({ type: 'CLEAR_MESSAGES' });
  };

  const changeCategory = (category) => {
    setSelectedCategory(category);
  };
  
  const toggleLanguage = () => {
    const newLanguage = language === 'filipino' ? 'english' : 'filipino';
    setLanguage(newLanguage);
    
    // Add a system message about language change
    const langMessage = newLanguage === 'filipino'
      ? 'Nagpalit sa Filipino. Maaari na kayong magtanong sa Filipino.'
      : 'Switched to English. You can now ask questions in English.';
    
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: messages.length + 1,
        sender: 'bot',
        text: langMessage,
        timestamp: new Date()
      }
    });
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Value to be provided by context
  const value = {
    messages,
    isLoading,
    selectedCategory,
    suggestedQuestions,
    language,
    sendMessage,
    clearMessages,
    changeCategory,
    toggleLanguage,
    formatTimestamp
  };

  return <ChatbotContext.Provider value={value}>{children}</ChatbotContext.Provider>;
};

// Custom hook for using the chatbot context
export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (context === undefined) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
};

export default ChatbotContext;