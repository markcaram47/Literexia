// controllers/Teachers/dashboardController.js
const mongoose = require('mongoose');
const User = require('../../models/userModel');

// Get CategoryResult model
let CategoryResult;
try {
  CategoryResult = mongoose.model('CategoryResult');
} catch (error) {
  // If model doesn't exist yet, define it using the schema
  const categoryResultSchema = new mongoose.Schema({
    studentId: mongoose.Schema.Types.ObjectId,
    assessmentType: String,
    readingLevel: String,
    assessmentDate: Date,
    categories: [{
      categoryName: String,
      totalQuestions: Number,
      correctAnswers: Number,
      score: Number,
      isPassed: Boolean,
      passingThreshold: Number
    }],
    overallScore: Number,
    allCategoriesPassed: Boolean,
    readingLevelUpdated: Boolean,
    createdAt: Date,
    updatedAt: Date
  }, { collection: 'category_results' });
  
  CategoryResult = mongoose.model('CategoryResult', categoryResultSchema);
}

// Get InterventionProgress model
let InterventionProgress;
try {
  InterventionProgress = mongoose.model('InterventionProgress');
} catch (error) {
  // If model doesn't exist yet, define it using the schema
  const interventionProgressSchema = new mongoose.Schema({
    studentId: mongoose.Schema.Types.ObjectId,
    interventionPlanId: mongoose.Schema.Types.ObjectId,
    completedActivities: Number,
    totalActivities: Number,
    percentComplete: Number,
    correctAnswers: Number,
    incorrectAnswers: Number,
    percentCorrect: Number,
    passedThreshold: Boolean,
    lastActivity: Date,
    notes: String,
    createdAt: Date,
    updatedAt: Date
  }, { collection: 'intervention_progress' });
  
  InterventionProgress = mongoose.model('InterventionProgress', interventionProgressSchema);
}

// Get PrescriptiveAnalysis model
let PrescriptiveAnalysis;
try {
  PrescriptiveAnalysis = mongoose.model('PrescriptiveAnalysis');
} catch (error) {
  // If model doesn't exist yet, define it using the schema
  const prescriptiveAnalysisSchema = new mongoose.Schema({
    studentId: mongoose.Schema.Types.ObjectId,
    categoryId: String,
    readingLevel: String,
    strengths: [String],
    weaknesses: [String],
    recommendations: [String],
    createdBy: mongoose.Schema.Types.ObjectId,
    createdAt: Date,
    updatedAt: Date
  }, { collection: 'prescriptive_analysis' });
  
  PrescriptiveAnalysis = mongoose.model('PrescriptiveAnalysis', prescriptiveAnalysisSchema);
}

/**
 * Get all dashboard data in a single request
 */
