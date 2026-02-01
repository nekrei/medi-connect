const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get first name by username
router.get('/firstname/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const query = 'SELECT FirstName FROM Users WHERE Username = $1';
    const result = await pool.query(query, [username]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'User not found',
        message: `No user found with username: ${username}` 
      });
    }
    
    res.json({
      username: username,
      firstName: result.rows[0].firstname
    });
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

module.exports = router;
