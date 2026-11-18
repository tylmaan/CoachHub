import axios from "axios";

const configuredOrigin: string | undefined = import.meta.env.VITE_BACKEND_ORIGIN;

export const BACKEND_ORIGIN = configuredOrigin ?? `http://${window.location.hostname}:5006`;

const axiosInstance = axios.create({
    baseURL: `${BACKEND_ORIGIN}/api`,
});

axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default axiosInstance;