exports.getDashboardData = async (req, res) => {
  try {
    // Fetch all students - exclude teachers, admins, and parents
    const studentsData = await User.find({
      // Filter out admin, teacher, and parent roles
      $and: [
        { $or: [{ roles: { $exists: false } }, { roles: null }, { roles: "" }] },
        { $or: [{ preAssessmentCompleted: { $exists: true } }, { readingLevel: { $exists: true } }] }
      ]
    }).lean();
    
    console.log(`Found ${studentsData.length} student records`);
    
    // Fetch category results for performance metrics - if they exist
    const categoryResults = await CategoryResult.find({}).lean();
    console.log(`Found ${categoryResults.length} category results`);
    
    // Fetch interventions in progress
    const interventionProgress = await InterventionProgress.find({}).lean();
    console.log(`Found ${interventionProgress.length} interventions in progress`);

    const processedInterventions = await processInterventionData(interventionProgress, studentsData);

    // Process students data for dashboard
    const processedData = await processStudentData(studentsData, categoryResults);
    
    // Calculate metrics
    const metrics = calculateMetrics(processedData.allStudents, categoryResults);
    
    // Fetch prescriptive analysis data
    const prescriptiveData = await PrescriptiveAnalysis.find({});
    
    // Generate progress data from category results
    const progressData = generateProgressDataFromResults(categoryResults, processedData.readingLevelDistribution);
    
    // Extract unique sections
    const sections = [...new Set(processedData.allStudents
      .map(student => student.section)
      .filter(section => section)
    )];
    
    // Return all dashboard data
    res.json({
      students: processedData.allStudents,
      studentsNeedingAttention: processedData.studentsNeedingAttention,
      readingLevelDistribution: processedData.readingLevelDistribution,
      metrics,
      prescriptiveData: prescriptiveData || [],
      sections: sections.length > 0 ? sections : ['Sampaguita', 'Unity', 'Dignity'],
      progressData,
      interventionProgress: processedInterventions
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data', message: error.message });
  }
};

/**
 * Process intervention progress data
 */
const processInterventionData = async (interventionProgress, students) => {
    if (!interventionProgress || interventionProgress.length === 0) {
      return [];
    }
    
    // Create a map of student ID to student data for faster lookup
    const studentMap = {};
    if (students && students.length > 0) {
      students.forEach(student => {
        const id = student._id ? 
          (typeof student._id === 'object' ? student._id.toString() : student._id.toString()) : '';
        studentMap[id] = student;
      });
    }

      // Look up intervention plan details
  const interventionPlans = await mongoose.model('InterventionPlan').find({}).lean();
  const planMap = {};
  if (interventionPlans && interventionPlans.length > 0) {
    interventionPlans.forEach(plan => {
      const id = plan._id ? 
        (typeof plan._id === 'object' ? plan._id.toString() : plan._id.toString()) : '';
      planMap[id] = plan;
    });
  }

    // Process each intervention progress record
    return interventionProgress.map(progress => {
        // Get student ID
        const studentId = progress.studentId ? 
          (typeof progress.studentId === 'object' ? progress.studentId.toString() : progress.studentId.toString()) : '';
        
        // Get plan ID
        const planId = progress.interventionPlanId ? 
          (typeof progress.interventionPlanId === 'object' ? progress.interventionPlanId.toString() : progress.interventionPlanId.toString()) : '';
        
        // Get student and plan data
        const student = studentMap[studentId] || null;
        const plan = planMap[planId] || null;
        
        return {
          ...progress,
          studentName: student ? 
            (student.firstName && student.lastName ? 
              `${student.firstName} ${student.lastName}` : 
              (student.name || 'Unknown Student')) : 
            'Unknown Student',
          studentReadingLevel: student ? (student.readingLevel || 'Not Assessed') : 'Unknown',
          interventionPlanName: plan ? (plan.name || 'Intervention Plan') : 'Intervention Plan',
          category: plan ? (plan.category || '') : '',
          readingLevel: plan ? (plan.readingLevel || '') : '',
          // Format dates for display
          lastActivityDate: progress.lastActivity ? new Date(progress.lastActivity).toLocaleDateString() : 'N/A',
          createdDate: progress.createdAt ? new Date(progress.createdAt).toLocaleDateString() : 'N/A'
        };
      });
    };

/**
 * Process student data for dashboard
 */
const processStudentData = async (studentsData, categoryResults) => {
  if (!studentsData || studentsData.length === 0) {
    return {
      allStudents: [],
      readingLevelDistribution: [],
      studentsNeedingAttention: []
    };
  }

  // Create a map of student ID to their category results for faster lookup
  const studentCategoryMap = {};
  if (categoryResults && categoryResults.length > 0) {
    categoryResults.forEach(result => {
      if (result.studentId) {
        const studentId = result.studentId.toString();
        if (!studentCategoryMap[studentId]) {
          studentCategoryMap[studentId] = [];
        }
        studentCategoryMap[studentId].push(result);
      }
    });
  }

  // Process the students data
  const allStudents = await Promise.all(studentsData.map(async (student) => {
    // Extract ID from MongoDB format
    const id = student._id ? (typeof student._id === 'object' ? student._id.toString() : student._id) : '';
    
    // Find latest category results for this student
    const studentResults = studentCategoryMap[id] || [];
    const latestResult = studentResults.length > 0 ? 
      studentResults.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] : null;
    
    // Use reading level directly from latest category result if available, otherwise from student
    let readingLevel = latestResult ? latestResult.readingLevel : (student.readingLevel || 'Not Assessed');
    
    // Normalize reading level to new format if needed
    if (readingLevel === 'Early') readingLevel = 'Low Emerging';
    if (readingLevel === 'Emergent') readingLevel = 'High Emerging';
    if (readingLevel === 'Fluent') readingLevel = 'Developing';
    // Keep 'Transitioning' as is
    if (readingLevel === 'false' || readingLevel === false || !readingLevel) readingLevel = 'Not Assessed';

    // Calculate completion rate from category results
    let completionRate = 0;
    if (latestResult) {
      const totalQuestions = latestResult.categories.reduce((sum, cat) => sum + cat.totalQuestions, 0);
      const correctAnswers = latestResult.categories.reduce((sum, cat) => sum + cat.correctAnswers, 0);
      completionRate = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    } else if (student.completedLessons && Array.isArray(student.completedLessons)) {
      const totalAssigned = 25; // Assuming 25 as default total
      completionRate = Math.round((student.completedLessons.length / totalAssigned) * 100);
    }

    // Get score from category result
    const lastScore = latestResult ? latestResult.overallScore : 0;

    // Format name correctly from MongoDB document
    const name = student.name ||
      `${student.firstName || ''} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName || ''}`.trim();

    // Find categories that failed to meet the threshold from category results
    let improvementCategories = [];
    if (latestResult && latestResult.categories) {
      improvementCategories = latestResult.categories
        .filter(cat => !cat.isPassed)
        .map(cat => cat.categoryName);
    }
    
    // If no failed categories from results, use default based on reading level
    if (improvementCategories.length === 0) {
      improvementCategories = determineCategoriesForImprovement(readingLevel);
    }

    // Look up parent information from parent_profile collection
    let parentName = 'Parent information will be loaded';
    let address = student.address || 'Address not available';
    
    // Format parent information
    const parentId = student.parentId ? (typeof student.parentId === 'object' ? 
                     student.parentId.toString() : student.parentId) : null;

    // Get last assessment date from category results
    const lastAssessmentDate = latestResult ? new Date(latestResult.assessmentDate || latestResult.createdAt) : 
      (student.lastAssessmentDate ? new Date(student.lastAssessmentDate) : null);

    return {
      id,
      uniqueId: `${id}-${Math.random().toString(36).substr(2, 9)}`,
      name: name || 'Unknown Student',
      readingLevel,
      section: student.section || 'Unassigned',
      gradeLevel: student.gradeLevel || 'Grade 1',
      gender: student.gender || 'Not specified',
      age: student.age || 'Not specified',
      lastScore,
      completionRate,
      improvementCategories,
      needsAttention: readingLevel === 'Not Assessed' ||
        readingLevel === 'Low Emerging' ||
        lastScore < 70 ||
        completionRate < 60 ||
        (latestResult ? !latestResult.allCategoriesPassed : false),
      // Additional fields
      profileImageUrl: student.profileImageUrl || null,
      address,
      parentId,
      parentName,
      lastAssessment: lastAssessmentDate ?
        lastAssessmentDate.toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric'
        }) : 'Not assessed',
      preAssessmentCompleted: student.preAssessmentCompleted || false,
      categoryResultId: latestResult ? latestResult._id : null
    };
  }));

  // Calculate reading level distribution
  const readingLevelMap = {};
  allStudents.forEach(student => {
    if (readingLevelMap[student.readingLevel]) {
      readingLevelMap[student.readingLevel]++;
    } else {
      readingLevelMap[student.readingLevel] = 1;
    }
  });

  // Format distribution for pie chart
  const readingLevelDistribution = Object.entries(readingLevelMap)
    .filter(([level]) => level) // Filter out empty levels
    .map(([name, value]) => ({
      name,
      value,
      color: getReadingLevelColor(name)
    }));

  // Sort by reading level progression
  const levelOrder = [
    'Low Emerging',
    'High Emerging',
    'Transitioning',
    'Developing',
    'At Grade Level',
    'Not Assessed'
  ];
  readingLevelDistribution.sort((a, b) => {
    const aIndex = levelOrder.indexOf(a.name);
    const bIndex = levelOrder.indexOf(b.name);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  // Get students needing attention - focus on those not assessed, low readers, or low scores
  const studentsNeedingAttention = allStudents
    .filter(student => student.needsAttention)
    .sort((a, b) => {
      // Prioritize Not Assessed, then sort by score
      if (a.readingLevel === 'Not Assessed' && b.readingLevel !== 'Not Assessed') return -1;
      if (a.readingLevel !== 'Not Assessed' && b.readingLevel === 'Not Assessed') return 1;
      return a.lastScore - b.lastScore;
    })
    .slice(0, 10); // Limit to top 10 students

  return {
    allStudents,
    readingLevelDistribution,
    studentsNeedingAttention
  };
};

/**
 * Helper function to determine categories for improvement
 */
const determineCategoriesForImprovement = (readingLevel) => {
  switch (readingLevel) {
    case 'Low Emerging': return ['Alphabet Knowledge', 'Phonological Awareness'];
    case 'High Emerging': return ['Phonological Awareness', 'Decoding'];
    case 'Transitioning': return ['Decoding', 'Word Recognition'];
    case 'Developing': return ['Reading Comprehension'];
    case 'At Grade Level': return [];
    default: return ['Pre-Assessment Needed'];
  }
};

/**
 * Get color for a reading level
 */
const getReadingLevelColor = (level) => {
  const colors = {
    'Low Emerging': '#FF6B8A',
    'High Emerging': '#FF9E40',
    'Transitioning': '#e6c229',
    'Developing': '#4BC0C0',
    'At Grade Level': '#3D9970',
    'Not Assessed': '#B0B0B0'
  };
  return colors[level] || '#B0B0B0';
};

/**
 * Calculate metrics from student data and category results
 */
const calculateMetrics = (students, categoryResults) => {
  if (!students || students.length === 0) {
    return {
      totalStudents: 0,
      completionRate: 0,
      averageScore: 0,
      pendingEdits: 0
    };
  }

  const totalStudents = students.length;

  // Only count students who need attention for pending edits
  const pendingEdits = students.filter(s => s.needsAttention).length;

  // Calculate average score and completion rate from category results if available
  let averageScore = 0;
  let completionRate = 0;
  
  if (categoryResults && categoryResults.length > 0) {
    // Calculate average score
    const scoreSum = categoryResults.reduce((total, result) => total + (result.overallScore || 0), 0);
    averageScore = Math.round(scoreSum / categoryResults.length) || 0;
    
    // Calculate completion rate
    let totalQuestions = 0;
    let correctAnswers = 0;
    
    categoryResults.forEach(result => {
      if (result.categories && Array.isArray(result.categories)) {
        result.categories.forEach(category => {
          totalQuestions += category.totalQuestions || 0;
          correctAnswers += category.correctAnswers || 0;
        });
      }
    });
    
    completionRate = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  } else {
    // Fallback to student data
    const assessedStudents = students.filter(student => student.readingLevel !== 'Not Assessed');
    if (assessedStudents.length > 0) {
      averageScore = Math.round(assessedStudents.reduce((sum, student) => sum + student.lastScore, 0) / assessedStudents.length);
      completionRate = Math.round(assessedStudents.reduce((sum, student) => sum + student.completionRate, 0) / assessedStudents.length);
    }
  }

  return {
    totalStudents,
    completionRate,
    averageScore,
    pendingEdits
  };
};

/**
 * Generate progress data from category results
 */
const generateProgressDataFromResults = (categoryResults, levelDistribution) => {
  // Create progress data structure
  const data = {};
  
  // Define reading levels from distribution
  const readingLevels = levelDistribution.map(level => level.name);
  
  // Skip 'Not Assessed' level
  const activeReadingLevels = readingLevels.filter(level => level !== 'Not Assessed');
  
  // Group category results by reading level and date
  const resultsByLevel = {};
  
  if (categoryResults && categoryResults.length > 0) {
    categoryResults.forEach(result => {
      const level = result.readingLevel;
      const date = new Date(result.assessmentDate || result.createdAt);
      
      if (!resultsByLevel[level]) {
        resultsByLevel[level] = [];
      }
      
      resultsByLevel[level].push({
        date,
        score: result.overallScore || 0
      });
    });
  }
  
  // Process data for each reading level
  activeReadingLevels.forEach(level => {
    const levelResults = resultsByLevel[level] || [];
    
    // Sort results by date
    levelResults.sort((a, b) => a.date - b.date);
    
    // Generate weekly data
    const weekly = generateWeeklyData(levelResults);
    
    // Generate monthly data
    const monthly = generateMonthlyData(levelResults);
    
    data[level] = { weekly, monthly };
  });
  
  // Add entry for Not Assessed
  data['Not Assessed'] = {
    weekly: [],
    monthly: []
  };
  
  return data;
};

/**
 * Generate weekly data from results
 */
const generateWeeklyData = (results) => {
  if (!results || results.length === 0) {
    // Return empty data for the last 4 weeks
    return Array(4).fill().map((_, i) => ({
      name: `Week ${i + 1}`,
      progress: 0
    }));
  }
  
  // Get current date and last 4 weeks
  const now = new Date();
  const weeks = [];
  for (let i = 0; i < 4; i++) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((i + 1) * 7));
    weeks.unshift(weekStart); // Add to beginning
  }
  
  // Group results by week
  return weeks.map((weekStart, i) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    // Find results for this week
    const weekResults = results.filter(r => 
      r.date >= weekStart && r.date <= weekEnd
    );
    
    // Calculate average progress
    const weekProgress = weekResults.length > 0 
      ? weekResults.reduce((sum, r) => sum + r.score, 0) / weekResults.length 
      : 0;
    
    return {
      name: `${i + 1}`,
      progress: Math.round(weekProgress)
    };
  });
};

