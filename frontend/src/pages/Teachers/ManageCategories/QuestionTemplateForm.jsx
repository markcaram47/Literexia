// src/pages/Teachers/ManageCategories/QuestionTemplateForm.jsx
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faInfoCircle, 
  faExclamationTriangle,
  faQuestionCircle
} from "@fortawesome/free-solid-svg-icons";
import "../../../css/Teachers/ManageCategories/TemplateForm.css";

// Categories and types with improved labels
const CATEGORIES = [
  "Alphabet Knowledge",
  "Phonological Awareness",
  "Decoding",
  "Word Recognition",
  "Reading Comprehension"
];

// UPDATED: Question types available for each category
const QUESTION_TYPES = {
  "Alphabet Knowledge": ["patinig", "katinig"],
  "Phonological Awareness": ["patinig", "katinig"], // Only vowel and consonant types
  "Decoding": ["word"],
  "Word Recognition": ["word"],
  "Reading Comprehension": ["sentence"]
};

// UPDATED: Reorganized and clarified choice types with restrictions
const CHOICE_TYPES = {
  // For Alphabet Knowledge
  "patinig": {
    "allowed": ["patinigBigLetter", "patinigSmallLetter", "patinigSound"],
    "description": "For vowel questions (A, E, I, O, U)"
  },
  "katinig": {
    "allowed": ["katinigBigLetter", "katinigSmallLetter", "katinigSound"],
    "description": "For consonant questions (B, C, D, etc.)"
  },
  // For Phonological Awareness - UPDATED restrictions
  "malapantig": {
    "allowed": ["malapatinigText"], // Only syllable blocks for malapantig
    "restricted": ["patinigSound", "katinigSound", "patinigBigLetter", "patinigSmallLetter", "katinigBigLetter", "katinigSmallLetter"],
    "description": "For syllable awareness and blending questions"
  },
  // For Word Recognition and Decoding
  "word": {
    "allowed": ["wordText", "wordSound"],
    "description": "For word-level questions"
  },
  // For Reading Comprehension
  "sentence": {
    "allowed": [],
    "description": "For reading passages with comprehension questions"
  }
};

// Human-friendly labels for choice types
const CHOICE_TYPE_LABELS = {
  "patinigBigLetter": "Vowel - UPPERCASE letters (A, E, I, O, U)",
  "patinigSmallLetter": "Vowel - lowercase letters (a, e, i, o, u)",
  "patinigSound": "Vowel - sounds (/ah/, /eh/, etc.)",
  "katinigBigLetter": "Consonant - UPPERCASE letters (B, K, D, etc.)",
  "katinigSmallLetter": "Consonant - lowercase letters (b, k, d, etc.)",
  "katinigSound": "Consonant - sounds (/buh/, /kuh/, etc.)",
  "malapatinigText": "Syllable blocks (BA, KA, etc.)",
  "wordText": "Complete words (aso, bola, etc.)",
  "wordSound": "Word sounds (spoken forms of words)"
};

