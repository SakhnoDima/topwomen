import axios from "axios";
import { trackMixpanel } from "../mixpanel.js";
import axiosRetry from "axios-retry";
import { TARGET_SITES_URL } from "../constants/index.js";

axiosRetry(axios, {
    retries: 5,
    retryDelay: (retryCount) => {
        console.log(`Retry saving data: ${retryCount}`);
        return retryCount * 2000;
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

    try {
        for (const url of TARGET_SITES_URL) {
            let totalSaved = 0;
            for (const [index, chunk] of chunks.entries()) {
                const responseBody = {
                    company: companyName,
                    vacancies: chunk,
                    ...(index === chunks.length - 1
                        ? { is_last_batch: true }
                        : {}),
                };

                await axios.post(url, JSON.stringify(responseBody), {
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
                console.log(
                    `${companyName} batch ${index + 1}/${
                        chunks.length
                    } saved to ${url} (${chunk.length} items)`
                );
                totalSaved += chunk.length;
            }
            trackMixpanel(companyName, totalSaved, true, undefined, url);
        }
    } catch (error) {
        console.error("Error saving data:", error.message);
        console.error("Error saving data:", {
            message: error.message,
            response: error.response?.data || "No response data",
            status: error.response?.status || "No status",
        });
        throw new Error(`Saving data failed: ${error.message}`);
    }

    console.log(`${companyName} vacancies saved!`);
};
