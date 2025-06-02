// src/utils/readingLevels.js

/**
 * Reading level constants and helper functions
 */
export const READING_LEVELS = [
    'Low Emerging',
    'High Emerging', 
    'Developing',
    'Transitioning',
    'At Grade Level',
    'Fluent',
    'Not Assessed'
  ];
  
  export const READING_LEVEL_DESCRIPTIONS = {
    'Low Emerging': 'Nagsisimulang Matuto - Beginning to recognize letters and sounds',
    'High Emerging': 'Umuunlad na Matuto - Developing letter-sound connections',
    'Developing': 'Paunlad na Pagbasa - Working on basic fluency and word recognition',
    'Transitioning': 'Lumalago na Pagbasa - Building reading comprehension skills',
    'At Grade Level': 'Batay sa Antas - Reading at expected grade level',
    'Fluent': 'Mahusay na Pagbasa - Reading with advanced comprehension',
    'Not Assessed': 'Hindi pa nasusuri - Evaluation needed'
  };
  
  export const READING_LEVEL_SHORT_DESCRIPTIONS = {
    'Low Emerging': 'Nagsisimulang Matuto',
    'High Emerging': 'Umuunlad na Matuto',
    'Developing': 'Paunlad na Pagbasa',
    'Transitioning': 'Lumalago na Pagbasa',
    'At Grade Level': 'Batay sa Antas',
    'Fluent': 'Mahusay na Pagbasa',
    'Not Assessed': 'Hindi pa nasusuri'
  };
  
  export const getReadingLevelClass = (level) => {
    const classMap = {
      'Low Emerging': 'mp-level-1',
      'High Emerging': 'mp-level-2',
      'Developing': 'mp-level-3',
      'Transitioning': 'mp-level-4',
      'At Grade Level': 'mp-level-5',
      'Fluent': 'mp-level-fluent',
      'Not Assessed': 'mp-level-na'
    };
    return classMap[level] || 'mp-level-na';
  };
  
  export const getReadingLevelIcon = (level) => {
    const iconMap = {
      'Low Emerging': 'book',
      'High Emerging': 'book',
      'Developing': 'book-reader',
      'Transitioning': 'chart-line',
      'At Grade Level': 'chart-line',
      'Fluent': 'trophy',
      'Not Assessed': 'book-reader'
    };
    return iconMap[level] || 'book-reader';
  };
  
  export const getNextReadingLevel = (currentLevel) => {
    const levelMap = {
      'Low Emerging': 'High Emerging',
      'High Emerging': 'Developing',
      'Developing': 'Transitioning',
      'Transitioning': 'At Grade Level',
      'At Grade Level': 'Fluent',
      'Fluent': 'Fluent',
      'Not Assessed': 'Low Emerging'
    };
    return levelMap[currentLevel] || 'Low Emerging';
  };
  
  export const getRequiredCategories = (readingLevel) => {
    const categoryMap = {
      'Low Emerging': [1, 2, 3], // Alphabet Knowledge, Phonological Awareness, Decoding
      'High Emerging': [2, 3, 4], // Phonological Awareness, Decoding, Word Recognition
      'Developing': [3, 4, 5],    // Decoding, Word Recognition, Reading Comprehension
      'Transitioning': [4, 5],    // Word Recognition, Reading Comprehension
      'At Grade Level': [5],      // Reading Comprehension
      'Fluent': [5],              // Advanced Reading Comprehension
      'Not Assessed': [1, 2, 3]   // Start with the basics
    };
    
    return categoryMap[readingLevel] || [1, 2, 3]; 
  };