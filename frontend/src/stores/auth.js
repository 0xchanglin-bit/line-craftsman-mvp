import { reactive, readonly } from 'vue';
import api from '@/utils/api';

const state = reactive({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  jwt: localStorage.getItem('jwt') || null,
});

function persist() {
  if (state.jwt) {
    localStorage.setItem('jwt', state.jwt);
    localStorage.setItem('user', JSON.stringify(state.user));
  } else {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
  }
}

const auth = {
  state: readonly(state),

  get isAuthenticated() {
    return !!state.jwt && !!state.user;
  },

  async login(lineUserId, displayName) {
    const data = await api.post('/auth/login', { lineUserId, displayName });
    state.jwt = data.token;
    state.user = data.user;
    persist();
    return data.user;
  },

  async getUser() {
    const data = await api.get('/auth/me');
    state.user = data.user;
    localStorage.setItem('user', JSON.stringify(state.user));
    return data.user;
  },

  async updateProfile(payload) {
    const data = await api.put('/auth/profile', payload);
    state.user = data.user;
    localStorage.setItem('user', JSON.stringify(state.user));
    return data.user;
  },

  setToken(token) {
    state.jwt = token;
    localStorage.setItem('jwt', token);
  },

  setUser(user) {
    state.user = user;
    localStorage.setItem('user', JSON.stringify(user));
  },

  logout() {
    state.jwt = null;
    state.user = null;
    persist();
  },
};

export function useAuth() {
  return auth;
}

export default auth;
