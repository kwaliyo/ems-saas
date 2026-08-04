<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class MakeAdminCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'make:admin {email? : The email address of the user to promote to Super Admin}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Promote a registered user to Super Admin with full institution privileges';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $email = $this->argument('email');

        if (! $email) {
            $email = $this->ask('Enter the email address of the user to grant Super Admin access');
        }

        $user = User::where('email', trim($email))->first();

        if (! $user) {
            $this->error("User with email [{$email}] was not found.");

            return Command::FAILURE;
        }

        $user->update([
            'role' => 'super_admin',
            'subscription_plan' => 'institution',
        ]);

        $this->info("Success! User [{$user->name}] ({$user->email}) is now a Super Admin with Institution plan privileges.");

        return Command::SUCCESS;
    }
}
