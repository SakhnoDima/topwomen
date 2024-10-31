require('dotenv').config();

const Mixpanel = require('mixpanel');
const {getTime} = require("./assistants/helpers");


const mixpanel = Mixpanel.init('55c6bf4315f655991e2578538d013cc2', {
    secret: 'd530bab81b365138cc23ba58ff4eff5e',
});


const trackMixpanel = async (crawler, totalVacancies, successful, message) => {
    mixpanel.track(crawler, {
        "Vacancies found": totalVacancies,
        Status: successful === true ? 'Success' : 'Fail',
        Message: message ? message : "Parsing completed successfully"
    }, (err) => {
        if (err) {
            console.error('Error tracking event:', err);
        } else {
            console.log('Event tracked successfully');
        }
    });
}

module.exports = {
    trackMixpanel
}