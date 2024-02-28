const { Assistant, validateAssistant } = require("../../models/doctors/assistantDoctor")


async function registerAssistant(req, res) {
    try {
        const { error } = validateAssistant(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        const assistant = new Assistant({
            name: req.body.name,
            password: req.body.password,
            doctor: req.doctor._id
        });

        await assistant.save();

        res.status(201).send(assistant);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}

async function assistantLogin(req, res) {
    try {
        const { name, password } = req.body;

        const assistant = await Assistant.findOne({ name });
        if (!assistant) return res.status(400).send('Invalid name or password.');

        const validPassword = await bcrypt.compare(password, assistant.password);
        if (!validPassword) return res.status(400).send('Invalid name or password.');

        const token = assistant.generateAuthToken();
        res.header('x-auth-token', token).send({ name: assistant.name });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}

async function deleteAssistant(req, res) {
    try {
        const assistant = await Assistant.findByIdAndRemove(req.params.id);
        if (!assistant) return res.status(404).send('Assistant not found.');

        res.send(assistant);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}

async function getDoctorAssistants(req, res) {
    try {
        const doctorId = req.doctor._id;

        // Query the database to find all assistants belonging to the current doctor
        const assistants = await Assistant.find({ doctor: doctorId });

        res.status(200).send(assistants);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    registerAssistant,
    assistantLogin,
    deleteAssistant,
    getDoctorAssistants
}