<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CleanExpiredTokens extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tokens:clean-expired {--dry-run : Preview without deleting}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean expired JWT refresh tokens from database';

    /**
     * Execute the console command.
     * 
     * BUG FIX #21: Implement handle() method to delete expired refresh_tokens
     * This command should be scheduled to run daily to prevent token table bloat
     */
    public function handle(): int
    {
        $dryRun = $this->option('dry-run');

        try {
            $query = DB::table('refresh_tokens')
                ->where('expires_at', '<', now());

            $expiredCount = $query->count();

            if ($expiredCount === 0) {
                $this->info('No expired tokens found.');
                return self::SUCCESS;
            }

            if ($dryRun) {
                $this->info("Would delete {$expiredCount} expired token(s) (dry-run mode)");
                return self::SUCCESS;
            }

            $deleted = $query->delete();

            $this->info("Successfully deleted {$deleted} expired token(s)");
            Log::info("CleanExpiredTokens: Deleted {$deleted} expired tokens");

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error("Error cleaning expired tokens: {$e->getMessage()}");
            Log::error('CleanExpiredTokens failed', ['error' => $e->getMessage()]);
            return self::FAILURE;
        }
    }
}
