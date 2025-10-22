<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Merchant;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class SearchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'q' => ['nullable', 'string', 'max:255'],
            'filters' => ['nullable', 'array'],
            'filters.city' => ['nullable', 'string', 'max:120'],
            'filters.category' => ['nullable', 'string', 'max:120'],
            'filters.business_type' => ['nullable', 'string', 'max:120'],
            'filters.type' => ['nullable', Rule::in(['products', 'merchants'])],
            'filters.is_surprise_basket' => ['nullable', 'boolean'],
            'filters.is_verified' => ['nullable', 'boolean'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
            'sort' => ['nullable', Rule::in([
                'relevance',
                'price_asc',
                'price_desc',
                'rating_desc',
                'popularity_desc',
            ])],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Paramètres de recherche invalides.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();
        $query = $validated['q'] ?? '';
        $filters = $validated['filters'] ?? [];
        $perPage = (int) ($validated['per_page'] ?? 15);
        $perPage = min($perPage, 50);
        $page = (int) ($validated['page'] ?? 1);
        $sort = $validated['sort'] ?? 'relevance';
        $type = Arr::get($filters, 'type', 'products');

        if ($type === 'merchants') {
            return $this->searchMerchants($query, $filters, $page, $perPage);
        }

        return $this->searchProducts($query, $filters, $page, $perPage, $sort);
    }

    private function searchProducts(string $query, array $filters, int $page, int $perPage, ?string $sort): JsonResponse
    {
        $builder = Product::search($query);

        if ($city = Arr::get($filters, 'city')) {
            $builder->where('merchant_city', $city);
        }

        if ($category = Arr::get($filters, 'category')) {
            $builder->where('category', $category);
        }

        if (Arr::has($filters, 'is_surprise_basket')) {
            $builder->where('is_surprise_basket', $this->toBoolean(Arr::get($filters, 'is_surprise_basket')));
        }

        $options = [
            'page' => $page,
            'hitsPerPage' => $perPage,
            'facets' => ['merchant_city', 'category', 'is_surprise_basket'],
        ];

        $sortOption = $this->mapSortForProducts($sort);
        if (!empty($sortOption)) {
            $options['sort'] = $sortOption;
        }

        $raw = (clone $builder)->options($options)->raw();
        $paginator = $builder->options($options)->paginate($perPage, 'page', $page);

        $hits = collect($raw['hits'] ?? [])->mapWithKeys(function (array $hit) {
            return [(string) ($hit['id'] ?? $hit['document_id'] ?? '' ) => $hit];
        });

        $collection = $paginator->getCollection();
        $collection->loadMissing('merchant.user');

        $items = $collection->map(function (Product $product) use ($hits) {
            $hit = $hits->get((string) $product->getKey(), []);

            return [
                'type' => 'product',
                'id' => $product->getKey(),
                'score' => $this->extractScore($hit),
                'highlights' => $hit['_formatted'] ?? null,
                'attributes' => [
                    'name' => $product->name,
                    'description' => $product->description,
                    'discounted_price' => $product->discounted_price,
                    'original_price' => $product->original_price,
                    'is_surprise_basket' => (bool) $product->is_surprise_basket,
                    'rating' => $hit['rating'] ?? null,
                    'popularity' => $hit['popularity'] ?? null,
                    'merchant' => $product->merchant ? [
                        'id' => $product->merchant->getKey(),
                        'business_name' => $product->merchant->business_name,
                        'business_type' => $product->merchant->business_type,
                        'city' => optional($product->merchant->user)->city,
                    ] : null,
                ],
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => $items,
            'meta' => [
                'type' => 'products',
                'query' => $query,
                'pagination' => [
                    'current_page' => $paginator->currentPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'last_page' => $paginator->lastPage(),
                ],
                'applied_filters' => $this->formatAppliedFilters($filters, ['city', 'category', 'is_surprise_basket']),
                'facets' => $this->formatFacets($raw['facetDistribution'] ?? [], [
                    'merchant_city',
                    'category',
                    'is_surprise_basket',
                ]),
            ],
        ]);
    }

    private function searchMerchants(string $query, array $filters, int $page, int $perPage): JsonResponse
    {
        $builder = Merchant::search($query);

        if ($city = Arr::get($filters, 'city')) {
            $builder->where('city', $city);
        }

        if ($businessType = Arr::get($filters, 'business_type')) {
            $builder->where('business_type', $businessType);
        }

        if (Arr::has($filters, 'is_verified')) {
            $builder->where('is_verified', $this->toBoolean(Arr::get($filters, 'is_verified')));
        }

        $options = [
            'page' => $page,
            'hitsPerPage' => $perPage,
            'facets' => ['city', 'business_type', 'is_verified'],
        ];

        $raw = (clone $builder)->options($options)->raw();
        $paginator = $builder->options($options)->paginate($perPage, 'page', $page);

        $hits = collect($raw['hits'] ?? [])->mapWithKeys(function (array $hit) {
            return [(string) ($hit['id'] ?? $hit['document_id'] ?? '' ) => $hit];
        });

        $collection = $paginator->getCollection();
        $collection->loadMissing('user');

        $items = $collection->map(function (Merchant $merchant) use ($hits) {
            $hit = $hits->get((string) $merchant->getKey(), []);

            return [
                'type' => 'merchant',
                'id' => $merchant->getKey(),
                'score' => $this->extractScore($hit),
                'highlights' => $hit['_formatted'] ?? null,
                'attributes' => [
                    'business_name' => $merchant->business_name,
                    'business_type' => $merchant->business_type,
                    'city' => optional($merchant->user)->city,
                    'address' => optional($merchant->user)->address,
                    'is_verified' => (bool) $merchant->is_verified,
                    'avg_rating' => $hit['avg_rating'] ?? null,
                    'total_products' => $hit['total_products'] ?? null,
                ],
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => $items,
            'meta' => [
                'type' => 'merchants',
                'query' => $query,
                'pagination' => [
                    'current_page' => $paginator->currentPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'last_page' => $paginator->lastPage(),
                ],
                'applied_filters' => $this->formatAppliedFilters($filters, ['city', 'business_type', 'is_verified']),
                'facets' => $this->formatFacets($raw['facetDistribution'] ?? [], [
                    'city',
                    'business_type',
                    'is_verified',
                ]),
            ],
        ]);
    }

    private function toBoolean(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        if (is_numeric($value)) {
            return (bool) ((int) $value);
        }

        return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false;
    }

    private function mapSortForProducts(?string $sort): array
    {
        return match ($sort) {
            'price_asc' => ['price:asc'],
            'price_desc' => ['price:desc'],
            'rating_desc' => ['rating:desc'],
            'popularity_desc' => ['popularity:desc'],
            default => [],
        };
    }

    private function extractScore(array $hit): ?float
    {
        if (array_key_exists('_rankingScore', $hit)) {
            return (float) $hit['_rankingScore'];
        }

        if (array_key_exists('rankingScore', $hit)) {
            return (float) $hit['rankingScore'];
        }

        if (array_key_exists('_score', $hit)) {
            return (float) $hit['_score'];
        }

        return null;
    }

    private function formatAppliedFilters(array $filters, array $keys): array
    {
        $result = [];

        foreach ($keys as $key) {
            if (!array_key_exists($key, $filters)) {
                continue;
            }

            $value = $filters[$key];

            if ($value === null || $value === '') {
                continue;
            }

            if (in_array($key, ['is_surprise_basket', 'is_verified'], true)) {
                $result[$key] = $this->toBoolean($value);
            } else {
                $result[$key] = $value;
            }
        }

        if (array_key_exists('type', $filters)) {
            $result['type'] = $filters['type'];
        }

        return $result;
    }

    private function formatFacets(array $facetDistribution, array $allowedKeys): array
    {
        $facets = [];

        foreach ($allowedKeys as $facetKey) {
            if (array_key_exists($facetKey, $facetDistribution)) {
                $facets[$facetKey] = $facetDistribution[$facetKey];
            }
        }

        return $facets;
    }
}
