import axios from 'axios';

const api = axios.create({
    baseURL: 'https://job-portal-pi-two.vercel.app/api',
    withCredentials: true, // important for cookies
});

export default api;