const QuestionTemplateForm = ({ template, onSave, onCancel }) => {
  const [form, setForm] = useState({
    category: "",
    questionType: "",
    templateText: "",
    applicableChoiceTypes: [],
    correctChoiceType: ""
  });
  
  const [availableQuestionTypes, setAvailableQuestionTypes] = useState([]);
  const [availableChoiceTypes, setAvailableChoiceTypes] = useState([]);
  const [choiceTypesByCategory, setChoiceTypesByCategory] = useState({});
  const [errors, setErrors] = useState({});
  
  // Load template data if editing
  useEffect(() => {
    if (template) {
      setForm({
        category: template.category || "",
        questionType: template.questionType || "",
        templateText: template.templateText || "",
        applicableChoiceTypes: template.applicableChoiceTypes || [],
        correctChoiceType: template.correctChoiceType || ""
      });
    }
  }, [template]);
  
  // Update available question types when category changes
  useEffect(() => {
    if (form.category) {
      setAvailableQuestionTypes(QUESTION_TYPES[form.category] || []);
    }
  }, [form.category]);
  
  // UPDATED: Update available choice types based on category and question type
  useEffect(() => {
    if (form.questionType) {
      let allowedChoiceTypes = [];
      
      // Special handling for Phonological Awareness category
      if (form.category === "Phonological Awareness") {
        if (form.questionType === "malapantig") {
          // For malapantig, only allow syllable blocks
          allowedChoiceTypes = ["malapatinigText"];
        } else if (form.questionType === "patinig") {
          // For patinig in Phonological Awareness, only allow sounds
          allowedChoiceTypes = ["patinigSound"];
        } else if (form.questionType === "katinig") {
          // For katinig in Phonological Awareness, only allow sounds
          allowedChoiceTypes = ["katinigSound"];
        }
      } else {
        // For other categories, use the standard mapping
        const choiceTypeInfo = CHOICE_TYPES[form.questionType] || { allowed: [] };
        allowedChoiceTypes = choiceTypeInfo.allowed || [];
      }
      
      setAvailableChoiceTypes(allowedChoiceTypes);
      
      // Organize choice types by category
      if (form.questionType === "malapantig" && form.category === "Phonological Awareness") {
        setChoiceTypesByCategory({
          "Syllable Options": allowedChoiceTypes
        });
      } else if (form.questionType === "patinig" && form.category === "Phonological Awareness") {
        setChoiceTypesByCategory({
          "Sound Options": allowedChoiceTypes
        });
      } else if (form.questionType === "katinig" && form.category === "Phonological Awareness") {
        setChoiceTypesByCategory({
          "Sound Options": allowedChoiceTypes
        });
      } else if (form.questionType === "patinig" || form.questionType === "katinig") {
        // For Alphabet Knowledge, group by letter form vs. sound
        setChoiceTypesByCategory({
          "Letter Forms": allowedChoiceTypes.filter(type => 
            !type.includes('Sound')),
          "Sound Forms": allowedChoiceTypes.filter(type => 
            type.includes('Sound'))
        });
      } else {
        // For other categories
        setChoiceTypesByCategory({
          "Available Options": allowedChoiceTypes
        });
      }
      
      // Reset applicable choice types when changing question type
      // to ensure no invalid choices remain selected
      setForm(prev => ({
        ...prev,
        applicableChoiceTypes: [],
        correctChoiceType: ""
      }));
    }
  }, [form.questionType, form.category]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear field-specific errors when changing a field
    setErrors({
      ...errors,
      [name]: undefined
    });
    
    if (name === 'category') {
      // Reset dependent fields
      setForm({
        ...form,
        category: value,
        questionType: "",
        applicableChoiceTypes: [],
        correctChoiceType: ""
      });
    } else if (name === 'questionType') {
      // Reset dependent fields
      setForm({
        ...form,
        questionType: value,
        applicableChoiceTypes: [],
        correctChoiceType: ""
      });
    } else {
      setForm({
        ...form,
        [name]: value
      });
    }
  };
  
  const handleChoiceTypeToggle = (choiceType) => {
    setForm(prev => {
      // Check if the choice is being added or removed
      const isAdding = !prev.applicableChoiceTypes.includes(choiceType);
      
      // Update the applicable choice types
      const newApplicableChoiceTypes = isAdding
        ? [...prev.applicableChoiceTypes, choiceType]
        : prev.applicableChoiceTypes.filter(type => type !== choiceType);
      
      // If the correctChoiceType is no longer in applicableChoiceTypes, reset it
      const newCorrectChoiceType = newApplicableChoiceTypes.includes(prev.correctChoiceType)
        ? prev.correctChoiceType
        : "";
      
      return {
        ...prev,
        applicableChoiceTypes: newApplicableChoiceTypes,
        correctChoiceType: newCorrectChoiceType
      };
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {};
    if (!form.category) newErrors.category = "Category is required";
    if (!form.questionType) newErrors.questionType = "Question type is required";
    if (!form.templateText) newErrors.templateText = "Question text is required";
    if (form.applicableChoiceTypes.length === 0) newErrors.applicableChoiceTypes = "At least one choice type is required";
    if (!form.correctChoiceType) newErrors.correctChoiceType = "Correct answer type is required";
    
    // UPDATED: Check for restrictions based on category and question type
    if (form.category === "Phonological Awareness") {
      if (form.questionType === "malapantig") {
        const hasNonSyllableChoices = form.applicableChoiceTypes.some(type => 
          type !== "malapatinigText"
        );
        
        if (hasNonSyllableChoices) {
          newErrors.applicableChoiceTypes = "For Syllable (Malapantig) type, only syllable blocks are allowed";
        }
      } else if (form.questionType === "patinig") {
        const hasNonSoundChoices = form.applicableChoiceTypes.some(type => 
          type !== "patinigSound"
        );
        
        if (hasNonSoundChoices) {
          newErrors.applicableChoiceTypes = "For Vowel (Patinig) in Phonological Awareness, only sound choices are allowed";
        }
      } else if (form.questionType === "katinig") {
        const hasNonSoundChoices = form.applicableChoiceTypes.some(type => 
          type !== "katinigSound"
        );
        
        if (hasNonSoundChoices) {
          newErrors.applicableChoiceTypes = "For Consonant (Katinig) in Phonological Awareness, only sound choices are allowed";
        }
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSave(form);
  };
  
  // Helper function to check if a choice type is restricted
  const isChoiceTypeRestricted = (choiceType) => {
    if (!form.questionType || !form.category) return false;
    
    // Handle Phonological Awareness restrictions
    if (form.category === "Phonological Awareness") {
      if (form.questionType === "malapantig") {
        return choiceType !== "malapatinigText";
      } else if (form.questionType === "patinig") {
        return choiceType !== "patinigSound";
      } else if (form.questionType === "katinig") {
        return choiceType !== "katinigSound";
      }
    }
    
    // For other categories, use the standard restrictions
    const choiceTypeInfo = CHOICE_TYPES[form.questionType];
    return choiceTypeInfo && 
           choiceTypeInfo.restricted && 
           choiceTypeInfo.restricted.includes(choiceType);
  };
  
  // Helper function to get explanation for why a choice type is restricted
  const getRestrictionReason = (choiceType) => {
    if (form.category === "Phonological Awareness") {
      if (form.questionType === "malapantig") {
        return "For Syllable (Malapantig) type, only syllable blocks are allowed";
      } else if (form.questionType === "patinig") {
        return "For Vowel (Patinig) in Phonological Awareness, only sound choices are allowed";
      } else if (form.questionType === "katinig") {
        return "For Consonant (Katinig) in Phonological Awareness, only sound choices are allowed";
      }
    }
    
    return "Not applicable for this question type";
  };
  
  return (
    <div className="template-form-container">
      <h3>{template ? "Edit Question Template" : "Create New Question Template"}</h3>
      
      <form onSubmit={handleSubmit} className="template-form">
        <div className={`form-group ${errors.category ? 'has-error' : ''}`}>
          <label htmlFor="category">
            Reading Category:
            <div className="tooltip">
              <FontAwesomeIcon icon={faInfoCircle} className="tooltip-icon" />
              <span className="tooltip-text">
                Select the reading category that this question will assess. Different categories focus on different reading skills.
              </span>
            </div>
          </label>
          <select 
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            required
          >
            <option value="">Select a reading category</option>
            {CATEGORIES.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          {errors.category && <div className="error-message">{errors.category}</div>}
        </div>
        
        <div className={`form-group ${errors.questionType ? 'has-error' : ''}`}>
          <label htmlFor="questionType">
            Question Type:
            <div className="tooltip">
              <FontAwesomeIcon icon={faInfoCircle} className="tooltip-icon" />
              <span className="tooltip-text">
                Select the specific type of question within the chosen category. Each type has different answer formats.
              </span>
            </div>
          </label>
          <select
            id="questionType"
            name="questionType"
            value={form.questionType}
            onChange={handleChange}
            required
            disabled={!form.category}
          >
            <option value="">Select a question type</option>
            {availableQuestionTypes.map(type => (
              <option key={type} value={type}>
                {type === "patinig" ? "Vowel (Patinig)" : 
                 type === "katinig" ? "Consonant (Katinig)" :
                 type === "malapantig" ? "Syllable (Malapantig)" :
                 type === "word" ? "Word" :
                 type === "sentence" ? "Reading Passage" : type}
              </option>
            ))}
          </select>
          {errors.questionType && <div className="error-message">{errors.questionType}</div>}
          
          {form.questionType && CHOICE_TYPES[form.questionType] && (
            <div className="form-help-text">
              <FontAwesomeIcon icon={faInfoCircle} />
              <span>{CHOICE_TYPES[form.questionType].description}</span>
            </div>
          )}
          
          {/* ADDED: Special note for Phonological Awareness */}
          {form.category === "Phonological Awareness" && form.questionType && (
            <div className="form-help-text" style={{ color: "#e67e22" }}>
              <FontAwesomeIcon icon={faExclamationTriangle} />
              <span>
                {form.questionType === "malapantig" 
                  ? "For Phonological Awareness, Malapantig questions can only use syllable blocks."
                  : form.questionType === "patinig"
                  ? "For Phonological Awareness, Patinig questions can only use sound-based choices."
                  : "For Phonological Awareness, Katinig questions can only use sound-based choices."}
              </span>
            </div>
          )}
        </div>
        
        <div className={`form-group ${errors.templateText ? 'has-error' : ''}`}>
          <label htmlFor="templateText">
            Question Text:
            <div className="tooltip">
              <FontAwesomeIcon icon={faInfoCircle} className="tooltip-icon" />
              <span className="tooltip-text">
                Write the exact text of the question that students will see. For example: "Anong katumbas na maliit na letra?"
              </span>
            </div>
          </label>
          <input
            type="text"
            id="templateText"
            name="templateText"
            value={form.templateText}
            onChange={handleChange}
            placeholder="e.g. Anong katumbas na maliit na letra?"
            required
          />
          {errors.templateText && <div className="error-message">{errors.templateText}</div>}
        </div>
        
        <div className={`form-group ${errors.applicableChoiceTypes ? 'has-error' : ''}`}>
          <label>
            Answer Options to Show:
            <div className="tooltip">
              <FontAwesomeIcon icon={faInfoCircle} className="tooltip-icon" />
              <span className="tooltip-text">
                Select what types of choices can appear as options for this question. You must select at least one type.
              </span>
            </div>
          </label>
          
          {Object.keys(choiceTypesByCategory).length > 0 ? (
            Object.entries(choiceTypesByCategory).map(([category, types]) => (
              <div key={category} className="choice-category-section">
                <h4>{category}</h4>
                <div className="choice-types-container">
                  {types.length > 0 ? (
                    types.map(choiceType => {
                      const isRestricted = isChoiceTypeRestricted(choiceType);
                      return (
                        <div key={choiceType} className="choice-type-option">
                          <input
                            type="checkbox"
                            id={`choice-${choiceType}`}
                            checked={form.applicableChoiceTypes.includes(choiceType)}
                            onChange={() => handleChoiceTypeToggle(choiceType)}
                            disabled={isRestricted || !form.questionType}
                          />
                          <label 
                            htmlFor={`choice-${choiceType}`}
                            className={isRestricted ? 'disabled-choice' : ''}
                          >
                            {CHOICE_TYPE_LABELS[choiceType] || choiceType}
                            {isRestricted && (
                              <span className="restricted-badge">
                                Not Allowed
                              </span>
                            )}
                          </label>
                          {isRestricted && (
                            <div className="tooltip">
                              <FontAwesomeIcon icon={faExclamationTriangle} className="tooltip-icon" style={{ color: '#e74c3c' }} />
                              <span className="tooltip-text">
                                {getRestrictionReason(choiceType)}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="no-choices-message">No applicable choices for this category</div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="no-choices-message">
              Select a question type to see available answer options
            </div>
          )}
          
          {errors.applicableChoiceTypes && (
            <div className="error-message">{errors.applicableChoiceTypes}</div>
          )}
        </div>
        
        <div className={`form-group ${errors.correctChoiceType ? 'has-error' : ''}`}>
          <label htmlFor="correctChoiceType">
            Correct Answer Type:
            <div className="tooltip">
              <FontAwesomeIcon icon={faInfoCircle} className="tooltip-icon" />
              <span className="tooltip-text">
                Select which type of answer will be marked as correct for this question. This must be one of the answer options you selected above.
              </span>
            </div>
          </label>
          <select
            id="correctChoiceType"
            name="correctChoiceType"
            value={form.correctChoiceType}
            onChange={handleChange}
            required
            disabled={form.applicableChoiceTypes.length === 0}
          >
            <option value="">Select the correct answer type</option>
            {form.applicableChoiceTypes.map(choiceType => (
              <option key={choiceType} value={choiceType}>
                {CHOICE_TYPE_LABELS[choiceType] || choiceType}
              </option>
            ))}
          </select>
          {errors.correctChoiceType && <div className="error-message">{errors.correctChoiceType}</div>}
          
          <div className="form-help-text">
            <FontAwesomeIcon icon={faQuestionCircle} />
            <span>
              For example: If your question asks "Anong katumbas na maliit na letra?" then the correct answer type would be "Vowel - lowercase letters".
            </span>
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button 
            type="submit" 
            className="save-btn"
            disabled={
              !form.category || 
              !form.questionType || 
              !form.templateText || 
              form.applicableChoiceTypes.length === 0 || 
              !form.correctChoiceType
            }
          >
            {template ? "Update Template" : "Create Template"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuestionTemplateForm;