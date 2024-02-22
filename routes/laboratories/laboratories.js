const express = require('express');
const router = express.Router();
const multer = require('multer'); // For handling file uploads
const path = require('path');
const fs = require('fs');

const laboratoryController = require('../../controllers/laboratoryControllers/LaboratoryController')
const authLaboratoryController = require('../../controllers/laboratoryControllers/authLaboratoryController')
const medicalAnalys = require('../../controllers/laboratoryControllers/medicalAnalysis')

const admin = require('../../middleware/admin');
const authAdmin = require('../../middleware/authAdmin')
const laboratory = require('../../middleware/laboratory')
const authLaboratory = require('../../middleware/authLaboratory')
const user = require('../../middleware/user')
const authUser = require('../../middleware/authUser')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = './AnalysFiles/pdf'; // Specify the upload directory for PDF files
      fs.mkdirSync(uploadPath, { recursive: true }); // Ensure the directory exists
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, 'file-' + uniqueSuffix + ext); // Use a consistent fieldname (e.g., 'file') instead of file.fieldname
    },
  });
  
  const upload = multer({ storage });


router.post('/create-laboratory', laboratoryController.createLaboratory)
router.get('/profile-laboratory', [authLaboratory, laboratory], laboratoryController.getLaboratoryProfile)
router.post('/login-laboratory', authLaboratoryController.loginLaboratory)


// router.post('/create-medical-analys', [authLaboratory, laboratory], medicalAnalys.createMedicalAnalys)
// router.get('/all-medical-analysis', [authLaboratory, laboratory], medicalAnalys.getAllMedicalAnalysis)
// router.post('/deleteMedicalAnalysis/:analysisId', [authLaboratory, laboratory], medicalAnalys.deleteMedicalAnalys)
// router.get('/searchMedicalAnalysis', [authUser, user], medicalAnalys.searchForMedicalAnalys)
// router.get('/searchNameMedicalAnalysis/:name', [authUser, user], medicalAnalys.searchForNameMedicalAnalys)



router.post('/add-medical-analys-by-admin', [authAdmin, admin], medicalAnalys.addMedicalAnalysByAdmin)
router.post('/add-medical-analys-by-laboratory/:analysisId', [authLaboratory, laboratory], medicalAnalys.addMedicalAnalysByLaboratory)
router.post('/getUpToFiveMedicalAnalysNames', [authUser, user],  medicalAnalys.searchForFiveMedicalAnalysisNames)
router.post('/getNameMedicalAnalys', [authUser, user], medicalAnalys.searchForAnalysName)
router.get('/get-my-chosen-medical-analys', [authLaboratory, laboratory], medicalAnalys.getMyChosenAnalysisForLaboratory)
router.delete('/delete-chosen-medical-analysis/:medicalAnalysisId',[authLaboratory, laboratory], medicalAnalys.deleteMyChosenMedicalAnalysForLaboratory )
router.post('/upload-analys-file', [authLaboratory, laboratory], upload.single('file'),  medicalAnalys.uploadAnalysFile)
router.get('/get-user-analysis-files', [authUser, user], medicalAnalys.getAnalysisFilesForUser)
// router.get('/searchForLaboratory', [authUser, user], laboratoryController.serachForLaboratory)
router.get('/searchForLaboratory', [authUser, user], laboratoryController.serachForLaboratory)
router.post('/laboratories-near-me', [authUser, user],  laboratoryController.getLaboratoriesNearMe)
router.get('/profile-lab-for-user/:id', [authUser, user], laboratoryController.getLaboratoryProfileForUser)
module.exports = router