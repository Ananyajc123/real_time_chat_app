import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8082/api' });

API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export const login = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);
export const getRooms = () => API.get('/chat/rooms');
export const getMessages = (roomId, limit = 50) => API.get(`/chat/rooms/${roomId}/messages?limit=${limit}`);
export const createDM = (userId) => API.post(`/chat/rooms/dm/${userId}`);
export const createGroup = (name, memberIds) => API.post('/chat/rooms/group', { name, memberIds });
export const searchUsers = (q) => API.get(`/chat/users/search?query=${q}`);
export const getOnlineUsers = () => API.get('/chat/users/online');
export const getUserProfile = (userId) => API.get(`/chat/users/${userId}`);
export const updateProfile = (bio, avatarColor) => API.put('/chat/users/profile', { bio, avatarColor });
export const searchMessages = (roomId, query) => API.get(`/chat/rooms/${roomId}/messages/search?query=${query}`);
export const deleteMessage = (messageId) => API.delete(`/chat/messages/${messageId}`);
