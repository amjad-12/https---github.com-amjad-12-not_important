const { State, validateState } = require('../../models/stateAndMuniciplaity/state')
const { Municipality, validateMunicipality } = require('../../models/stateAndMuniciplaity/municipality')
const mongoose = require('mongoose');

async function addState(req, res) {
    try {
        // Validate the request body using Joi
        const { error } = validateState(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        // Create a new state
        const state = new State({
            name: req.body.name,
            // Add other fields as needed
        });

        // Save the state to the database
        await state.save();

        res.status(201).json(state);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function getAllStates(req, res) {
    try {
        const states = await State.find({}, '_id name'); // Query to retrieve only _id and name fields

        if (!states || states.length === 0) {
            return res.status(404).json({ message: 'No states found' });
        }

        res.status(200).json(states);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function getStateSuggestions(req, res) {
    console.log(req.query)
    try {
        const { query } = req.query;
        const states = await State.find(
            { name: { $regex: query, $options: 'i' } }, // Case-insensitive regex search
            '_id name'
        ).limit(10); // Limit to 10 suggestions (adjust as needed)

        if (!states || states.length === 0) {
            return res.status(404).json({ message: 'No states found' });
        }

        res.status(200).json(states);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function addMunicipality(req, res) {
    try {
        // Validate the request body using Joi
        const { error } = validateMunicipality(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        // Create a new Municipality instance with validated data
        const { name, state } = req.body;
        const municipality = new Municipality({ name, state });

        // Save the municipality to the database
        await municipality.save();

        // Return a success response
        return res.status(201).json({ message: 'Municipality added successfully', data: municipality });
    } catch (error) {
        // Handle any errors that occur during the process
        return res.status(500).json({ error: 'Internal server error' });
    }
}

async function getMunicipalityByStateId(req, res) {
    try {
        const stateId = req.params.stateId;



        // Query the municipalities that reference the specified state
        const municipalities = await Municipality.find({ state: stateId });

        return res.status(200).json({ data: municipalities });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// async function getMunicipalitySuggestions(req, res) {
//     try {
//         const { query } = req.query;
//         const municipalities = await Municipality.find(
//             { name: { $regex: query, $options: 'i' } }, // Case-insensitive regex search
//             '_id name'
//         ).limit(10); // Limit to 10 suggestions (adjust as needed)

//         if (!municipalities || municipalities.length === 0) {
//             return res.status(404).json({ message: 'No municipalities found' });
//         }

//         res.status(200).json(municipalities);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// }

async function getMunicipalitySuggestions (req, res) {
    try {
        const { stateId, municipalityName } = req.query;

        // Find municipalities referenced to the selected state and matching name
        const municipalities = await Municipality.find({ state: stateId, name: new RegExp(municipalityName, 'i') }, '_id name');

        // if (!municipalities || municipalities.length === 0) {
        //     return res.status(404).json({ message: 'No matching municipalities found' });
        // }

        res.status(200).json(municipalities);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    addState,
    getAllStates,
    addMunicipality,
    getMunicipalityByStateId,
    getStateSuggestions,
    getMunicipalitySuggestions
}