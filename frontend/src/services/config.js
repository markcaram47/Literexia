// config.js

// Get API base URL from environment variables or use default
export const API_BASE_URL = 'http://localhost:5001/api';

// Content URLs
export const CONTENT_IMAGE_BASE_URL = `${API_BASE_URL}/api/content/images`;
export const CONTENT_AUDIO_BASE_URL = `${API_BASE_URL}/api/content/audio`;

// Export other configuration values as needed
export const DEFAULT_READING_LEVELS = [
  'Low Emerging', 
  'High Emerging', 
  'Developing', 
  'Transitioning', 
  'At Grade Level'
];

export const CATEGORY_COLORS = {
  'Alphabet Knowledge': '#EF5350',
  'Phonological Awareness': '#FFCA28',
  'Decoding': '#66BB6A',
  'Word Recognition': '#42A5F5',
  'Reading Comprehension': '#7C4DFF'
};

// Map to get category names by ID for quick reference
export const CATEGORY_NAME_MAP = {
  1: 'Alphabet Knowledge',
  2: 'Phonological Awareness',
  3: 'Decoding',
  4: 'Word Recognition',
  5: 'Reading Comprehension'
};

// Mapping between reading levels and recommended categories
export const READING_LEVEL_CATEGORIES = {
  'Low Emerging': [1, 2, 3], // Alphabet Knowledge, Phonological Awareness, Decoding
  'High Emerging': [2, 3, 4], // Phonological Awareness, Decoding, Word Recognition
  'Developing': [3, 4, 5],    // Decoding, Word Recognition, Reading Comprehension
  'Transitioning': [4, 5],    // Word Recognition, Reading Comprehension
  'At Grade Level': [5]       // Reading Comprehension
};