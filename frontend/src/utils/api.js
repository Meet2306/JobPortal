import axios from 'axios';

const api = axios.create({
    baseURL: 'https://jobportal-psi-dun.vercel.app/api',
    withCredentials: true, // important for cookies
});

export default api;
// http://localhost:5000/api