<template>
  <q-page class="flex flex-center">
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h5 text-center">Proctor Login</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="login">
          <q-input
            v-model="email"
            label="Email"
            type="email"
            outlined
            class="q-mb-md"
            :rules="[val => !!val || 'Email is required']"
          />
          <q-input
            v-model="password"
            label="Password"
            :type="showPassword ? 'text' : 'password'"
            outlined
            class="q-mb-md"
            :rules="[val => !!val || 'Password is required']"
          >
            <template v-slot:append>
              <q-icon
                :name="showPassword ? 'visibility' : 'visibility_off'"
                class="cursor-pointer"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>
          <q-btn
            type="submit"
            color="primary"
            label="Login"
            :loading="loading"
            class="full-width"
          />
        </q-form>
      </q-card-section>

      <q-card-section v-if="error" class="text-negative text-center">
        {{ error }}
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from 'src/util/api';

const router = useRouter();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const error = ref('');

async function login(): Promise<void> {
  loading.value = true;
  error.value = '';

  const formData = new FormData();
  formData.append('username', email.value);
  formData.append('password', password.value);

  try {
    const response = await api.post('/proctor/proctor/login', formData);
    const token = response.data.access_token as string;
    localStorage.setItem('proctor_token', token);

    // Set token for future API calls
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    void router.push('/proctor/papers');
  } catch {
    error.value = 'Invalid email or password';
  } finally {
    loading.value = false;
  }
}
</script>