/**
 * Generate monthly data from results
 */
const generateMonthlyData = (results) => {
  if (!results || results.length === 0) {
    // Return empty data for the last 6 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      name: month,
      progress: 0
    }));
  }
  
  // Get current date and last 6 months
  const now = new Date();
  const months = [];
  for (let i = 0; i < 6; i++) {
    const month = new Date(now);
    month.setMonth(now.getMonth() - i);
    month.setDate(1); // First day of month
    months.unshift(month); // Add to beginning
  }
  
  // Month names
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Group results by month
  return months.map(monthStart => {
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthStart.getMonth() + 1);
    monthEnd.setDate(0); // Last day of month
    
    // Find results for this month
    const monthResults = results.filter(r => 
      r.date >= monthStart && r.date <= monthEnd
    );
    
    // Calculate average progress
    const monthProgress = monthResults.length > 0 
      ? monthResults.reduce((sum, r) => sum + r.score, 0) / monthResults.length 
      : 0;
    
    return {
      name: monthNames[monthStart.getMonth()],
      progress: Math.round(monthProgress)
    };
  });
};

/**
 * Get parent profile
 */
exports.getParentProfile = async (req, res) => {
  try {
    const { parentId } = req.params;
    
    console.log(`Fetching parent profile for ID: ${parentId}`);
    
    // Check if parent ID is valid
    if (!parentId || !mongoose.Types.ObjectId.isValid(parentId)) {
      return res.status(404).json({ 
        message: 'Parent ID not found or invalid',
        name: 'Not Found',
        address: 'Address not available'
      });
    }
    
    // Try to find parent in parent_profile collection
    try {
      const db = mongoose.connection.useDb('parent');
      const parentCollection = db.collection('parent_profile');
      const parent = await parentCollection.findOne({ _id: new mongoose.Types.ObjectId(parentId) });
      
      console.log(`Parent profile found: ${parent ? 'Yes' : 'No'}`);
      
      if (parent) {
        return res.json({
          name: `${parent.firstName || ''} ${parent.middleName ? parent.middleName + ' ' : ''}${parent.lastName || ''}`.trim(),
          address: parent.address || 'Address not available'
        });
      }
    } catch (error) {
      console.error('Error finding parent profile:', error);
    }
    
    // If parent not found in parent_profile, return default
    return res.status(404).json({ 
      message: 'Parent profile not found',
      name: 'Not Found',
      address: 'Address not available'
    });
  } catch (error) {
    console.error('Error fetching parent profile:', error);
    res.status(500).json({ 
      error: 'Failed to fetch parent profile', 
      message: error.message,
      name: 'Error',
      address: 'Error retrieving address'
    });
  }
};

