<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class LoyaltyTierService
{
    /**
     * Tier thresholds based on lifetime points
     */
    const TIER_THRESHOLDS = [
        'bronze' => 0,
        'silver' => 500,
        'gold' => 2000,
        'platinum' => 5000,
    ];

    /**
     * Tier benefits descriptions
     */
    const TIER_BENEFITS = [
        'bronze' => [
            'points_multiplier' => 1.0,
            'exclusive_rewards' => false,
            'priority_support' => false,
            'early_access' => false,
        ],
        'silver' => [
            'points_multiplier' => 1.25,
            'exclusive_rewards' => false,
            'priority_support' => false,
            'early_access' => false,
        ],
        'gold' => [
            'points_multiplier' => 1.5,
            'exclusive_rewards' => true,
            'priority_support' => true,
            'early_access' => false,
        ],
        'platinum' => [
            'points_multiplier' => 2.0,
            'exclusive_rewards' => true,
            'priority_support' => true,
            'early_access' => true,
        ],
    ];

    /**
     * Calculate the appropriate tier based on lifetime points
     */
    public function calculateTier(int $lifetimePoints): string
    {
        $tier = 'bronze';

        foreach (self::TIER_THRESHOLDS as $tierName => $threshold) {
            if ($lifetimePoints >= $threshold) {
                $tier = $tierName;
            }
        }

        return $tier;
    }

    /**
     * Check and update user's tier based on their lifetime points
     */
    public function checkAndUpdateTier(User $user): array
    {
        $currentTier = $user->loyalty_tier ?? 'bronze';
        $lifetimePoints = $user->lifetime_points ?? 0;
        $newTier = $this->calculateTier($lifetimePoints);

        $result = [
            'previous_tier' => $currentTier,
            'new_tier' => $newTier,
            'upgraded' => false,
            'downgraded' => false,
        ];

        if ($newTier !== $currentTier) {
            $tierOrder = ['bronze' => 1, 'silver' => 2, 'gold' => 3, 'platinum' => 4];

            if ($tierOrder[$newTier] > $tierOrder[$currentTier]) {
                $result['upgraded'] = true;
                $this->handleTierUpgrade($user, $currentTier, $newTier);
            } else {
                $result['downgraded'] = true;
            }

            $user->update([
                'loyalty_tier' => $newTier,
                'tier_updated_at' => now(),
            ]);
        }

        return $result;
    }

    /**
     * Handle tier upgrade - send notification and award bonus
     */
    protected function handleTierUpgrade(User $user, string $oldTier, string $newTier): void
    {
        $tierNames = [
            'bronze' => 'Bronze',
            'silver' => 'Argent',
            'gold' => 'Or',
            'platinum' => 'Platine',
        ];

        try {
            Notification::create([
                'user_id' => $user->id,
                'type' => 'loyalty_tier_upgrade',
                'title' => 'Niveau de fidélité atteint !',
                'message' => "Félicitations ! Vous êtes maintenant au niveau {$tierNames[$newTier]}. Profitez de vos nouveaux avantages !",
                'data' => [
                    'old_tier' => $oldTier,
                    'new_tier' => $newTier,
                    'benefits' => self::TIER_BENEFITS[$newTier],
                ],
                'channels' => ['push', 'in_app'],
            ]);
        } catch (\Exception $e) {
            Log::warning('Failed to send tier upgrade notification', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Add points to user's lifetime total and check tier
     */
    public function addLifetimePoints(User $user, int $points): array
    {
        $user->increment('lifetime_points', $points);
        $user->refresh();

        return $this->checkAndUpdateTier($user);
    }

    /**
     * Get tier information for a user
     */
    public function getTierInfo(User $user): array
    {
        $currentTier = $user->loyalty_tier ?? 'bronze';
        $lifetimePoints = $user->lifetime_points ?? 0;
        $tierOrder = array_keys(self::TIER_THRESHOLDS);
        $currentTierIndex = array_search($currentTier, $tierOrder);

        $nextTier = null;
        $pointsToNextTier = null;

        if ($currentTierIndex < count($tierOrder) - 1) {
            $nextTier = $tierOrder[$currentTierIndex + 1];
            $pointsToNextTier = self::TIER_THRESHOLDS[$nextTier] - $lifetimePoints;
        }

        $tierNames = [
            'bronze' => 'Bronze',
            'silver' => 'Argent',
            'gold' => 'Or',
            'platinum' => 'Platine',
        ];

        return [
            'current_tier' => $currentTier,
            'current_tier_name' => $tierNames[$currentTier],
            'lifetime_points' => $lifetimePoints,
            'next_tier' => $nextTier,
            'next_tier_name' => $nextTier ? $tierNames[$nextTier] : null,
            'points_to_next_tier' => max(0, $pointsToNextTier ?? 0),
            'progress_percentage' => $this->calculateProgressPercentage($lifetimePoints, $currentTier, $nextTier),
            'benefits' => self::TIER_BENEFITS[$currentTier],
            'all_tiers' => array_map(function ($tier) use ($tierNames) {
                return [
                    'key' => $tier,
                    'name' => $tierNames[$tier],
                    'threshold' => self::TIER_THRESHOLDS[$tier],
                    'benefits' => self::TIER_BENEFITS[$tier],
                ];
            }, $tierOrder),
        ];
    }

    /**
     * Calculate progress percentage to next tier
     */
    protected function calculateProgressPercentage(int $points, string $currentTier, ?string $nextTier): int
    {
        if (! $nextTier) {
            return 100; // Already at max tier
        }

        $currentThreshold = self::TIER_THRESHOLDS[$currentTier];
        $nextThreshold = self::TIER_THRESHOLDS[$nextTier];
        $range = $nextThreshold - $currentThreshold;

        if ($range <= 0) {
            return 100;
        }

        $progress = (($points - $currentThreshold) / $range) * 100;

        return min(100, max(0, (int) $progress));
    }

    /**
     * Get points multiplier for user's current tier
     */
    public function getPointsMultiplier(User $user): float
    {
        $tier = $user->loyalty_tier ?? 'bronze';

        return self::TIER_BENEFITS[$tier]['points_multiplier'] ?? 1.0;
    }

    /**
     * Calculate points with tier bonus
     */
    public function calculatePointsWithBonus(User $user, int $basePoints): int
    {
        $multiplier = $this->getPointsMultiplier($user);

        return (int) round($basePoints * $multiplier);
    }
}
