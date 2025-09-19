<?php

namespace Database\Seeders;

use App\Models\AnalyticsDaily;
use App\Models\Category;
use App\Models\LoyaltyPoint;
use App\Models\Merchant;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Reservation;
use App\Models\Review;
use App\Models\ReviewReport;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed admin and test users with base merchant profile
        $this->call([
            AdminUserSeeder::class,
        ]);

        $admin = User::where('email', 'admin@antigaspi.com')->first();
        $merchantUser = User::where('email', 'merchant@antigaspi.com')->first();
        $consumer = User::where('email', 'consumer@antigaspi.com')->first();
        $merchant = $merchantUser?->merchant ?? Merchant::factory()->for($merchantUser)->create();

        // Categories & products
        $categories = Category::factory()->count(5)->create();

        $products = Product::factory()
            ->count(6)
            ->for($merchant)
            ->state(fn () => ['category_id' => $categories->random()->id])
            ->create();

        // Reservations & payments for consumer
        $reservations = new Collection();
        foreach ($products->take(3) as $product) {
            $quantity = rand(1, 3);
            $reservations->push(
                Reservation::factory()
                    ->for($consumer)
                    ->for($product)
                    ->state([
                        'quantity_reserved' => $quantity,
                        'total_amount' => round($product->discounted_price * $quantity, 2),
                        'status' => 'confirmed',
                        'reserved_at' => now()->subDays(rand(3, 7)),
                        'confirmed_at' => now()->subDays(rand(1, 5)),
                        'expires_at' => now()->addDays(rand(1, 3)),
                    ])
                    ->create()
            );
        }

        $reservations->each(function (Reservation $reservation) {
            Payment::factory()
                ->for($reservation)
                ->completed()
                ->state([
                    'amount' => $reservation->total_amount,
                    'paid_at' => $reservation->confirmed_at ?? now(),
                ])
                ->create();
        });

        // Loyalty program data
        $reservations->each(function (Reservation $reservation) use ($consumer) {
            LoyaltyPoint::factory()->for($consumer)->state([
                'points' => $reservation->quantity_reserved * 10,
                'earned_from' => 'reservation',
                'reference_id' => $reservation->id,
                'description' => 'Points pour la réservation ' . $reservation->reservation_code,
                'created_at' => $reservation->confirmed_at ?? now(),
                'expires_at' => now()->addMonths(6),
            ])->create();
        });

        LoyaltyPoint::factory()->for($consumer)->state([
            'points' => 50,
            'earned_from' => 'bonus',
            'reference_id' => null,
            'description' => 'Bonus de bienvenue',
            'created_at' => now()->subDays(2),
            'expires_at' => now()->addMonths(3),
        ])->create();

        // Notifications for users
        Notification::factory()->count(2)->for($consumer)->state([
            'type' => 'reservation',
            'title' => 'Votre réservation est confirmée',
            'is_read' => true,
        ])->create();

        Notification::factory()->count(2)->for($merchantUser)->state([
            'type' => 'system',
            'title' => 'Nouvelle réservation reçue',
            'is_read' => false,
        ])->create();

        // Reviews & moderation
        $review = Review::factory()
            ->for($consumer)
            ->for($merchant, 'merchant')
            ->for($products->first())
            ->state([
                'rating' => 5,
                'is_verified_purchase' => true,
                'is_approved' => true,
                'approved_at' => now()->subDays(1),
            ])
            ->create();

        ReviewReport::factory()->for($review)
            ->state([
                'reported_by' => $consumer->id,
                'status' => 'reviewed',
                'reviewed_by' => $admin?->id,
                'admin_notes' => 'Avis vérifié et conforme.',
                'reviewed_at' => now()->subHours(6),
            ])->create();

        // Analytics snapshots
        AnalyticsDaily::factory()->for($merchant)->state([
            'date' => now()->toDateString(),
            'total_reservations' => $reservations->count(),
            'total_revenue' => $reservations->sum('total_amount'),
            'products_saved_from_waste' => $reservations->sum('quantity_reserved'),
            'new_users' => 3,
        ])->create();

        AnalyticsDaily::factory()->state([
            'merchant_id' => null,
            'date' => now()->toDateString(),
            'total_reservations' => $reservations->count(),
            'total_revenue' => $reservations->sum('total_amount'),
            'products_saved_from_waste' => $reservations->sum('quantity_reserved'),
            'new_users' => 5,
        ])->create();
    }
}
