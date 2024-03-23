const express = require('express')
const path = require('path');
const admins = require('../routes/admins/admins');
const authAdmin = require('../routes/admins/authAdmin')
const users = require('../routes/users/users');
const authUser = require('../routes/users/authUser')
const pharmacists = require('../routes/pharmacists/pharmacists')
const authPharmacist = require('../routes/pharmacists/authPharmacist')
// const authDoctors = require('../routes/doctors/authDoctors')
const doctors = require('../routes/doctors/doctors')
const laboratories = require('../routes/laboratories/laboratories')
const bloodDonor = require('../routes/services/bloodDonor')
const services = require('../routes/services/services')
const magazine = require('../routes/services/magazine')
const ambulanceDriver = require('../routes/services/ambulanceDriver')
const notificatios = require('../routes/notifications/notifications')

const statesAndMunicibalities = require('../routes/statesAndMunicibalities/statesAndMunicibalities')

const cors = require('cors')


module.exports = function (app) {
    app.use(express.json())
    app.use(cors({
        origin: 'http://localhost:5173',
    }));
    app.use(function (req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        next();
    });

    app.use('/Images', express.static(path.join(__dirname, '../Images')));


    // admins
    app.use('/api/admins', admins)
    app.use('/api/auth-admin', authAdmin)


    // mobile users
    app.use('/api/users', users)
    app.use('/api/auth-user', authUser)

    // website users
    app.use('/api/pharmacists', pharmacists)
    app.use('/api/auth-pharmacist', authPharmacist)

    // doctors
    app.use('/api/doctors', doctors)
    app.use('/api/laboratories', laboratories)

    
    // services
    app.use('/api/services/blood-donor', bloodDonor)
    app.use('/api/services/ambulance-drive', ambulanceDriver)
    app.use('/api/services/magazine', magazine)
    app.use('/api/all-services', services)

    

    app.use('/api/stateAndMunicibality', statesAndMunicibalities)
    
    // notifications
    app.use('/api/notifications', notificatios)
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).send('Something broke!');
      });
    // app.use('/api/services/blood-donor', bloodDonor)


    // app.use('/api/auth-doctor', authDoctors)
}