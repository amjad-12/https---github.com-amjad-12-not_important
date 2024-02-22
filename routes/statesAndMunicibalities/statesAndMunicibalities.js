const express = require('express');
const router = express.Router();
const stateAndMunicibalityController = require('../../controllers/stateAndMunicibalityController/stateAndMunicibalityController')

router.get('/all-states', stateAndMunicibalityController.getAllStates);
router.get('/get-municibality-by-state/:mattricule', stateAndMunicibalityController.getMunicibalitiesForState);

module.exports = router;