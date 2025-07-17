import dotenv from "dotenv";

dotenv.config();

import Mixpanel from "mixpanel";
import { getTime } from "./assistants/helpers.js";

const MIXPANEL_SECRET = process.env.MIXPANEL_SECRET;
const MIXPANEL_TOKEN = process.env.MIXPANEL_TOKEN;

const mixpanel = Mixpanel.init(MIXPANEL_TOKEN, {
    secret: MIXPANEL_SECRET,
});

export const trackMixpanel = async (
    crawler,
    totalVacancies,
    successful,
    message,
    url = "Finish with error"
) => {
    mixpanel.track(
        crawler,
        {
            Url: url,
            "Vacancies found": totalVacancies,
            Status: successful === true ? "Success" : "Fail",
            Message: message ? message : "Parsing completed successfully",
        },
        (err) => {
            if (err) {
                console.error(`Error tracking event for ${crawler}:`, err);
            } else {
                console.log(`Event for ${crawler} tracked successfully`);
                console.log(`Total vacancies in ${crawler}: ${totalVacancies}`);
            }
        }
    );
};
