// src/components/Admin/Dashboard/StudentAnalytics.jsx
import React, { useState } from 'react';
import StudentCard from '../StudentCard/StudentCard';
import '../../../css/Admin/Dashboard/StudentAnalytics.css';

const StudentAnalytics = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Sample student data based on image
  const students = [
    {
      id: 1,
      name: "Maria Santos",
      grade: "2",
      progress: "78%",
      learningChallenges: ["Phonological", "Word Recognition"],
      learningStrengths: ["Sound Letter Association", "Syllable"],
      recentActivity: {
        description: "Completed 30 phonics exercises with 75% accuracy"
      },
      prescriptiveAnalysis: "Maria santos is struggling with bla bla bla bla"
    },
    {
      id: 2,
      name: "Juan Torres",
      grade: "2",
      progress: "85%",
      learningChallenges: ["Phonological Awareness", "Word Recognition"],
      learningStrengths: ["Sound Letter Association", "Syllable Structure"],
      recentActivity: {
        description: "Completed 30 phonics exercises with 75% accuracy"
      },
      recommendedActivities: [
        "Filipino Sentence Structure",
        "Filipino Simple Words"
      ]
    },
    {
      id: 3,
      name: "Ana Lim",
      grade: "2",
      progress: "76%",
      learningChallenges: ["Phonological Awareness", "Word Recognition"],
      learningStrengths: ["Word Recognition", "Reading Speed"],
      recentActivity: {
        description: "Completed 30 phonics exercises with 75% accuracy"
      },
      recommendedActivities: [
        "Filipino Sentence Structure",
        "Filipino Simple Words"
      ]
    }
  ];

  // Filter students based on search term
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="student-analytics-container">
      <h2 className="section-title">Student Prescriptive Analytics</h2>
      
      <div className="search-container">
        <input
          type="text"
          placeholder="Search Student"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>
      
      <div className="student-cards">
        {filteredStudents.map(student => (
          <StudentCard key={student.id} student={student} />
        ))}
      </div>
    </div>
  );
};

export default StudentAnalytics;