<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    /**
     * Liste toutes les catégories
     */
    public function index(): JsonResponse
    {
        try {
            $categories = Category::withCount('products')->orderBy('name')->get();

            return response()->json([
                'success' => true,
                'data' => $categories,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des catégories',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Affiche une catégorie spécifique
     */
    public function show(Category $category): JsonResponse
    {
        try {
            // Inclure le nombre de produits de cette catégorie
            $category->load('products');
            $category->products_count = $category->products()->count();

            return response()->json([
                'success' => true,
                'data' => $category,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Catégorie non trouvée',
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Crée une nouvelle catégorie
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validatedData = $request->validate([
                'name' => 'required|string|max:100|unique:categories,name',
                'description' => 'required|string|max:500',
                'icon' => 'nullable|string|max:50',
            ], [
                'name.required' => 'Le nom de la catégorie est requis',
                'name.unique' => 'Une catégorie avec ce nom existe déjà',
                'name.max' => 'Le nom ne peut pas dépasser 100 caractères',
                'description.required' => 'La description est requise',
                'description.max' => 'La description ne peut pas dépasser 500 caractères',
                'icon.max' => 'L\'icône ne peut pas dépasser 50 caractères',
            ]);

            $category = Category::create([
                'name' => $validatedData['name'],
                'description' => $validatedData['description'],
                'icon' => $validatedData['icon'] ?? '📦',
                'is_active' => true,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Catégorie créée avec succès',
                'data' => $category,
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la catégorie',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Met à jour une catégorie
     */
    public function update(Request $request, Category $category): JsonResponse
    {
        try {
            $validatedData = $request->validate([
                'name' => [
                    'required',
                    'string',
                    'max:100',
                    Rule::unique('categories', 'name')->ignore($category->id),
                ],
                'description' => 'required|string|max:500',
                'icon' => 'nullable|string|max:50',
                'is_active' => 'boolean',
            ], [
                'name.required' => 'Le nom de la catégorie est requis',
                'name.unique' => 'Une catégorie avec ce nom existe déjà',
                'name.max' => 'Le nom ne peut pas dépasser 100 caractères',
                'description.required' => 'La description est requise',
                'description.max' => 'La description ne peut pas dépasser 500 caractères',
                'icon.max' => 'L\'icône ne peut pas dépasser 50 caractères',
            ]);

            $category->update($validatedData);

            return response()->json([
                'success' => true,
                'message' => 'Catégorie mise à jour avec succès',
                'data' => $category->fresh(),
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de la catégorie',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Supprime une catégorie
     */
    public function destroy(Category $category): JsonResponse
    {
        try {
            // Vérifier si des produits utilisent cette catégorie
            $productsCount = $category->products()->count();

            if ($productsCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Impossible de supprimer cette catégorie car {$productsCount} produit(s) l'utilisent encore",
                ], 409);
            }

            $categoryName = $category->name;
            $category->delete();

            return response()->json([
                'success' => true,
                'message' => "La catégorie \"{$categoryName}\" a été supprimée avec succès",
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de la catégorie',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Active/désactive une catégorie
     */
    public function toggleStatus(Category $category): JsonResponse
    {
        try {
            $category->update([
                'is_active' => ! $category->is_active,
            ]);

            $status = $category->is_active ? 'activée' : 'désactivée';

            return response()->json([
                'success' => true,
                'message' => "La catégorie \"{$category->name}\" a été {$status}",
                'data' => $category->fresh(),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du changement de statut',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Statistiques des catégories pour l'admin
     */
    public function stats(): JsonResponse
    {
        try {
            $stats = [
                'total_categories' => Category::count(),
                'active_categories' => Category::where('is_active', true)->count(),
                'categories_with_products' => Category::has('products')->count(),
                'top_categories' => Category::withCount('products')
                    ->orderBy('products_count', 'desc')
                    ->limit(5)
                    ->get(['id', 'name', 'products_count']),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
