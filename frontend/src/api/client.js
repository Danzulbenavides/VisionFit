import axios from "axios";

import { getToken } from "../utils/storage";
const API_URL = "http://192.168.18.206:5000/api";

const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 10000,
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
        const serverMessage = error.response?.data?.error?.message;

        if (serverMessage) {
            error.message = serverMessage;
        }

        return Promise.reject(error);
    },
);

export default apiClient;