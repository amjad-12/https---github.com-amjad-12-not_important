const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path')

const authDoctor = require('../../middleware/authDoctor')
const doctor = require('../../middleware/doctor')
const user = require('../../middleware/user')
const authUser = require('../../middleware/authUser')

const admin = require('../../middleware/admin')
const authAdmin = require('../../middleware/authAdmin')

const authAssistant =  require('../../middleware/authAssistant')
const assistantBook = require('../../middleware/assistantBook')
const assistantControlExam = require('../../middleware/assistantControlExam')

const doctorController = require('../../controllers/doctorController/doctorController')
const authDoctorController = require('../../controllers/doctorController/authDoctorController')
const examinationController = require('../../controllers/doctorController/examinationController')
const prescriptionContoller = require('../../controllers/doctorController/prescriptionContoller')
const medicalReportController = require('../../controllers/doctorController/medicalReportController')
const specializationContoller = require('../../controllers/doctorController/specializationController')
const assistantDoctorController = require('../../controllers/doctorController/assistantDoctorController')

const appointmentController = require('../../controllers/doctorController/bookingController')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./Images/SpecializationsIcons")
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname))
    }
})

const upload = multer({storage: storage})

router.put('/schedule',[authDoctor, doctor], appointmentController.editSchedule)
router.get('/availability/:doctorId', appointmentController.getAvailability)
router.get('/availableslots/:doctorId', appointmentController.getAvailableSlotsOnDays)
router.get('/available-slots-for-user/:doctorId', [authUser, user],appointmentController.getslots)
router.get('/available-slots-for-doctor',[authDoctor, doctor],appointmentController.getSlotsStatusForDoctorByToday)
router.get('/slots-fake',appointmentController.getslotsFake)
router.post('/appointments/book',[authUser, user], appointmentController.makeAppointmentNew)
router.post('/:doctorId/appointments/make-and-approve', appointmentController.makeAppointmentAndByDoctorForUser)

router.get('/cancelledAppointmentsByUser',[authUser, user], appointmentController.listCancelledDatesByUser)
router.get('/cancelledAppointmentsByDoctor',[authUser, user],  appointmentController.listCancelledDatesByDoctor)
router.get('/previousAppointments',[authUser, user], appointmentController.previousDates)
router.get('/pendingAppointments',[authUser, user],  appointmentController.pendingDates)
router.get('/currentAppointments',[authUser, user],  appointmentController.currentDates)
router.put('/cancelAppointmentByUser/:appointmentId',[authUser, user],  appointmentController.cancelAppointmentByUser)
router.put('/cancelAppointmentByUserNotHim/:appointmentId',[authUser, user],  appointmentController.cancelAppointmentByUserBecauseTheDoctorBookFalse)
router.put('/approveAppointmentsByUser/:appointmentId',[authUser, user],  appointmentController.approveAppointmentByUser)

// for doctor dashboard

router.get('/analysAppointmentsForDoctor',[authDoctor, doctor], appointmentController.analysAppointmentForDoctor)
router.post('/bookForUserByDoctor',[authDoctor, doctor], appointmentController.bookAppointmentByDoctor)
router.get('/previousAppointmentsForDoctor',[authDoctor, doctor], appointmentController.previousDatesForDoctor)
router.get('/pendingAppointmentsForDoctor',[authDoctor, doctor], appointmentController.pendingDatesForDoctor)
router.get('/currentAppointmentsForDoctor',[authDoctor, doctor], appointmentController.currentDatesForDoctor)
router.get('/futureAppointmentsForDoctor',[authDoctor, doctor], appointmentController.futureDatesForDoctor)
router.get('/cancelledAppointmentByUserForDoctor',[authDoctor, doctor], appointmentController.listCancelledDatesByUserForDoctor)
router.get('/cancelledAppointmentByDoctorForDoctor',[authDoctor, doctor], appointmentController.listCancelledDatesByDoctorForDoctor)
router.get('/cancelledAppointmentByUserNotHimForDoctor',[authDoctor, doctor], appointmentController.listCancelledDatesByUserIncorrectForDoctor)
router.put('/cancelAppointmentByDoctor/:appointmentId',[authDoctor, doctor],  appointmentController.cancelAppointmentByDoctor)
router.put('/completeFlagAppointmentByDoctor/:appointmentId',[authDoctor, doctor],  appointmentController.completeFlagAppointmentByDoctor)


router.get('/currentSlot/:doctorId', [authUser, user], appointmentController.getCurrentSlot)

router.post('/create-doctor', doctorController.createDoctor)
router.put('/edit-profile-doctor',[authDoctor, doctor], doctorController.editProfileDoctor)
router.post('/login-doctor', authDoctorController.loginDoctor)
router.get('/my-profile', [authDoctor, doctor], doctorController.getProfileDoctor)

