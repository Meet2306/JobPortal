import axios from 'axios';

const api = axios.create({
    baseURL: 'https://job-portal-xyzs-projects-9ffedc98.vercel.app',
    withCredentials: true, // important for cookies
});

export default api;
