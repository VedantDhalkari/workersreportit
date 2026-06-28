const axios = require('axios');
(async () => {
  try {
    const res = await axios.post(process.env.VITE_BACKEND_URL + '/api/auth/login', {
      email: 'admin@example.com',
      password: 'Password123'
    });
    console.log('Login success:', res.data);
  } catch (err) {
    if (err.response) {
      console.error('Login failed:', err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  }
})();
