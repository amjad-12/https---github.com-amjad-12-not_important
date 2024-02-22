const express = require('express');
const router = express.Router();
const user = require('../../middleware/user');
const authUser = require('../../middleware/authUser')
const bloodDonorController = require('../../controllers/servicesController/bloodDonorController')
const multer = require('multer');
const path = require('path')


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./Images/BloodDonorsImages");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.post('/', [authUser, user], upload.single('personalIdentificationImage'), bloodDonorController.registerAsBloodDonor)
router.post('/search', [authUser, user], bloodDonorController.searchForBloodDonors)

module.exports = router;