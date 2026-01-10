<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('admin_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->constrained('users')->onDelete('cascade');
            $table->string('action', 100); // approve_merchant, reject_product, suspend_user, etc.
            $table->string('entity_type', 50); // merchant, product, user, review, category, etc.
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->string('entity_name')->nullable(); // Pour référence rapide (nom du produit, email user, etc.)
            $table->text('reason')->nullable(); // Raison du rejet ou de l'action
            $table->json('old_values')->nullable(); // Valeurs avant modification
            $table->json('new_values')->nullable(); // Valeurs après modification
            $table->json('metadata')->nullable(); // Données supplémentaires (IP, user agent, etc.)
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamps();

            // Index pour recherches rapides
            $table->index('action');
            $table->index('entity_type');
            $table->index(['entity_type', 'entity_id']);
            $table->index('created_at');
        });

        // Ajouter colonne rejection_reason aux tables existantes (si elles existent)
        if (Schema::hasTable('merchants')) {
            Schema::table('merchants', function (Blueprint $table) {
                if (! Schema::hasColumn('merchants', 'rejection_reason')) {
                    $table->text('rejection_reason')->nullable()->after('is_verified');
                }
                if (! Schema::hasColumn('merchants', 'verified_at')) {
                    $table->timestamp('verified_at')->nullable()->after('rejection_reason');
                }
                if (! Schema::hasColumn('merchants', 'verified_by')) {
                    $table->foreignId('verified_by')->nullable()->after('verified_at')->constrained('users')->nullOnDelete();
                }
            });
        }

        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                if (! Schema::hasColumn('products', 'rejection_reason')) {
                    $table->text('rejection_reason')->nullable()->after('is_active');
                }
                if (! Schema::hasColumn('products', 'approved_at')) {
                    $table->timestamp('approved_at')->nullable()->after('rejection_reason');
                }
                if (! Schema::hasColumn('products', 'approved_by')) {
                    $table->foreignId('approved_by')->nullable()->after('approved_at')->constrained('users')->nullOnDelete();
                }
                if (! Schema::hasColumn('products', 'moderation_status')) {
                    $table->enum('moderation_status', ['pending', 'approved', 'rejected'])->default('pending')->after('approved_by');
                }
            });
        }

        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (! Schema::hasColumn('users', 'suspension_reason')) {
                    $table->text('suspension_reason')->nullable()->after('is_active');
                }
                if (! Schema::hasColumn('users', 'suspended_at')) {
                    $table->timestamp('suspended_at')->nullable()->after('suspension_reason');
                }
                if (! Schema::hasColumn('users', 'suspended_by')) {
                    $table->foreignId('suspended_by')->nullable()->after('suspended_at')->constrained('users')->nullOnDelete();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admin_audit_logs');

        if (Schema::hasTable('merchants')) {
            Schema::table('merchants', function (Blueprint $table) {
                $columns = array_filter(['rejection_reason', 'verified_at', 'verified_by'], fn ($col) => Schema::hasColumn('merchants', $col));
                if (! empty($columns)) {
                    $table->dropColumn($columns);
                }
            });
        }

        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                $columns = array_filter(['rejection_reason', 'approved_at', 'approved_by', 'moderation_status'], fn ($col) => Schema::hasColumn('products', $col));
                if (! empty($columns)) {
                    $table->dropColumn($columns);
                }
            });
        }

        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                $columns = array_filter(['suspension_reason', 'suspended_at', 'suspended_by'], fn ($col) => Schema::hasColumn('users', $col));
                if (! empty($columns)) {
                    $table->dropColumn($columns);
                }
            });
        }
    }
};
