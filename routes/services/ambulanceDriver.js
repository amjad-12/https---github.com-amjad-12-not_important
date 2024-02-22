const express = require('express');
const router = express.Router();
const user = require('../../middleware/user');
const authUser = require('../../middleware/authUser')
const ambulanceDriverController = require('../../controllers/servicesController/ambulanceDriverController')
const multer = require('multer');
const path = require('path')


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./Images/AmbulanceDriverImages");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.post('/', [authUser, user], upload.single('personalIdentificationImage'), ambulanceDriverController.registerAsAmbulanceDriver)
router.post('/search', [authUser, user], ambulanceDriverController.searchForAmbulanceDrivers)

module.exports = router;