/**
 * Get metrics for dashboard
 */
exports.getMetrics = async (req, res) => {
  try {
    const students = await User.find({
      $and: [
        { $or: [{ roles: { $exists: false } }, { roles: null }, { roles: "" }] },
        { $or: [{ preAssessmentCompleted: { $exists: true } }, { readingLevel: { $exists: true } }] }
      ]
    }).lean();
    
    const categoryResults = await CategoryResult.find({}).lean();
    const processedStudents = (await processStudentData(students, categoryResults)).allStudents;
    const metrics = calculateMetrics(processedStudents, categoryResults);
    
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics', message: error.message });
  }
};

/**
 * Get reading level distribution
 */
exports.getReadingLevelDistribution = async (req, res) => {
  try {
    const students = await User.find({
      $and: [
        { $or: [{ roles: { $exists: false } }, { roles: null }, { roles: "" }] },
        { $or: [{ preAssessmentCompleted: { $exists: true } }, { readingLevel: { $exists: true } }] }
      ]
    }).lean();
    
    const categoryResults = await CategoryResult.find({}).lean();
    const distribution = (await processStudentData(students, categoryResults)).readingLevelDistribution;
    res.json(distribution);
  } catch (error) {
    console.error('Error fetching reading level distribution:', error);
    res.status(500).json({ error: 'Failed to fetch reading level distribution', message: error.message });
  }
};

