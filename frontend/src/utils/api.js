import axios from 'axios';

const api = axios.create({
    baseURL: 'https://job-portal-two-chi.vercel.app/api',
    withCredentials: true, // important for cookies
});

export default api;
