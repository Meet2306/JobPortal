import axios from 'axios';

const api = axios.create({
    baseURL: 'job-portal-gamma-liard.vercel.app',
    withCredentials: true, // important for cookies
});

export default api;
