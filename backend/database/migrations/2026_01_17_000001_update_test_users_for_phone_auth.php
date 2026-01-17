<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

return new class extends Migration
{
    /**
     * Update ALL users to conform to new phone-based authentication standard.
     *
     * This migration:
     * - Normalizes all phone numbers to Togo format (228XXXXXXXX without +)
     * - Sets phone_verified_at for all users
     * - Sets a default PIN (1234) for all users
     * - Generates phone numbers for users without one
     */
    public function up(): void
    {
        $defaultPin = Hash::make('1234');
        $now = now();

        // Get all users
        $users = DB::table('users')->get();

        foreach ($users as $user) {
            $phone = $this->normalizePhone($user->phone, $user->id);

            DB::table('users')
                ->where('id', $user->id)
                ->update([
                    'phone' => $phone,
                    'phone_verified_at' => $user->phone_verified_at ?? $now,
                    'pin' => $defaultPin,
                    'updated_at' => $now,
                ]);

            Log::info("User {$user->id} ({$user->email}) updated: phone={$phone}");
        }
    }

    /**
     * Normalize phone number to Togo format (228XXXXXXXX)
     */
    private function normalizePhone(?string $phone, int $userId): string
    {
        // If no phone, generate one based on user ID
        if (empty($phone)) {
            return '22899'.str_pad($userId, 6, '0', STR_PAD_LEFT);
        }

        // Remove all non-digit characters
        $cleaned = preg_replace('/[^0-9]/', '', $phone);

        // Remove leading 00 if present
        if (str_starts_with($cleaned, '00')) {
            $cleaned = substr($cleaned, 2);
        }

        // If 8 digits, add Togo country code
        if (strlen($cleaned) === 8) {
            $cleaned = '228'.$cleaned;
        }

        // If 9 digits starting with 0, remove 0 and add 228
        if (strlen($cleaned) === 9 && str_starts_with($cleaned, '0')) {
            $cleaned = '228'.substr($cleaned, 1);
        }

        // If 10 digits starting with 0, assume it's a local number with area code
        if (strlen($cleaned) === 10 && str_starts_with($cleaned, '0')) {
            $cleaned = '228'.substr($cleaned, 1);
        }

        return $cleaned;
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reset pin for all users (keep phone and phone_verified_at)
        DB::table('users')->update([
            'pin' => null,
            'updated_at' => now(),
        ]);
    }
};
