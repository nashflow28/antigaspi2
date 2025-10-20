<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed core data only (users, categories, products)
        $this->call([
            AdminUserSeeder::class,
            CategorySeeder::class,
            ProductSeeder::class,
            ReservationSeeder::class,
            ReviewSeeder::class,
        ]);

        echo "\n✅ Database seeded successfully!\n";
        echo "   - Users: admin, merchant, consumer\n";
        echo "   - Categories: 9 categories created\n";
        echo "   - Products: Test products for Boulangerie du Centre\n";
        echo "   - Reservations: 8 test reservations created\n";
        echo "   - Reviews: 10 test reviews created\n\n";
        echo "📝 Test credentials:\n";
        echo "   Admin: admin@antigaspi.com / admin123\n";
        echo "   Merchant: merchant@antigaspi.com / merchant123\n";
        echo "   Consumer: consumer@antigaspi.com / consumer123\n\n";
    }
}
