//NOT NEEDED JUST AN ADDITIONAL OF THE MANAGE PROGRSS REPORT 

//utility file to generate reports for the ManageProgress module:

/**
 * Utility functions for generating progress reports
 */
class ReportGenerator {
    /**
     * Generate a student progress report
     * @param {Object} studentData - Student information
     * @param {Array} assessments - Assessment results
     * @param {Array} interventions - Intervention plans and progress
     * @returns {Object} Formatted report data
     */
    generateStudentProgressReport(studentData, assessments, interventions) {
      // Basic student info
      const report = {
        studentInfo: {
          id: studentData._id,
          name: `${studentData.firstName} ${studentData.middleName ? studentData.middleName + ' ' : ''}${studentData.lastName}`,
          grade: studentData.gradeLevel,
          section: studentData.section,
          readingLevel: studentData.readingLevel || 'Not Assessed',
          lastAssessmentDate: studentData.lastAssessmentDate
        },
        overallProgress: {
          preAssessmentCompleted: studentData.preAssessmentCompleted,
          readingPercentage: studentData.readingPercentage || 0,
          completedLessons: studentData.completedLessons?.length || 0
        },
        assessmentHistory: [],
        interventions: []
      };
      
      // Process assessment data
      if (assessments && assessments.length > 0) {
        report.assessmentHistory = assessments.map(assessment => {
          const categoryResults = {};
          let passedCategories = 0;
          
          assessment.categories.forEach(category => {
            categoryResults[category.categoryName] = {
              score: category.score,
              passed: category.isPassed,
              threshold: category.passingThreshold
            };
            
            if (category.isPassed) passedCategories++;
          });
          
          return {
            date: assessment.assessmentDate,
            type: assessment.assessmentType,
            readingLevel: assessment.readingLevel,
            overallScore: assessment.overallScore,
            passedCategories,
            totalCategories: assessment.categories.length,
            categoryResults
          };
        });
      }
      
      // Process intervention data
      if (interventions && interventions.length > 0) {
        report.interventions = interventions.map(intervention => {
          const progress = intervention.progress || {};
          
          return {
            name: intervention.name,
            category: intervention.category,
            status: intervention.status,
            createdAt: intervention.createdAt,
            completedActivities: progress.completedActivities || 0,
            totalActivities: progress.totalActivities || 0,
            percentComplete: progress.percentComplete || 0,
            percentCorrect: progress.percentCorrect || 0,
            passedThreshold: progress.passedThreshold || false,
            lastActivity: progress.lastActivity
          };
        });
      }
      
      // Calculate trends
      if (report.assessmentHistory.length > 1) {
        report.trends = this.calculateProgressTrends(report.assessmentHistory);
      }
      
      return report;
    }
    
    /**
     * Calculate progress trends from assessment history
     * @param {Array} assessmentHistory - History of assessments
     * @returns {Object} Trend analysis
     */
    calculateProgressTrends(assessmentHistory) {
      // Sort assessments by date
      const sortedAssessments = [...assessmentHistory].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );
      
      // Initialize trend data
      const trends = {
        overallScoreTrend: [],
        categoryTrends: {}
      };
      
      // Populate overall score trend
      sortedAssessments.forEach(assessment => {
        trends.overallScoreTrend.push({
          date: assessment.date,
          score: assessment.overallScore
        });
      });
      
      // Get all unique categories
      const allCategories = new Set();
      sortedAssessments.forEach(assessment => {
        Object.keys(assessment.categoryResults).forEach(category => {
          allCategories.add(category);
        });
      });
      
      // Populate category trends
      allCategories.forEach(category => {
        trends.categoryTrends[category] = sortedAssessments
          .filter(assessment => assessment.categoryResults[category])
          .map(assessment => ({
            date: assessment.date,
            score: assessment.categoryResults[category].score
          }));
      });
      
      // Calculate improvement percentages
      if (sortedAssessments.length >= 2) {
        const firstAssessment = sortedAssessments[0];
        const latestAssessment = sortedAssessments[sortedAssessments.length - 1];
        
        // Overall improvement
        trends.overallImprovement = {
          percentage: latestAssessment.overallScore - firstAssessment.overallScore,
          fromDate: firstAssessment.date,
          toDate: latestAssessment.date
        };
        
        // Category improvements
        trends.categoryImprovements = {};
        allCategories.forEach(category => {
          if (firstAssessment.categoryResults[category] && latestAssessment.categoryResults[category]) {
            trends.categoryImprovements[category] = {
              percentage: latestAssessment.categoryResults[category].score - 
                          firstAssessment.categoryResults[category].score,
              fromDate: firstAssessment.date,
              toDate: latestAssessment.date
            };
          }
        });
      }
      
      return trends;
    }
  }
  
  module.exports = new ReportGenerator();