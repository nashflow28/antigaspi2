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
        echo "📝 Test credentials (matching CLAUDE.md):\n";
        echo "   Admin:    +228 91 00 00 01 | admin@antigaspi.com | PIN: 1234\n";
        echo "   Merchant: +228 90 12 34 56 | boulangerie.martin@email.com | PIN: 1234\n";
        echo "   Consumer: +228 90 65 43 21 | jean.dupont@email.com | PIN: 1234\n";
        echo "   Password (all): password\n\n";
    }
}