/**
 * Get students needing attention
 */
exports.getStudentsNeedingAttention = async (req, res) => {
  try {
    const students = await User.find({
      $and: [
        { $or: [{ roles: { $exists: false } }, { roles: null }, { roles: "" }] },
        { $or: [{ preAssessmentCompleted: { $exists: true } }, { readingLevel: { $exists: true } }] }
      ]
    }).lean();
    
    const categoryResults = await CategoryResult.find({}).lean();
    const needingAttention = (await processStudentData(students, categoryResults)).studentsNeedingAttention;
    res.json(needingAttention);
  } catch (error) {
    console.error('Error fetching students needing attention:', error);
    res.status(500).json({ error: 'Failed to fetch students needing attention', message: error.message });
  }
};

/**
 * Update intervention progress
 */
exports.updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Extract the intervention progress ID from the activity ID
    const progressId = id.replace('act-', '');
    
    // Find and update the intervention progress
    const progress = await InterventionProgress.findById(progressId);
    
    if (!progress) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    
    // Update notes based on status
    if (status === 'Resolved') {
      progress.notes = 'Marked as resolved by teacher on ' + new Date().toLocaleDateString();
      progress.updatedAt = new Date();
    }
    
    await progress.save();
    
    res.json({ success: true, message: 'Activity updated successfully', id, status });
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ error: 'Failed to update activity', message: error.message });
  }
};

/**
 * Get students by section
 */
exports.getStudentsBySection = async (req, res) => {
  try {
    const { section } = req.params;
    
    const students = await User.find({
      section,
      $and: [
        { $or: [{ roles: { $exists: false } }, { roles: null }, { roles: "" }] },
        { $or: [{ preAssessmentCompleted: { $exists: true } }, { readingLevel: { $exists: true } }] }
      ]
    }).lean();
    
    const categoryResults = await CategoryResult.find({}).lean();
    const processedStudents = (await processStudentData(students, categoryResults)).allStudents;
    res.json(processedStudents);
  } catch (error) {
    console.error('Error fetching students by section:', error);
    res.status(500).json({ error: 'Failed to fetch students by section', message: error.message });
  }
};