import { acceptHMRUpdate, defineStore } from 'pinia';
import { ref } from 'vue'
import type { Ref } from 'vue';

export interface User {
  id: string;
  username: string;
  surname: string;
  name: string;
  email: string;
  enroll_number: string;
}

export const useUserStore = defineStore('user', () => {
  const full_name:Ref = ref(sessionStorage.getItem('full_name') || 'Guest');
  const status:Ref = ref(sessionStorage.getItem('status') || -1);
  const stored_token:Ref = ref(sessionStorage.getItem('token'));
  const stored_user:Ref = ref(JSON.parse(sessionStorage.getItem('user') || '{}'));

  function login(token_value:string, user:User) {
    stored_token.value = token_value;
    stored_user.value = user;
    full_name.value = user.surname + ', ' + user.name;
  }

  function logout() {
    stored_token.value = null;
    stored_user.value = {};
    full_name.value = 'Guest';
  }

  return { login, logout, full_name, status, token:stored_token, user:stored_user };
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot));
}
