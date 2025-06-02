import React, { useState, useRef, useEffect } from 'react';
import { useChatbot } from '../../../contexts/ChatbotContexts.jsx';
import { fetchTeacherProfile } from '../../../services/Teachers/teacherService';
import '../../../css/Teachers/TeacherChatbot.css'; 

// Adjust these relative paths if you've moved the file
import botAvatar from '../../../assets/icons/Homepage/penguin.png';
// Remove the static import
// import userAvatar from '../../../assets/icons/Teachers/Avatar.png';
import defaultUserAvatar from '../../../assets/icons/Teachers/avatar.png';

const TeacherChatbot = () => {
  const {
    messages,
    isLoading,
    selectedCategory,
    suggestedQuestions,
    sendMessage,
    changeCategory,
    formatTimestamp
  } = useChatbot();
  
  const [inputMessage, setInputMessage] = useState('');
  const [userAvatar, setUserAvatar] = useState(defaultUserAvatar);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch teacher profile to get the avatar image
  useEffect(() => {
    const fetchUserAvatar = async () => {
      try {
        const teacherData = await fetchTeacherProfile();
        if (teacherData && teacherData.profileImageUrl) {
          // Add cache-busting parameter to avoid stale images
          setUserAvatar(`${teacherData.profileImageUrl}?t=${Date.now()}`);
        }
      } catch (error) {
        console.error('Failed to fetch teacher profile image:', error);
        // Keep using default avatar on error
      }
    };
    
    fetchUserAvatar();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    await sendMessage(inputMessage);
    setInputMessage('');
  };

  const handleSuggestedQuestion = (question) => {
    setInputMessage(question);
    inputRef.current?.focus();
  };

  // Helper function to handle image errors
  const handleImageError = (e) => {
    e.target.src = defaultUserAvatar;
  };

  return (
    <div className="tcb-chatbot-container">
      {/* Header */}
      <div className="tcb-chatbot-header">
        <h1>Literexia Teaching Assistant</h1>
        <p>Your AI companion for teaching students with dyslexia</p>
      </div>

      {/* Main */}
      <div className="tcb-chatbot-main">
        {/* Category tabs */}
        <div className="tcb-category-tabs">
          {['all','teaching','activities','interventions'].map(cat => (
            <button
              key={cat}
              className={`tcb-category-tab ${selectedCategory===cat?'tcb-active':''}`}
              onClick={() => changeCategory(cat)}
            >
              {cat === 'all' ? 'All' :
               cat === 'teaching' ? 'Teaching Strategies' :
               cat === 'activities' ? 'Activities' :
               'Interventions'}
            </button>
          ))}
        </div>

        {/* Suggested */}
        <div className="tcb-suggested-questions">
          <h3>Suggested Questions</h3>
          <div className="tcb-question-list">
            {suggestedQuestions[selectedCategory].map((q,i) => (
              <button
                key={i}
                className="tcb-suggested-question"
                onClick={() => handleSuggestedQuestion(q)}
              >
                {q}
              </button>
            ))}
          </div>
          <div className="tcb-chatbot-info">
            <div className="tcb-info-card">
              <svg className="tcb-info-icon" width="20" height="20" viewBox="0 0 20 20">
                <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V9H11V15ZM11 7H9V5H11V7Z" fill="currentColor"/>
              </svg>
              <div className="tcb-info-content">
                <h4>Teaching Assistant Features</h4>
                <ul>
                  <li>Access teaching strategies for dyslexic students</li>
                  <li>Get activity ideas for different learning needs</li>
                  <li>Learn about interventions for reading challenges</li>
                  <li>Find resources specifically for Filipino language learning</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Chat window */}
        <div className="tcb-chat-window">
          <div className="tcb-messages-container">
            {messages.map(msg => (
              <div key={msg.id} className={`tcb-message ${msg.sender==='user'?'tcb-user-message':'tcb-bot-message'}`}>
                <div className="tcb-avatar">
                  <img 
                    src={msg.sender==='user'? userAvatar : botAvatar} 
                    alt={msg.sender}
                    onError={msg.sender==='user' ? handleImageError : undefined}
                  />
                </div>
                <div className="tcb-message-content">
                  <div className="tcb-message-text">
                    {msg.text.split('\n').map((line,i) => (
                      <React.Fragment key={i}>
                        {line}
                        {i < msg.text.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="tcb-message-time">{formatTimestamp(msg.timestamp)}</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="tcb-message tcb-bot-message">
                <div className="tcb-avatar"><img src={botAvatar} alt="Bot"/></div>
                <div className="tcb-message-content">
                  <div className="tcb-typing-indicator">
                    <span/><span/><span/>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef}/>
          </div>

          {/* Input */}
          <form className="tcb-input-area" onSubmit={handleSendMessage}>
            <input
              type="text"
              ref={inputRef}
              className="tcb-message-input"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              placeholder="Type your question here..."
              disabled={isLoading}
            />
            <button type="submit" className="tcb-send-button" disabled={!inputMessage.trim()||isLoading}>
              {/* send icon */}
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="tcb-chatbot-footer">
        <p><strong>Note:</strong> The Teaching Assistant provides general guidance and suggestions. Always adapt recommendations to your classroom needs.</p>
      </div>
    </div>
  );
};

export default TeacherChatbot;