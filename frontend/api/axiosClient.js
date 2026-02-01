import axios from 'axios';

// ⚠️ สำหรับ Android Emulator ใช้ 'http://10.0.2.2:3000'
// ⚠️ สำหรับเครื่องจริง (Physical Device) ให้ใช้ IP ของคอมพิวเตอร์ เช่น 'http://192.168.1.x:3000'
const BASE_URL = 'http://192.168.1.37:3000';

const axiosClient = axios.create({
    baseURL: BASE_URL,
    timeout: 10000, // 10 seconds timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosClient.interceptors.request.use(request => {
    console.log('Starting Request', JSON.stringify(request, null, 2));
    return request;
});

axiosClient.interceptors.response.use(response => {
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response;
}, error => {
    console.log('Response Error:', error);
    return Promise.reject(error);
});

export default axiosClient;
