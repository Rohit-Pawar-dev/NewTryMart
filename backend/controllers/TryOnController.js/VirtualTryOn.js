const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.tryOnAccessory = async (req, res) => {
    try {
        const modelFile = req.files?.model_photo?.[0];
        const accessoryFile = req.files?.accessory_photo?.[0];

        if (!modelFile || !accessoryFile) {
            return res.status(400).json({ success: false, message: 'Both model_photo and accessory_photo are required.' });
        }

        // Upload to Cloudinary
        const modelUpload = await cloudinary.uploader.upload(modelFile.path, { folder: 'tryon' });
        const accessoryUpload = await cloudinary.uploader.upload(accessoryFile.path, { folder: 'tryon' });

        const modelUrl = modelUpload.secure_url;
        const accessoryUrl = accessoryUpload.secure_url;

        const description = req.body.description || 'a head cap dont change my face and pose';
        const email = process.env.THENEWBLACK_EMAIL;
        const password = process.env.THENEWBLACK_PASSWORD;
        console.log(email, " <<<<<<<<<<<<<<<<<<<<<<<<<<<<");

        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);
        formData.append('description', description);
        formData.append('model_photo', modelUrl);
        formData.append('accessory_photo', accessoryUrl);

        const response = await axios.post('https://thenewblack.ai/api/1.1/wf/vto-accessory', formData, {
            headers: formData.getHeaders(),
            maxBodyLength: Infinity,
        });

        // Delete local files after upload
        fs.unlinkSync(modelFile.path);
        fs.unlinkSync(accessoryFile.path);

        res.json({
            success: true,
            message: 'Try-on result received successfully.',
            data: response.data,
        });

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Server Error: Unable to process try-on request.',
            error: error.response?.data || error.message,
        });
    }
};

exports.tryOnShoes = async (req, res) => {
    try {
        const modelFile = req.files?.model_photo?.[0];
        const shoesFile = req.files?.shoes_photo?.[0];

        if (!modelFile || !shoesFile) {
            return res.status(400).json({ success: false, message: 'Both model_photo and shoes_photo are required.' });
        }

        // Upload both files to Cloudinary
        const modelUpload = await cloudinary.uploader.upload(modelFile.path, { folder: 'tryon/shoes' });
        const shoesUpload = await cloudinary.uploader.upload(shoesFile.path, { folder: 'tryon/shoes' });

        const modelUrl = modelUpload.secure_url;
        const shoesUrl = shoesUpload.secure_url;

        const description = req.body.description || 'try on these shoes realistically on my feet';
        const email = process.env.THENEWBLACK_EMAIL;
        const password = process.env.THENEWBLACK_PASSWORD;

        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);
        formData.append('description', description);
        formData.append('model_photo', modelUrl);
        formData.append('shoes_photo', shoesUrl);

        // Call TheNewBlack Shoes Try-On API
        const response = await axios.post('https://thenewblack.ai/api/1.1/wf/vto-shoes', formData, {
            headers: formData.getHeaders(),
            maxBodyLength: Infinity,
        });

        // Clean up temporary files
        fs.unlinkSync(modelFile.path);
        fs.unlinkSync(shoesFile.path);

        res.json({
            success: true,
            message: 'Shoes try-on result received successfully.',
            data: response.data,
        });

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Server Error: Unable to process shoes try-on request.',
            error: error.response?.data || error.message,
        });
    }
};

exports.tryOnJewelry = async (req, res) => {
    try {
        const modelFile = req.files?.model_photo?.[0];
        const jewelryFile = req.files?.jewelry_photo?.[0];

        if (!modelFile || !jewelryFile) {
            return res.status(400).json({ success: false, message: 'Both model_photo and jewelry_photo are required.' });
        }

        // Upload both files to Cloudinary
        const modelUpload = await cloudinary.uploader.upload(modelFile.path, { folder: 'tryon/jewelry' });
        const jewelryUpload = await cloudinary.uploader.upload(jewelryFile.path, { folder: 'tryon/jewelry' });

        const modelUrl = modelUpload.secure_url;
        const jewelryUrl = jewelryUpload.secure_url;

        const description = req.body.description || 'try on this jewelry realistically on my body';
        const email = process.env.THENEWBLACK_EMAIL;
        const password = process.env.THENEWBLACK_PASSWORD;

        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);
        formData.append('description', description);
        formData.append('model_photo', modelUrl);
        formData.append('jewelry_photo', jewelryUrl);

        // Call TheNewBlack Jewelry Try-On API
        const response = await axios.post('https://thenewblack.ai/api/1.1/wf/vto-jewelry', formData, {
            headers: formData.getHeaders(),
            maxBodyLength: Infinity,
        });

        // Clean up local files
        fs.unlinkSync(modelFile.path);
        fs.unlinkSync(jewelryFile.path);

        res.json({
            success: true,
            message: 'Jewelry try-on result received successfully.',
            data: response.data,
        });

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Server Error: Unable to process jewelry try-on request.',
            error: error.response?.data || error.message,
        });
    }
};

