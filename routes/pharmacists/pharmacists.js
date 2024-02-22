const express = require('express');
const router = express.Router();

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const pharmacistController = require('../../controllers/pharmacistsControllers/pharmacistController');
const pharmacistMedicinesController = require('../../controllers/pharmacistsControllers/PharmacistMedicinesController')
const ourMedicineController = require('../../controllers/pharmacistsControllers/ourMedicineController')
// const medicineSearchController = require('../../controllers/pharmacistsControllers/PharmacistMedicineSearchController')
// const removePharmacistMedicine = require('../../controllers/pharmacistsControllers/PharmacistMedicinesController')

const admin = require('../../middleware/admin');
const authAdmin = require('../../middleware/authAdmin')
const pharmacist = require('../../middleware/pharmacist')
const authPharmacist = require('../../middleware/authPharmacist');
const user = require('../../middleware/user')
const authUser = require('../../middleware/authUser')

router.post('/', pharmacistController.createPharmacist)
router.get('/search-for-pharmacy', pharmacistController.serachForPharmacy)
router.post('/our-medicine', [authAdmin, admin], upload.single('file'), ourMedicineController.ourMedicine)
router.post('/pharamacist-mdicine-file',[authPharmacist, pharmacist], upload.single('file'), [authPharmacist, pharmacist], pharmacistMedicinesController.PharmacistMedicines)
router.post('/pharamacist-mdicine-single', [authPharmacist, pharmacist], pharmacistMedicinesController.onePharmacistMedicine)
router.post('/pharamacist-remove-medicine', [authPharmacist, pharmacist], pharmacistMedicinesController.removePharmacistMedicine)

router.get('/pharmacist-medicine-search',[authUser, user], pharmacistMedicinesController.searchForMedicine)
router.get('/pharmacist-complete-name',[authUser, user], pharmacistMedicinesController.searchForNameMedicine)
router.get('/pharmacist-my-medicine', [authPharmacist, pharmacist], pharmacistMedicinesController.getAllPharmacyMedicine)


router.put('/toggle-is-open', [authPharmacist, pharmacist], pharmacistMedicinesController.toggleIsOpen)
router.get('/know-is-open', [authPharmacist, pharmacist], pharmacistMedicinesController.knowIsOpen)

// router.post('/pharamaist-mdicine', upload.single('file'), PharmacistMedicinesController.PharmacistMedicines)

module.exports = router