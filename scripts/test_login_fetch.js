require('dotenv').config();
(async () => {
  try {
    const response = await fetch(`${process.env.VITE_BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'Password123' })
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('Login failed:', data);
    } else {
      console.log('Login success:', data);
    }
  } catch (err) {
    console.error('Error:', err);
  }
})();
