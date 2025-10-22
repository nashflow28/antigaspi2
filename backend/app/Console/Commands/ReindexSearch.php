<?php

namespace App\Console\Commands;

use App\Models\Merchant;
use App\Models\Product;
use Illuminate\Console\Command;

class ReindexSearch extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'scout:reindex
                            {model? : Optionally limit reindexing to a specific model (product, merchant)}
                            {--fresh : Flush the index before importing data}';

    /**
     * The console command description.
     */
    protected $description = 'Flush and re-import search indexes for products and merchants.';

    /**
     * A lookup table to resolve the model argument.
     */
    protected array $modelMap = [
        'product' => Product::class,
        'products' => Product::class,
        'merchant' => Merchant::class,
        'merchants' => Merchant::class,
    ];

    public function handle(): int
    {
        $models = $this->resolveModels();

        if (empty($models)) {
            return self::FAILURE;
        }

        foreach ($models as $modelClass) {
            $name = class_basename($modelClass);

            if ($this->option('fresh')) {
                $this->components->task("Flushing {$name} index", function () use ($modelClass) {
                    $this->callSilent('scout:flush', ['model' => $modelClass]);
                });
            }

            $this->components->task("Importing {$name} records", function () use ($modelClass) {
                $this->call('scout:import', ['model' => $modelClass]);
            });
        }

        $this->components->info('Search indexes are now up to date.');

        return self::SUCCESS;
    }

    /**
     * Resolve the targeted models from the command argument.
     *
     * @return array<class-string<\Laravel\Scout\Searchable>>
     */
    protected function resolveModels(): array
    {
        $argument = $this->argument('model');

        if ($argument === null) {
            return array_values(array_unique($this->modelMap));
        }

        $key = strtolower((string) $argument);
        $model = $this->modelMap[$key] ?? $argument;

        if (! class_exists($model)) {
            $this->components->error("The model [{$argument}] is not supported.");

            return [];
        }

        return [$model];
    }
}
