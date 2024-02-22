const express = require('express');
const router = express.Router();

const admin = require('../../middleware/admin');

const authAdmin = require('../../middleware/authAdmin')
const adminController = require('../../controllers/adminsController/adminController');
const adminPharmacyDashborad = require('../../controllers/adminsController/needConfirm');
const adminDoctorController = require('../../controllers/adminsController/adminDoctorController')
const adminLaboratoryController = require('../../controllers/adminsController/adminLaboratoryController')
const adminAddStateMuniciplaity = require('../../controllers/adminsController/adminAddStateMunicipality')

router.post('/', adminController.createAdmin);
router.get('/me', [authAdmin, admin], adminController.getProfileAdmin);
router.put('/me', [authAdmin, admin], adminController.editProfileAdmin);

router.get('/admin-all-pharmacies', [authAdmin, admin], adminPharmacyDashborad.getAllPharmacies);
router.get('/pharmacies-not-confirmed', [authAdmin, admin], adminPharmacyDashborad.pharmaciesNotConfirmed);
router.put('/toggle-pharmacy-confirmation/:id', [authAdmin, admin], adminPharmacyDashborad.togglePharmacyConfirmation);

router.get('/admin-all-admins', [authAdmin, admin], adminController.getAllAdmins)
router.put('/toggle-admin-confirmation/:adminId', [authAdmin, admin], adminController.toggleAdminConirmation)

router.get('/admin-all-doctors', [authAdmin, admin], adminDoctorController.getAllDoctors)
router.get('/doctors-not-confirmed', [authAdmin, admin], adminDoctorController.doctorsNeedConfirmation)
router.put('/toggle-doctor-confirmation/:doctorId', [authAdmin, admin], adminDoctorController.toggleDoctorConirmation)

router.get('/admin-all-laboratories', [authAdmin, admin], adminLaboratoryController.getAllLaboratories)
router.get('/laboratories-not-confirmed', [authAdmin, admin], adminLaboratoryController.laboratoriesNeedConfirmation)
router.put('/toggle-laboratory-confirmation/:labId', [authAdmin, admin], adminLaboratoryController.toggleLaboratoryConirmation)

router.post('/add-state', [authAdmin, admin], adminAddStateMuniciplaity.addState)
router.get('/get-all-states', adminAddStateMuniciplaity.getAllStates)
router.get('/municipalities-by-state/:stateId', adminAddStateMuniciplaity.getMunicipalityByStateId)
router.post('/add-municipality', [authAdmin, admin], adminAddStateMuniciplaity.addMunicipality)
router.get('/states/suggestions', adminAddStateMuniciplaity.getStateSuggestions)
router.get('/municipalities', adminAddStateMuniciplaity.getMunicipalitySuggestions)

module.exports = router;