import axios from 'axios';
import { env } from '../env';

export const refreshClient = axios.create({
  baseURL: env.VITE_API_BASE_URL + '/api/v1',
  withCredentials: true, // Crucial for sending refresh HttpOnly cookie
});

export default refreshClient;
