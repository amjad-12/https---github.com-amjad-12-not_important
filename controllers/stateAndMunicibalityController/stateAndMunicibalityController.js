const { getWilayaList, getBaladyiatsForWilaya } = require('@dzcode-io/leblad');


async function getAllStates(req, res) {
    try {
        const allWilayasDetails = await getWilayaList(['name', 'name_ar', 'name_en', 'mattricule']);
        const language = req.headers['language'];

        console.log("Requested Language:", language); // Debugging line

        const formattedWilayas = allWilayasDetails.map(wilaya => {
            let selectedName;
            switch (language) {
                case 'en':
                    selectedName = wilaya.name_en;
                    break;
                case 'ar':
                    selectedName = wilaya.name_ar;
                    break;
                case 'fr':
                    selectedName = wilaya.name;
                    break;
                default:
                    selectedName = wilaya.name;
                    break;
            }
            return {
                // _id: wilaya._id, // Assuming there's an _id field
                name: selectedName,
                mattricule: wilaya.mattricule
            };
        });

        res.status(200).json({
            message: "Data retrieved successfully",
            data: formattedWilayas,
            status: true,
            code: 200
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Internal server error',
            data: null,
            status: false,
            code: 500
        });
    }
}



async function getMunicibalitiesForState(req, res) {
    try {
        const mattricule = parseInt(req.params.mattricule);

        if (isNaN(mattricule)) {
            return res.status(400).json({
                message: 'Invalid mattricule, must be a number',
                data: null,
                status: false,
                code: 400
            });
        }

        const baladyiats = await getBaladyiatsForWilaya(mattricule);

        if (!baladyiats) {
            return res.status(404).json({
                message: 'Wilaya not found or has no baladyiats',
                data: null,
                status: false,
                code: 404
            });
        }

        const language = req.headers['language'] || 'default';

        // Map the response based on the requested language
        const formattedBaladyiats = baladyiats.map(baladiyat => {
            let name;
            switch (language) {
                case 'en':
                    name = baladiyat.name_en || baladiyat.name;
                    break;
                case 'ar':
                    name = baladiyat.name_ar || baladiyat.name;
                    break;
                case 'fr':
                default:
                    name = baladiyat.name;
                    break;
            }
            return { code: baladiyat.code, name }; // Assuming baladiyat is a Mongoose document
        });

        res.status(200).json({
            message: "Data retrieved successfully",
            data: formattedBaladyiats,
            status: true,
            code: 200
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Internal server error',
            data: null,
            status: false,
            code: 500
        });
    }
}


module.exports = {
    getAllStates,
    getMunicibalitiesForState,
};