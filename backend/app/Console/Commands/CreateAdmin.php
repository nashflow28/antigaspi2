<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CreateAdmin extends Command
{
    protected $signature = 'admin:create
                           {email : Email de l\'administrateur}
                           {--name= : Nom complet (optionnel)}
                           {--password= : Mot de passe (sera généré si non fourni)}';

    protected $description = 'Créer un nouveau compte administrateur';

    public function handle()
    {
        $email = $this->argument('email');
        $name = $this->option('name') ?: 'Super Admin';
        $password = $this->option('password') ?: $this->generatePassword();

        // Validation
        $validator = Validator::make([
            'email' => $email,
        ], [
            'email' => 'required|email|unique:users,email',
        ]);

        if ($validator->fails()) {
            $this->error('Erreur de validation:');
            foreach ($validator->errors()->all() as $error) {
                $this->error('- '.$error);
            }

            return 1;
        }

        // Séparer prénom et nom
        $nameParts = explode(' ', $name, 2);
        $firstName = $nameParts[0];
        $lastName = isset($nameParts[1]) ? $nameParts[1] : 'Admin';

        // Créer l'utilisateur
        $user = User::create([
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $email,
            'password' => Hash::make($password),
            'phone' => null,
            'city' => 'Abidjan',
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        $this->info('✅ Administrateur créé avec succès !');
        $this->line('');
        $this->line('📧 Email: '.$user->email);
        $this->line('🔑 Mot de passe: '.$password);
        $this->line('👤 Nom: '.$user->first_name.' '.$user->last_name);
        $this->line('');
        $this->warn('⚠️  Conservez précieusement ces informations !');

        return 0;
    }

    private function generatePassword(): string
    {
        return 'Admin'.rand(1000, 9999).'!';
    }
}
