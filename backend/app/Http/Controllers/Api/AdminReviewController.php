<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\ReviewReport;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AdminReviewController extends Controller
{
    /**
     * Get reviews pending moderation
     */
    public function pending(Request $request): JsonResponse
    {
        $user = Auth::user();

        // Verify user is admin
        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Accès réservé aux administrateurs'
            ], 403);
        }

        $request->validate([
            'per_page' => 'nullable|integer|max:50',
        ]);

        try {
            $query = Review::with(['user:id,first_name,last_name', 'product:id,name', 'merchant.user:id,first_name,last_name'])
                          ->where('is_approved', false)
                          ->recent();

            $reviews = $query->paginate($request->per_page ?? 15);

            // Transform the data
            $reviews->getCollection()->transform(function ($review) {
                return [
                    'id' => $review->id,
                    'rating' => $review->rating,
                    'title' => $review->title,
                    'comment' => $review->comment,
                    'time_ago' => $review->time_ago,
                    'is_verified_purchase' => $review->is_verified_purchase,
                    'user' => [
                        'id' => $review->user->id,
                        'name' => $review->user->first_name . ' ' . $review->user->last_name,
                        'email' => $review->user->email,
                    ],
                    'merchant' => [
                        'id' => $review->merchant->id,
                        'business_name' => $review->merchant->business_name,
                        'owner_name' => $review->merchant->user->first_name . ' ' . $review->merchant->user->last_name,
                    ],
                    'product' => $review->product ? [
                        'id' => $review->product->id,
                        'name' => $review->product->name,
                    ] : null,
                    'merchant_response' => $review->merchant_response,
                    'created_at' => $review->created_at->toISOString(),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $reviews->items(),
                'pagination' => [
                    'current_page' => $reviews->currentPage(),
                    'last_page' => $reviews->lastPage(),
                    'per_page' => $reviews->perPage(),
                    'total' => $reviews->total(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des avis en attente',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve a review
     */
    public function approve(Request $request, Review $review): JsonResponse
    {
        $user = Auth::user();

        // Verify user is admin
        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Accès réservé aux administrateurs'
            ], 403);
        }

        try {
            $review->update([
                'is_approved' => true,
                'approved_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Avis approuvé avec succès',
                'data' => [
                    'id' => $review->id,
                    'is_approved' => $review->is_approved,
                    'approved_at' => $review->approved_at->toISOString(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'approbation de l\'avis',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject a review
     */
    public function reject(Request $request, Review $review): JsonResponse
    {
        $user = Auth::user();

        // Verify user is admin
        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Accès réservé aux administrateurs'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'reason' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Delete the review (rejected reviews are not kept)
            $review->delete();

            return response()->json([
                'success' => true,
                'message' => 'Avis rejeté et supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du rejet de l\'avis',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get reported reviews
     */
    public function reported(Request $request): JsonResponse
    {
        $user = Auth::user();

        // Verify user is admin
        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Accès réservé aux administrateurs'
            ], 403);
        }

        $request->validate([
            'status' => 'nullable|in:pending,reviewed,resolved,dismissed',
            'reason' => 'nullable|in:inappropriate_content,spam,fake_review,offensive_language,harassment,copyright_violation,other',
            'per_page' => 'nullable|integer|max:50',
        ]);

        try {
            $query = ReviewReport::with([
                'review' => function ($query) {
                    $query->with(['user:id,first_name,last_name', 'product:id,name', 'merchant.user:id,first_name,last_name']);
                },
                'reporter:id,first_name,last_name,email',
                'reviewer:id,first_name,last_name'
            ])->recent();

            // Apply filters
            if ($request->status) {
                $query->where('status', $request->status);
            }

            if ($request->reason) {
                $query->byReason($request->reason);
            }

            $reports = $query->paginate($request->per_page ?? 15);

            // Transform the data
            $reports->getCollection()->transform(function ($report) {
                return [
                    'id' => $report->id,
                    'reason' => $report->reason,
                    'reason_label' => $report->reason_label,
                    'description' => $report->description,
                    'status' => $report->status,
                    'status_label' => $report->status_label,
                    'admin_notes' => $report->admin_notes,
                    'time_ago' => $report->time_ago,
                    'review' => [
                        'id' => $report->review->id,
                        'rating' => $report->review->rating,
                        'title' => $report->review->title,
                        'comment' => $report->review->comment,
                        'is_verified_purchase' => $report->review->is_verified_purchase,
                        'user' => [
                            'id' => $report->review->user->id,
                            'name' => $report->review->user->first_name . ' ' . $report->review->user->last_name,
                        ],
                        'merchant' => [
                            'id' => $report->review->merchant->id,
                            'business_name' => $report->review->merchant->business_name,
                        ],
                        'product' => $report->review->product ? [
                            'id' => $report->review->product->id,
                            'name' => $report->review->product->name,
                        ] : null,
                    ],
                    'reporter' => [
                        'id' => $report->reporter->id,
                        'name' => $report->reporter->first_name . ' ' . $report->reporter->last_name,
                        'email' => $report->reporter->email,
                    ],
                    'reviewer' => $report->reviewer ? [
                        'id' => $report->reviewer->id,
                        'name' => $report->reviewer->first_name . ' ' . $report->reviewer->last_name,
                    ] : null,
                    'created_at' => $report->created_at->toISOString(),
                    'reviewed_at' => $report->reviewed_at ? $report->reviewed_at->toISOString() : null,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $reports->items(),
                'pagination' => [
                    'current_page' => $reports->currentPage(),
                    'last_page' => $reports->lastPage(),
                    'per_page' => $reports->perPage(),
                    'total' => $reports->total(),
                ],
                'filters' => [
                    'status' => $request->status,
                    'reason' => $request->reason,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des signalements',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Report a review
     */
    public function report(Request $request, Review $review): JsonResponse
    {
        $user = Auth::user();

        $validator = Validator::make($request->all(), [
            'reason' => 'required|in:inappropriate_content,spam,fake_review,offensive_language,harassment,copyright_violation,other',
            'description' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if user already reported this review
            $existingReport = ReviewReport::where('review_id', $review->id)
                                         ->where('reported_by', $user->id)
                                         ->first();

            if ($existingReport) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous avez déjà signalé cet avis'
                ], 409);
            }

            $report = ReviewReport::create([
                'review_id' => $review->id,
                'reported_by' => $user->id,
                'reason' => $request->reason,
                'description' => $request->description,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Avis signalé avec succès',
                'data' => [
                    'id' => $report->id,
                    'reason' => $report->reason,
                    'reason_label' => $report->reason_label,
                    'status' => $report->status,
                    'created_at' => $report->created_at->toISOString(),
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du signalement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Resolve a reported review
     */
    public function resolveReport(Request $request, ReviewReport $report): JsonResponse
    {
        $user = Auth::user();

        // Verify user is admin
        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Accès réservé aux administrateurs'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'action' => 'required|in:dismiss,remove_review,warn_user',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            switch ($request->action) {
                case 'dismiss':
                    $report->markAsDismissed($user, $request->notes);
                    $message = 'Signalement rejeté';
                    break;

                case 'remove_review':
                    // Remove the review and mark report as resolved
                    $report->review->delete();
                    $report->markAsResolved($user, $request->notes);
                    $message = 'Avis supprimé et signalement résolu';
                    break;

                case 'warn_user':
                    // Mark report as resolved (warning action could be implemented later)
                    $report->markAsResolved($user, $request->notes);
                    $message = 'Utilisateur averti et signalement résolu';
                    break;

                default:
                    throw new \InvalidArgumentException('Action non reconnue');
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => [
                    'id' => $report->id,
                    'status' => $report->status,
                    'admin_notes' => $report->admin_notes,
                    'reviewed_at' => $report->reviewed_at->toISOString(),
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la résolution du signalement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get moderation statistics
     */
    public function stats(): JsonResponse
    {
        $user = Auth::user();

        // Verify user is admin
        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Accès réservé aux administrateurs'
            ], 403);
        }

        try {
            $stats = [
                'pending_reviews' => Review::where('is_approved', false)->count(),
                'pending_reports' => ReviewReport::pending()->count(),
                'total_reports' => ReviewReport::count(),
                'resolved_reports' => ReviewReport::reviewed()->count(),
                'reviews_today' => Review::whereDate('created_at', today())->count(),
                'reports_today' => ReviewReport::whereDate('created_at', today())->count(),
            ];

            // Report reasons distribution
            $reportReasons = ReviewReport::selectRaw('reason, COUNT(*) as count')
                                       ->groupBy('reason')
                                       ->get()
                                       ->mapWithKeys(function ($item) {
                                           $reasons = [
                                               'inappropriate_content' => 'Contenu inapproprié',
                                               'spam' => 'Spam',
                                               'fake_review' => 'Faux avis',
                                               'offensive_language' => 'Langage offensant',
                                               'harassment' => 'Harcèlement',
                                               'copyright_violation' => 'Violation de droits d\'auteur',
                                               'other' => 'Autre'
                                           ];
                                           return [$reasons[$item->reason] ?? $item->reason => $item->count];
                                       });

            return response()->json([
                'success' => true,
                'data' => [
                    'stats' => $stats,
                    'report_reasons' => $reportReasons,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des statistiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}