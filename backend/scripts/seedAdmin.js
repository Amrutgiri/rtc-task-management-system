/**
 * Database Seeder - Create Admin User
 * 
 * Usage:
 *   npm run seed:admin              (uses defaults)
 *   npm run seed:admin -- --email admin@example.com --password myPassword123
 * 
 * Run this after setting up a new project to create the initial admin user.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    email: 'apgoswami.eww@gmail.com',
    password: 'Password@123',
    name: 'Admin User',
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) {
      options.email = args[i + 1];
      i++;
    } else if (args[i] === '--password' && args[i + 1]) {
      options.password = args[i + 1];
      i++;
    } else if (args[i] === '--name' && args[i + 1]) {
      options.name = args[i + 1];
      i++;
    }
  }

  return options;
}

// Main seeder function
async function seedAdmin() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const options = parseArgs();

    // Check if admin already exists
    console.log(`\n🔍 Checking if admin user exists (${options.email})...`);
    const existingAdmin = await User.findOne({ email: options.email });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);

      const answer = await new Promise((resolve) => {
        process.stdout.write('\n🔄 Do you want to reset the password? (yes/no): ');
        process.stdin.once('data', (data) => {
          resolve(data.toString().trim().toLowerCase());
        });
      });

      if (answer !== 'yes' && answer !== 'y') {
        console.log('❌ Cancelled. Admin user not updated.');
        await mongoose.connection.close();
        process.exit(0);
      }

      // Update password
      const passwordHash = await bcrypt.hash(options.password, 10);
      await User.findByIdAndUpdate(existingAdmin._id, { passwordHash });

      console.log('✅ Password reset successfully');
      console.log(`\n📝 Login Credentials:`);
      console.log(`   Email: ${options.email}`);
      console.log(`   Password: ${options.password}`);
      
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create new admin user
    console.log('\n🆕 Creating new admin user...');
    const passwordHash = await bcrypt.hash(options.password, 10);

    const adminUser = await User.create({
      name: options.name,
      email: options.email,
      passwordHash,
      role: 'admin',
      active: true,
      avatar: '',
    });

    console.log('✅ Admin user created successfully!\n');
    console.log('📝 Login Credentials:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: ${options.password}`);
    console.log('\n🔐 Database Entry:');
    console.log(`   ID: ${adminUser._id}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Active: ${adminUser.active}`);

    console.log('\n✨ Setup complete! You can now login to the application.\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nMake sure:');
    console.error('  1. MongoDB is running');
    console.error('  2. MONGODB_URI is set in .env file');
    console.error('  3. You are in the backend directory');
    
    try {
      await mongoose.connection.close();
    } catch (e) {
      // Ignore
    }
    process.exit(1);
  }
}

// Run seeder
seedAdmin();
