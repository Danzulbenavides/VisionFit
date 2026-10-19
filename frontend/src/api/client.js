import axios from "axios";

import { getToken } from "../utils/storage";
import { API_URL } from "../config";

const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },

});

apiClient.interceptors.request.use(
    async(config) => {
        const token = await getToken();

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const serverMessage = error.response ? error.response.data ? error.response.data.error ? error.response.data.error.message : null : null : null;

        if (serverMessage) {
            error.message = serverMessage;
        }

        return Promise.reject(error);
    },
);

export default apiClient;