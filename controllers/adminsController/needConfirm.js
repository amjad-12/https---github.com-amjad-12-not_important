const { Pharmacist } = require('../../models/pharamacists/pharmacist')

async function pharmaciesNotConfirmed(req, res) {
  try {
    const notConfirmed = await Pharmacist.find({ isConfirmed: false })
    return res.status(200).send(notConfirmed)
  } catch (ex) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function getAllPharmacies(req, res) {
  try {
    const pharamacists = await Pharmacist.find()
      .populate({
        path: 'state',
        select: '-_id name',
      })
      .populate({
        path: 'municipality',
        select: '-_id name',
      }).select('name phone email isConfirmed municipality state cardIdNumber codeOfficine pharmacyLicenseNumber')

    return res.status(200).json(pharamacists)
  } catch (ex) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

async function togglePharmacyConfirmation(req, res) {
  try {
    const pharmacyId = req.params.id;
    if (!pharmacyId) {
      return res.send('pharmacy id is required')
    }

    let pharmacy = await Pharmacist.findById(pharmacyId);
    if (!pharmacy) {
      return res.status(404).send('Pharmacy not found');
    }

    pharmacy.isConfirmed = !pharmacy.isConfirmed
    await pharmacy.save()


    return res.status(200).json({message: 'Pharmacy confirmation status toggled successfully', isConfirmed: pharmacy.isConfirmed });
  } catch (ex) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
}

module.exports = {
  pharmaciesNotConfirmed,
  togglePharmacyConfirmation,
  getAllPharmacies
}