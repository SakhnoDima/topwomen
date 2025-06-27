import axios from "axios";
import { trackMixpanel } from "../mixpanel.js";
import axiosRetry from "axios-retry";

axiosRetry(axios, {
    retries: 5, // Кількість спроб
    retryDelay: (retryCount) => {
        console.log(`Retry saving data: ${retryCount}`);
        return retryCount * 2000; // Затримка між спробами (1 секунда, 2 секунди, 3 секунди тощо)
    },
    retryCondition: (error) => {
        const isRetryable = axiosRetry.isNetworkOrIdempotentRequestError(error);
        const status = error.response?.status;

        console.log("Retry condition triggered with:");
        console.log("Is network or idempotent error:", isRetryable);
        console.log("HTTP status:", status);
        console.log(
            "Full error response:",
            error.response?.data || "No response data"
        );

        return isRetryable || [502, 503, 504].includes(status);
    },
});

const chunkArray = (array, size) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
};

export const dataSaver = async (companyName, vacancies) => {
    const chunks = chunkArray(vacancies, 1000);
    let totalSaved = 0;
    for (const [index, chunk] of chunks.entries()) {
        const responseBody = {
            company: companyName,
            vacancies: chunk,
            ...(index === chunks.length - 1 ? { is_last_batch: true } : {}),
        };
        try {
            await axios.post(
                "https://topwomen.careers/wp-json/custom/v1/add-company-vacancies",
                JSON.stringify(responseBody),
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            totalSaved += chunk.length;
            console.log(
                `${companyName} batch ${index + 1}/${chunks.length} saved (${
                    chunk.length
                } items)`
            );
        } catch (error) {
            console.error("Error saving data:", error.message);
            console.error("Error saving data:", {
                message: error.message,
                response: error.response?.data || "No response data",
                status: error.response?.status || "No status",
            });
            throw new Error(`Saving data failed: ${error.message}`);
        }
    }
    console.log(`${companyName} vacancies saved!`);
    console.log(`Total vacancies in ${companyName}: ${totalSaved}`);
    trackMixpanel(companyName, totalSaved, true);
};
