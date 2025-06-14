const express = require('express');
const router = express.Router();
const Faq = require('../models/Faq');

// Create
router.post('/', async (req, res) => {
  try {
    var post = req.body;
    const user = await Faq.create(post);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Read All
router.get('/', async (req, res) => {
  const users = await Faq.find();
  res.json(users);
});

//  List Active FAQs
router.get('/list', async (req, res) => {
  try {
    const faqs = await Faq.find({ status: 'active' });
    res.json({ status: true, faqs });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
});

// Read One
router.get('/:id', async (req, res) => {
  try {
    const user = await Faq.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'Faq not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update
router.put('/:id', async (req, res) => {
  try {
    const user = await Faq.findByIdAndUpdate(
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
    await Faq.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Page deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
