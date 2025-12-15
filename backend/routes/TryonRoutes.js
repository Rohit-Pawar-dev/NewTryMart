const express = require('express');
const router = express.Router();
const getCustomMulter = require('../utils/customMulter');

// Import all controllers
const {
    tryOnAccessory,
    tryOnShoes,
    tryOnJewelry,
    tryOnBag,
    tryOnClothes,
    getTryOnResult
} = require('../controllers/TryOnController.js/VirtualTryOn'); // adjust path if needed

// Custom multer instance (uploads stored under /uploads/tryon)
const upload = getCustomMulter('tryon');

/* ----------------------- ACCESSORY ----------------------- */
router.post(
    '/tryon-accessory',
    upload.fields([
        { name: 'model_photo', maxCount: 1 },
        { name: 'accessory_photo', maxCount: 1 },
    ]),
    tryOnAccessory
);

/* ----------------------- SHOES ----------------------- */
// router.post(
//     '/tryon-shoes',
//     upload.fields([
//         { name: 'model_photo', maxCount: 1 },
//         { name: 'shoes_photo', maxCount: 1 },
//     ]),
//     tryOnShoes
// );

/* ----------------------- JEWELRY ----------------------- */
router.post(
    '/tryon-jewelry',
    upload.fields([
        { name: 'model_photo', maxCount: 1 },
        { name: 'jewelry_photo', maxCount: 1 },
    ]),
    tryOnJewelry
);

/* ----------------------- BAG ----------------------- */
router.post(
    '/tryon-bag',
    upload.fields([
        { name: 'model_photo', maxCount: 1 },
        { name: 'bag_photo', maxCount: 1 },
    ]),
    tryOnBag
);

/* ----------------------- CLOTHES ----------------------- */
router.post(
    '/tryon-clothes',
    upload.fields([
        { name: 'model_photo', maxCount: 1 },
        { name: 'clothing_photo', maxCount: 1 },
    ]),
    tryOnClothes
);

/* ----------------------- GET TRY-ON RESULT ----------------------- */

router.post(
    '/tryon-shoes',
    upload.fields([
        { name: 'model_photo', maxCount: 1 },
        { name: 'shoes_photo', maxCount: 1 },
    ]),
    // getTryOnResult
    tryOnShoes
);
module.exports = router;
