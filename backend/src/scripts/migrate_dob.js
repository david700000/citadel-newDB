const mongoose = require('mongoose');
const User = require('../models/User');
const FormField = require('../models/FormField');
require('dotenv').config();

const connectDB = require('../db/mongo');

async function migrateDOB() {
    await connectDB();
    console.log("🚀 Starting DOB migration...");

    try {
        // 1. Delete the old date_of_birth form field if it exists
        await FormField.deleteOne({ field_key: 'date_of_birth' });
        console.log("✅ Removed old date_of_birth form field definition");

        // 2. Migrate existing users
        const users = await User.find({ date_of_birth: { $exists: true, $ne: null } });
        console.log(`Found ${users.length} users with a date_of_birth to migrate.`);

        let count = 0;
        for (const user of users) {
            const dob = new Date(user.get('date_of_birth')); // using get() to access field not in schema anymore
            if (!isNaN(dob.getTime())) {
                const month = dob.getMonth() + 1; // 1-12
                const day = dob.getDate(); // 1-31

                user.birth_month = month;
                user.birth_day = day;
                user.age_range = "Unknown (Migrated)"; // We don't calculate age range automatically because we shouldn't guess, or we could. Let's guess if we have full year.
                
                // Let's actually calculate age_range if we have a valid year
                const year = dob.getFullYear();
                if (year > 1900 && year <= new Date().getFullYear()) {
                    const age = new Date().getFullYear() - year;
                    if (age < 18) user.age_range = "Under 18";
                    else if (age <= 24) user.age_range = "18-24";
                    else if (age <= 34) user.age_range = "25-34";
                    else if (age <= 44) user.age_range = "35-44";
                    else if (age <= 54) user.age_range = "45-54";
                    else if (age <= 64) user.age_range = "55-64";
                    else user.age_range = "65+";
                }

                // Unset old field
                user.set('date_of_birth', undefined);
                
                await user.save();
                count++;
            }
        }
        
        console.log(`✅ Successfully migrated ${count} users.`);
    } catch (err) {
        console.error("❌ Migration failed:", err);
    } finally {
        process.exit(0);
    }
}

migrateDOB();
