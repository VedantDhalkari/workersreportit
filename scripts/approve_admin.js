require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('../models/models');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const admin = await User.findOne({ email: 'admin@example.com' });
    if (!admin) {
      console.log('Admin user not found');
      process.exit(1);
    }
    // Set approved flag
    admin.isApproved = true;
    // Set password hash (generated earlier)
    admin.password = '$2b$12$FAXz9IpnkxFzU/LItn8Fbu0gGoeJyXcJKJM8n/dx8E87PvEFz2WSK';
    await admin.save();
    console.log('Admin user approved and password set');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
