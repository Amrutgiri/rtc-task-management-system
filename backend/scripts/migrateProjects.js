/**
 * Migration Script - Fix Projects Missing ownerId
 * 
 * This script updates all projects that don't have an ownerId
 * by assigning them to the first admin user in the database.
 * 
 * Usage:
 *   npm run migrate:projects
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Project = require('../models/Project');
const User = require('../models/User');

async function migrateProjects() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the first admin user
    console.log('🔍 Finding admin user...');
    const adminUser = await User.findOne({ role: 'admin' });

    if (!adminUser) {
      console.error('❌ No admin user found in database!');
      console.error('   Please run: npm run seed:admin');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`✅ Found admin user: ${adminUser.name} (${adminUser.email})\n`);

    // Find projects without ownerId
    console.log('🔍 Searching for projects without ownerId...');
    const projectsWithoutOwner = await Project.find({ ownerId: { $exists: false } });

    if (projectsWithoutOwner.length === 0) {
      console.log('✅ All projects have ownerId! No migration needed.\n');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`⚠️  Found ${projectsWithoutOwner.length} project(s) without ownerId\n`);

    // Show projects that will be updated
    console.log('📋 Projects to be updated:');
    projectsWithoutOwner.forEach((project, index) => {
      console.log(`   ${index + 1}. "${project.name}" (Created: ${new Date(project.createdAt).toLocaleDateString()})`);
    });

    // Confirm migration
    const answer = await new Promise((resolve) => {
      console.log();
      process.stdout.write(`✏️  Assign these projects to "${adminUser.name}"? (yes/no): `);
      process.stdin.once('data', (data) => {
        resolve(data.toString().trim().toLowerCase());
      });
    });

    if (answer !== 'yes' && answer !== 'y') {
      console.log('\n❌ Cancelled. Projects were not updated.');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Update all projects
    console.log(`\n📝 Updating ${projectsWithoutOwner.length} project(s)...`);
    
    const result = await Project.updateMany(
      { ownerId: { $exists: false } },
      { ownerId: adminUser._id }
    );

    console.log(`\n✅ Migration completed!`);
    console.log(`   Modified: ${result.modifiedCount} project(s)`);
    console.log(`   Matched: ${result.matchedCount} project(s)\n`);

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed!');
    console.error('Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

migrateProjects();
