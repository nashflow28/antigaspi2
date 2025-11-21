<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Tymon\JWTAuth\Facades\JWTAuth;

class ConsumerController extends Controller
{
    /**
     * Met à jour le profil du consommateur connecté.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = null;

        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (!$user || !$user->isConsumer()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé. Compte consommateur requis.'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'first_name' => ['required', 'string', 'min:2', 'max:255'],
                'last_name' => ['required', 'string', 'min:2', 'max:255'],
                'email' => [
                    'required',
                    'email',
                    'max:255',
                    Rule::unique('users', 'email')->ignore($user->id),
                ],
                'phone' => ['nullable', 'string', 'regex:/^\+228 \d{2} \d{2} \d{2} \d{2}$/'],
                'address' => ['nullable', 'string', 'max:255'],
                'city' => ['nullable', 'string', 'max:255'],
            ], [
                'first_name.required' => 'Le prénom est requis.',
                'first_name.min' => 'Le prénom doit contenir au moins 2 caractères.',
                'last_name.required' => 'Le nom est requis.',
                'last_name.min' => 'Le nom doit contenir au moins 2 caractères.',
                'email.required' => "L'adresse email est requise.",
                'email.email' => 'Adresse email invalide.',
                'email.unique' => 'Cette adresse email est déjà utilisée.',
                'phone.regex' => 'Le numéro de téléphone doit respecter le format +228 12 34 56 78.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $payload = [
                'first_name' => trim($request->input('first_name')),
                'last_name' => trim($request->input('last_name')),
                'email' => trim($request->input('email')),
                'phone' => $request->filled('phone') ? trim($request->input('phone')) : null,
                'address' => $request->filled('address') ? trim($request->input('address')) : null,
                'city' => $request->filled('city') ? trim($request->input('city')) : null,
                'name' => trim($request->input('first_name')) . ' ' . trim($request->input('last_name')),
            ];

            $user->update($payload);

            $user->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Profil mis à jour avec succès',
                'data' => [
                    'id' => $user->id,
                    'role' => $user->role,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'address' => $user->address,
                    'city' => $user->city,
                    'photo_url' => $user->photo_url,
                    'prefers_email_notifications' => $user->prefers_email_notifications,
                    'prefers_sms_notifications' => $user->prefers_sms_notifications,
                    'prefers_push_notifications' => $user->prefers_push_notifications,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('CONSUMER PROFILE UPDATE ERROR', [
                'user_id' => $user->id ?? null,
                'error' => $e->getMessage(),
                'trace' => app()->isLocal() ? $e->getTraceAsString() : null,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du profil',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Upload la photo de profil du consommateur.
     */
    public function uploadPhoto(Request $request): JsonResponse
    {
        $uploadedPath = null;
        $user = null;

        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (!$user || !$user->isConsumer()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé. Compte consommateur requis.'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'photo' => 'required|image|mimes:jpeg,jpg,png|max:5120',
            ], [
                'photo.required' => 'Aucune photo fournie.',
                'photo.image' => 'Le fichier doit être une image.',
                'photo.mimes' => 'Formats acceptés : JPEG, PNG.',
                'photo.max' => 'La photo ne peut pas dépasser 5MB.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Fichier invalide',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $photo = $request->file('photo');

            $mimeType = $photo->getMimeType();

            if (empty($mimeType)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de déterminer le type du fichier. Fichier corrompu ?'
                ], 422);
            }

            $allowedMimeTypes = [
                'image/jpeg' => ['jpg', 'jpeg'],
                'image/png' => ['png'],
            ];

            if (!array_key_exists($mimeType, $allowedMimeTypes)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Type de fichier non autorisé. Formats acceptés : JPEG, PNG',
                    'error' => "MIME type '{$mimeType}' non supporté. Types valides : image/jpeg, image/png",
                ], 422);
            }

            $extension = $allowedMimeTypes[$mimeType][0];
            $filename = Str::random(40) . '.' . $extension;

            $oldPhotoPath = null;
            if ($user->photo_url) {
                $oldPhotoPath = str_replace('/storage/', '', $user->photo_url);

                if (str_contains($oldPhotoPath, '..') || str_contains($oldPhotoPath, '//')) {
                    Log::warning('Invalid path detected during consumer photo cleanup', [
                        'user_id' => $user->id,
                        'path' => $oldPhotoPath,
                    ]);

                    return response()->json([
                        'success' => false,
                        'message' => 'Chemin de fichier invalide détecté',
                    ], 400);
                }
            }

            DB::beginTransaction();

            try {
                $path = $photo->storeAs('consumers', $filename, 'public');
                $uploadedPath = $path;
                $photoUrl = '/storage/' . $path;

                $user->update(['photo_url' => $photoUrl]);

                if ($oldPhotoPath) {
                    Storage::disk('public')->delete($oldPhotoPath);
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Photo uploadée avec succès',
                    'data' => [
                        'photo_url' => $photoUrl,
                        'full_url' => url($photoUrl),
                    ],
                ]);
            } catch (\Exception $innerException) {
                DB::rollBack();

                if ($uploadedPath && Storage::disk('public')->exists($uploadedPath)) {
                    Storage::disk('public')->delete($uploadedPath);
                }

                throw $innerException;
            }
        } catch (\Exception $e) {
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }

            if ($uploadedPath && Storage::disk('public')->exists($uploadedPath)) {
                Storage::disk('public')->delete($uploadedPath);
            }

            Log::error('CONSUMER PHOTO UPLOAD ERROR', [
                'user_id' => $user->id ?? null,
                'error' => $e->getMessage(),
                'trace' => app()->isLocal() ? $e->getTraceAsString() : null,
            ]);

            return response()->json([
                'success' => false,
                'message' => "Erreur lors de l'upload de la photo",
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
