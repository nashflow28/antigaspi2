<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class MessageControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['app.key' => 'base64:'.base64_encode(random_bytes(32))]);
        config(['jwt.secret' => Str::random(32)]);
    }

    protected function actingAsJwt(User $user): array
    {
        $token = JWTAuth::fromUser($user);

        return ['Authorization' => 'Bearer '.$token];
    }

    public function test_consumer_can_create_conversation_and_send_message(): void
    {
        $consumer = User::factory()->create(['role' => 'consumer']);
        $merchant = User::factory()->merchant()->create();

        $response = $this->postJson('/api/messaging/conversations', [
            'merchant_id' => $merchant->id,
        ], $this->actingAsJwt($consumer));

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.conversation.consumer_id', $consumer->id)
            ->assertJsonPath('data.conversation.merchant_id', $merchant->id);

        $conversationId = $response->json('data.conversation.id');
        $this->assertNotNull($conversationId);

        $messageResponse = $this->postJson("/api/messaging/conversations/{$conversationId}/messages", [
            'content' => 'Bonjour, avez-vous des paniers disponibles demain ?',
        ], $this->actingAsJwt($consumer));

        $messageResponse
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.message.sender_id', $consumer->id)
            ->assertJsonPath('data.message.content', 'Bonjour, avez-vous des paniers disponibles demain ?');

        $this->assertDatabaseHas('messages', [
            'conversation_id' => $conversationId,
            'sender_id' => $consumer->id,
        ]);

        $this->assertDatabaseHas('conversations', [
            'id' => $conversationId,
            'last_message_preview' => 'Bonjour, avez-vous des paniers disponibles demain ?',
        ]);
    }

    public function test_participants_can_list_their_conversations(): void
    {
        $consumer = User::factory()->create(['role' => 'consumer']);
        $merchant = User::factory()->merchant()->create();

        $conversation = Conversation::create([
            'consumer_id' => $consumer->id,
            'merchant_id' => $merchant->id,
        ]);

        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $consumer->id,
            'content' => 'Bonjour !',
        ]);

        $response = $this->getJson('/api/messaging/conversations', $this->actingAsJwt($merchant));

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data.conversations')
            ->assertJsonPath('data.conversations.0.id', $conversation->id);
    }

    public function test_non_participant_cannot_access_conversation(): void
    {
        $consumer = User::factory()->create(['role' => 'consumer']);
        $merchant = User::factory()->merchant()->create();
        $intruder = User::factory()->create();

        $conversation = Conversation::create([
            'consumer_id' => $consumer->id,
            'merchant_id' => $merchant->id,
        ]);

        $this->getJson("/api/messaging/conversations/{$conversation->id}", $this->actingAsJwt($intruder))
            ->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    public function test_sender_can_update_and_delete_message(): void
    {
        $consumer = User::factory()->create(['role' => 'consumer']);
        $merchant = User::factory()->merchant()->create();

        $conversation = Conversation::create([
            'consumer_id' => $consumer->id,
            'merchant_id' => $merchant->id,
        ]);

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $consumer->id,
            'content' => 'Message initial',
        ]);

        $headers = $this->actingAsJwt($consumer);

        $this->putJson("/api/messaging/messages/{$message->id}", [
            'content' => 'Message mis à jour',
        ], $headers)->assertOk()->assertJsonPath('data.message.content', 'Message mis à jour');

        $this->deleteJson("/api/messaging/messages/{$message->id}", [], $headers)
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted('messages', [
            'id' => $message->id,
        ]);
    }
}