router.get('/doctor-profile-for-user/:doctorId', [authUser, user], doctorController.getProfileDoctorShowUser)
router.get('/doctor-profile-like-user',[authDoctor, doctor], doctorController.getProfileDoctorLikeUser)

router.get('/serach-for-doctor', [authUser, user], doctorController.serachForDoctor)
router.post('/doctors-near-me', [authUser, user],  doctorController.getDoctorsNearMe)


router.post('/add-assistant', [authDoctor, doctor], doctorController.addAssistantDoctor)
router.get('/all-doctor-assistants', [authDoctor, doctor], doctorController.getAllAssitantForDoctor)
router.delete('/delete-assistant/:assistantId', [authDoctor, doctor], doctorController.deleteAssistantForDoctor)


// apis to use for medical reports and prescription
// router.post('/prescriptions', [authDoctor, doctor], prescriptionContoller.createPrescription)
// router.get('/all-doctor-prescriptions-made',[authDoctor, doctor], prescriptionContoller.getDoctorPrescription)
// router.get('/patient-prescriptions', [authUser, user], prescriptionContoller.getPatientPrescription)
// router.post('/medical-rebort', [authDoctor, doctor], medicalReportController.createMedicalReport)
// router.get('/all-doctor-medical-report',  [authDoctor, doctor],  medicalReportController.getDoctorMedicalReport)
// router.get('/patient-medical-reports', [authUser, user], medicalReportController.getPatientMedicalReports)



router.post('/book-examination', [authUser, user], examinationController.bookExamination)
router.post('/doctor-book-examination', [authDoctor, doctor], examinationController.bookExaminationByDoctor)
router.post('/increment-current-number', [authDoctor, doctor], examinationController.incrementTheCurrentNumber)
router.get('/get-current-number', [authDoctor, doctor], examinationController.getCurrentNumber)
router.get('/get-current-and-nuxt-number-for-doctor', [authDoctor, doctor], examinationController.getCurentAndNuxtNumberWithoutDataForDoctor)
router.get('/get-current-and-nuxt-number-for-doctor', [authDoctor, doctor], examinationController.getCurentAndNuxtNumberWithoutDataForDoctor)
router.get('/get-next-number-for-doctor', [authDoctor, doctor], examinationController.getNextNumberForDoctor)
router.get('/get-current-number-without-data/:doctorId',[authDoctor, doctor], examinationController.getCurentNumberWithoutData)
router.get('/get-next-number/:doctorId',[authUser, user], examinationController.getNextNumber)
router.get('/getAllExaminationNumbersWithInfo', [authDoctor, doctor], examinationController.getAllTheBookedNumberWithInfo)
router.get('/getAllExaminationNumbersWithFlag/:doctorId', [authUser, user], examinationController.getAllExaminationNumbersWithFlag)
router.put('/clearBookedPatients', [authDoctor, doctor], examinationController.clearBookedPatients)


router.post('/add-specialization-with-icon',  [authAdmin, admin], upload.single('image'), specializationContoller.addSpecializationWithIcon)
router.get('/get-all-specialization-with-icon',[authUser, user], specializationContoller.getAllSpecializationWithIcon)
router.get('/get-all-specialization-doctor',  specializationContoller.getAllSpecializationWithoutIcon)
// router.get('/get-suggestion-specialization-with-icon/:name', [authUser, user], specializationContoller.getSpecializationSuggestionsWithIcon)
router.get('/get-suggestion-specialization-with-icon/:name', specializationContoller.getSpecializationSuggestionsWithIcon)


router.post('/assistant-login', assistantDoctorController.loginAssistantDoctor)
router.post('/assistant-book', [authAssistant, assistantBook], examinationController.bookExaminationByAssitant)
router.get('/get-current-and-next-number-for-doctor-by-assistant', [authAssistant], examinationController.getCurentAndNuxtNumberWithoutDataForDoctorByAssistant)
router.get('/getAllExaminationNumbersWithInfoToAssistant', [authAssistant], examinationController.getAllTheBookedNumberWithInfoToAssistant)
router.post('/increment-current-number-by-assistant', [authAssistant, assistantControlExam], examinationController.incrementTheCurrentNumberByAssistant)
router.put('/clearBookedPatientsByAssistant', [authAssistant, assistantControlExam], examinationController.clearBookedPatientsByAssistant)

router.get('/get-patient-dates', [authUser, user], examinationController.getAllDatesForPatient)
// router.get('/current-exam-number', [authDoctor, doctor], examinationController.getCurrentExaminationNumber)
// router.post('/mark-done', examinationController.markExaminationDone)
// router.get('/booked-numbers', examinationController.getBookedNumbers)


module.exports = router