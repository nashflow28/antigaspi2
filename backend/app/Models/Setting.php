<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'type',
        'group',
        'description',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get a setting value by key with optional caching
     *
     * @param  mixed  $default
     * @return mixed
     */
    public static function get(string $key, $default = null)
    {
        return Cache::remember("setting.{$key}", 3600, function () use ($key, $default) {
            $setting = static::where('key', $key)->first();

            if (! $setting) {
                return $default;
            }

            return static::castValue($setting->value, $setting->type);
        });
    }

    /**
     * Set a setting value by key
     *
     * @param  mixed  $value
     */
    public static function set(string $key, $value): bool
    {
        $setting = static::where('key', $key)->first();

        if (! $setting) {
            return false;
        }

        $setting->value = static::prepareValue($value, $setting->type);
        $saved = $setting->save();

        if ($saved) {
            Cache::forget("setting.{$key}");
        }

        return $saved;
    }

    /**
     * Get all settings grouped by category
     */
    public static function getAllGrouped(): array
    {
        return static::all()->groupBy('group')->map(function ($settings) {
            return $settings->map(function ($setting) {
                return [
                    'key' => $setting->key,
                    'value' => static::castValue($setting->value, $setting->type),
                    'type' => $setting->type,
                    'description' => $setting->description,
                ];
            });
        })->toArray();
    }

    /**
     * Cast value to appropriate type
     *
     * @param  mixed  $value
     * @return mixed
     */
    protected static function castValue($value, string $type)
    {
        return match ($type) {
            'integer' => (int) $value,
            'boolean' => (bool) $value || $value === '1',
            'decimal' => (float) $value,
            'json' => json_decode($value, true),
            default => $value,
        };
    }

    /**
     * Prepare value for storage
     *
     * @param  mixed  $value
     */
    protected static function prepareValue($value, string $type): string
    {
        return match ($type) {
            'boolean' => $value ? '1' : '0',
            'json' => json_encode($value),
            default => (string) $value,
        };
    }

    /**
     * Clear all settings cache
     */
    public static function clearCache(): void
    {
        $settings = static::all();
        foreach ($settings as $setting) {
            Cache::forget("setting.{$setting->key}");
        }
    }
}
