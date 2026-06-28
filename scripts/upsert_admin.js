require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('../models/models');
const bcryptHash = '$2b$12$FAXz9IpnkxFzU/LItn8Fbu0gGoeJyXcJKJM8n/dx8E87PvEFz2WSK';
(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const email = 'admin@example.com';
    let admin = await User.findOne({ email });
    if (!admin) {
      admin = await User.create({
        name: 'Admin User',
        email,
        password: bcryptHash,
        contact: '0000000000',
        role: 'admin',
        isApproved: true,
      });
      console.log('Admin user created');
    } else {
      admin.password = bcryptHash;
      admin.role = 'admin';
      admin.isApproved = true;
      await admin.save();
      console.log('Admin user updated');
    }
    process.exit(0);
  } catch (err) {
    console.error('Error upserting admin:', err);
    process.exit(1);
  }
})();
