const express = require('express');
const router = express.Router();
const Page = require('../models/Page');

// Create
router.post('/', async (req, res) => {
  try {
    var post = req.body;
    const user = await Page.create(post);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Read All
router.get('/', async (req, res) => {
  const users = await Page.find();
  res.json(users);
});

// Read One
router.get('/:id', async (req, res) => {
  try {
    const user = await Page.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'Page not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Read One
router.get('/find/:slug', async (req, res) => {
  try {
    const user = await Page.findOne({slug:req.params.slug});
    if (!user) return res.status(404).json({ msg: 'Page not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update
router.put('/:id', async (req, res) => {
  try {
    const user = await Page.findByIdAndUpdate(
      req.params.id, req.body, { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete
router.delete('/:id', async (req, res) => {
  try {
    await Page.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Page deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
