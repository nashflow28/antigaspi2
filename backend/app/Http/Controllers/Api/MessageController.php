<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MessageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Conversation::query()
            ->forUser($user)
            ->with($this->conversationRelations())
            ->withCount('messages')
            ->orderByDesc('last_message_at')
            ->orderByDesc('updated_at');

        if (! $request->boolean('include_archived')) {
            $query->where(function (Builder $builder) use ($user) {
                if ($user->isConsumer()) {
                    $builder->where('archived_by_consumer', false);
                } elseif ($user->isMerchant()) {
                    $builder->where('archived_by_merchant', false);
                }
            });
        }

        $conversations = $query->get();

        return response()->json([
            'success' => true,
            'data' => [
                'conversations' => $conversations,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'merchant_id' => 'nullable|integer|exists:users,id',
            'consumer_id' => 'nullable|integer|exists:users,id',
        ]);

        if (! $user->isConsumer() && ! $user->isMerchant()) {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les consommateurs et commerçants peuvent démarrer une conversation.',
            ], 403);
        }

        if ($user->isConsumer()) {
            $merchantId = $data['merchant_id'] ?? null;
            if (! $merchantId) {
                throw ValidationException::withMessages([
                    'merchant_id' => 'Le marchand est requis pour démarrer une conversation.',
                ]);
            }

            $merchant = User::query()->whereKey($merchantId)->where('role', 'merchant')->first();
            if (! $merchant) {
                throw ValidationException::withMessages([
                    'merchant_id' => 'Le marchand sélectionné est invalide.',
                ]);
            }

            $conversation = $this->firstOrCreateConversation($user->id, $merchant->id);
        } else {
            $consumerId = $data['consumer_id'] ?? null;
            if (! $consumerId) {
                throw ValidationException::withMessages([
                    'consumer_id' => 'Le consommateur est requis pour démarrer une conversation.',
                ]);
            }

            $consumer = User::query()->whereKey($consumerId)->where('role', 'consumer')->first();
            if (! $consumer) {
                throw ValidationException::withMessages([
                    'consumer_id' => 'Le consommateur sélectionné est invalide.',
                ]);
            }

            $conversation = $this->firstOrCreateConversation($consumer->id, $user->id);
        }

        $conversation->load($this->conversationRelations());

        return response()->json([
            'success' => true,
            'data' => [
                'conversation' => $conversation,
            ],
        ], 201);
    }

    public function show(Request $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();

        if (! $this->isParticipant($conversation, $user)) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé à cette conversation.',
            ], 403);
        }

        $perPage = min((int) $request->input('per_page', 50), 100);

        $messages = $conversation->messages()
            ->with(['sender:id,first_name,last_name,photo_url,role'])
            ->orderBy('created_at')
            ->paginate($perPage);

        $conversation->load($this->conversationRelations());

        return response()->json([
            'success' => true,
            'data' => [
                'conversation' => $conversation,
                'messages' => $messages->items(),
            ],
            'pagination' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total(),
            ],
        ]);
    }

    public function update(Request $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();

        if (! $this->isParticipant($conversation, $user)) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé à cette conversation.',
            ], 403);
        }

        $data = $request->validate([
            'archived' => 'nullable|boolean',
        ]);

        if (array_key_exists('archived', $data)) {
            if ($conversation->consumer_id === $user->id) {
                $conversation->archived_by_consumer = (bool) $data['archived'];
            }

            if ($conversation->merchant_id === $user->id) {
                $conversation->archived_by_merchant = (bool) $data['archived'];
            }

            if (! $data['archived'] && $conversation->trashed()) {
                $conversation->restore();
            }

            $conversation->save();
        }

        $conversation->load($this->conversationRelations());

        return response()->json([
            'success' => true,
            'data' => [
                'conversation' => $conversation,
            ],
        ]);
    }

    public function destroy(Request $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();

        if (! $this->isParticipant($conversation, $user)) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé à cette conversation.',
            ], 403);
        }

        $conversation->delete();

        return response()->json([
            'success' => true,
            'message' => 'Conversation archivée avec succès.',
            'data' => [
                'conversation_id' => $conversation->id,
            ],
        ]);
    }

    public function storeMessage(Request $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();

        if (! $this->isParticipant($conversation, $user)) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé à cette conversation.',
            ], 403);
        }

        $data = $request->validate([
            'content' => 'required|string|max:2000',
        ]);

        $message = null;

        DB::transaction(function () use ($conversation, $user, $data, &$message) {
            $message = $conversation->messages()->create([
                'sender_id' => $user->id,
                'content' => $data['content'],
            ]);

            $conversation->forceFill([
                'last_message_at' => now(),
                'last_message_preview' => $this->makePreview($data['content']),
                'archived_by_consumer' => $conversation->consumer_id === $user->id ? false : $conversation->archived_by_consumer,
                'archived_by_merchant' => $conversation->merchant_id === $user->id ? false : $conversation->archived_by_merchant,
            ])->save();
        });

        $conversation->refresh()->load($this->conversationRelations());
        $message->load(['sender:id,first_name,last_name,photo_url,role']);

        return response()->json([
            'success' => true,
            'data' => [
                'conversation' => $conversation,
                'message' => $message,
            ],
        ], 201);
    }

    public function updateMessage(Request $request, Message $message): JsonResponse
    {
        $user = $request->user();

        if ((int) $message->sender_id !== (int) $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez modifier que vos propres messages.',
            ], 403);
        }

        $data = $request->validate([
            'content' => 'required|string|max:2000',
        ]);

        $message->content = $data['content'];
        $message->save();

        $conversation = $message->conversation()->first();

        if ($conversation && $conversation->last_message_at && $conversation->last_message_at->equalTo($message->created_at)) {
            $conversation->update([
                'last_message_preview' => $this->makePreview($message->content),
            ]);
        }

        $message->load(['sender:id,first_name,last_name,photo_url,role']);

        return response()->json([
            'success' => true,
            'data' => [
                'message' => $message,
            ],
        ]);
    }

    public function destroyMessage(Request $request, Message $message): JsonResponse
    {
        $user = $request->user();

        if ((int) $message->sender_id !== (int) $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez supprimer que vos propres messages.',
            ], 403);
        }

        $conversation = $message->conversation;
        $message->delete();

        if ($conversation) {
            $latestMessage = $conversation->messages()->latest('created_at')->first();
            $conversation->update([
                'last_message_at' => $latestMessage?->created_at,
                'last_message_preview' => $latestMessage ? $this->makePreview($latestMessage->content) : null,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Message supprimé avec succès.',
            'data' => [
                'message_id' => $message->id,
            ],
        ]);
    }

    private function isParticipant(Conversation $conversation, User $user): bool
    {
        return (int) $conversation->consumer_id === (int) $user->id
            || (int) $conversation->merchant_id === (int) $user->id;
    }

    private function firstOrCreateConversation(int $consumerId, int $merchantId): Conversation
    {
        $conversation = Conversation::withTrashed()
            ->where('consumer_id', $consumerId)
            ->where('merchant_id', $merchantId)
            ->first();

        if ($conversation) {
            if ($conversation->trashed()) {
                $conversation->restore();
            }

            $conversation->update([
                'archived_by_consumer' => false,
                'archived_by_merchant' => false,
            ]);

            return $conversation;
        }

        return Conversation::create([
            'consumer_id' => $consumerId,
            'merchant_id' => $merchantId,
            'archived_by_consumer' => false,
            'archived_by_merchant' => false,
        ]);
    }

    private function conversationRelations(): array
    {
        return [
            'consumer:id,first_name,last_name,photo_url,phone,role',
            'merchant:id,first_name,last_name,photo_url,phone,role',
            'merchant.merchant:id,user_id,business_name,business_type,photo_url',
            'latestMessage:id,conversation_id,sender_id,content,created_at',
            'latestMessage.sender:id,first_name,last_name,photo_url,role',
        ];
    }

    private function makePreview(string $content): string
    {
        $preview = trim(strip_tags($content));

        return mb_strimwidth($preview, 0, 120, '…', 'UTF-8');
    }
}
