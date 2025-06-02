const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// GET /api/admin/category-results
router.get('/category-results', async (req, res) => {
  try {
    const db = mongoose.connection.useDb('test');
    const results = await db.collection('category_results').find({}).toArray();
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router; 