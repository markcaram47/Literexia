const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// TEST ROUTE for debugging
router.get('/assessment-results/test', (req, res) => {
  console.log('Test route hit!');
  res.json({ success: true, message: 'Test route hit!' });
});

// GET /api/admin/assessment-results/:idNumber
router.get('/assessment-results/:idNumber', async (req, res) => {
  try {
    const db = mongoose.connection.useDb('test');
    const idParam = req.params.idNumber;
    console.log('Received idNumber:', idParam, 'Type:', typeof idParam);
    // Log all studentIds in the collection for reference
    const allIds = await db.collection('category_results').find({}, { projection: { studentId: 1 } }).toArray();
    console.log('All studentIds in category_results:', allIds.map(d => d.studentId));
    // Try both string and number
    const query = {
      $or: [
        { studentId: idParam },
        { studentId: Number(idParam) }
      ]
    };
    console.log('Query:', query);
    const result = await db.collection('category_results').findOne(query);
    console.log('Query result:', result);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Assessment result not found' });
    }
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router; 