exports.tryOnBag = async (req, res) => {
    try {
        const modelFile = req.files?.model_photo?.[0];
        const bagFile = req.files?.bag_photo?.[0];

        if (!modelFile || !bagFile) {
            return res.status(400).json({ success: false, message: 'Both model_photo and bag_photo are required.' });
        }

        // Upload both files to Cloudinary
        const modelUpload = await cloudinary.uploader.upload(modelFile.path, { folder: 'tryon/bag' });
        const bagUpload = await cloudinary.uploader.upload(bagFile.path, { folder: 'tryon/bag' });

        const modelUrl = modelUpload.secure_url;
        const bagUrl = bagUpload.secure_url;

        const description = req.body.description || 'try this bag on my shoulder naturally';
        const email = process.env.THENEWBLACK_EMAIL;
        const password = process.env.THENEWBLACK_PASSWORD;

        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);
        formData.append('description', description);
        formData.append('model_photo', modelUrl);
        formData.append('bag_photo', bagUrl);

        // Call TheNewBlack Bag Try-On API
        const response = await axios.post('https://thenewblack.ai/api/1.1/wf/vto-bag', formData, {
            headers: formData.getHeaders(),
            maxBodyLength: Infinity,
        });

        // Clean up local temporary files
        fs.unlinkSync(modelFile.path);
        fs.unlinkSync(bagFile.path);

        res.json({
            success: true,
            message: 'Bag try-on result received successfully.',
            data: response.data,
        });

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Server Error: Unable to process bag try-on request.',
            error: error.response?.data || error.message,
        });
    }
};

exports.tryOnClothes = async (req, res) => {
    try {
        const modelFile = req.files?.model_photo?.[0];
        const clothingFile = req.files?.clothing_photo?.[0];
        const clothingType = req.body.clothing_type; // 'tops' | 'bottoms' | 'one-pieces'

        if (!modelFile || !clothingFile || !clothingType) {
            return res.status(400).json({
                success: false,
                message: 'model_photo, clothing_photo, and clothing_type are required.',
            });
        }

        // Upload to Cloudinary
        const modelUpload = await cloudinary.uploader.upload(modelFile.path, { folder: 'tryon/clothes' });
        const clothingUpload = await cloudinary.uploader.upload(clothingFile.path, { folder: 'tryon/clothes' });

        const modelUrl = modelUpload.secure_url;
        const clothingUrl = clothingUpload.secure_url;

        const email = process.env.THENEWBLACK_EMAIL;
        const password = process.env.THENEWBLACK_PASSWORD;

        // Step 1: Request try-on and get ID
        const formData1 = new FormData();
        formData1.append('email', email);
        formData1.append('password', password);
        formData1.append('model_photo', modelUrl);
        formData1.append('clothing_photo', clothingUrl);
        formData1.append('clothing_type', clothingType);

        const startResponse = await axios.post('https://thenewblack.ai/api/1.1/wf/vto', formData1, {
            headers: formData1.getHeaders(),
            maxBodyLength: Infinity,
        });

        const resultId = startResponse.data; // the ID returned from API
        console.log('Received job ID:', resultId);

        // Clean up temp files
        fs.unlinkSync(modelFile.path);
        fs.unlinkSync(clothingFile.path);

        // Step 2: Wait 35 seconds then retrieve result
        await new Promise((resolve) => setTimeout(resolve, 35000)); // wait ~35s

        const formData2 = new FormData();
        formData2.append('email', email);
        formData2.append('password', password);
        formData2.append('id', resultId);

        const resultResponse = await axios.post('https://thenewblack.ai/api/1.1/wf/results', formData2, {
            headers: formData2.getHeaders(),
            maxBodyLength: Infinity,
        });

        const finalImageUrl = resultResponse.data; // URL of generated image

        res.json({
            success: true,
            message: 'Clothes try-on completed successfully.',
            id: resultId,
            image_url: finalImageUrl,
        });

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Server Error: Unable to process clothes try-on request.',
            error: error.response?.data || error.message,
        });
    }
};

// tryon.controller.js

// Dummy controller for Shoes Try-On API
exports.getTryOnResult = (req, res) => {
  try {
    // Dummy response data
    const response = {
      success: true,
      message: "Shoes try-on result received successfully.",
      data: "https://40e507dd0272b7bb46d376a326e6cb3c.cdn.bubble.io/f1762606396131x623989171948111000/tmpi7y6fiif.jpeg"
    };

    // Return response
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error in try-on controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};





