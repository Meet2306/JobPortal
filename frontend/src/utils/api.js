import axios from 'axios';

const api = axios.create({
    baseURL: 'https://jobportal-7lf0.onrender.com/api',
    withCredentials: true, // important for cookies
});

export default api;
// http://localhost:5000/api