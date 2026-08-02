<?php

require 'C:/laragon/www/EMS-SAAS/vendor/autoload.php';
$app = require_once 'C:/laragon/www/EMS-SAAS/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\User::where('email', 'mj@gmail.com')->first();
echo "Logged in User: " . $user->name . " (ID: " . $user->id . ")\n";

$studentIds = [8, 9, 10]; // BCC Screening 0001, 0002, 0003
$students = \App\Models\User::whereIn('id', array_diff($studentIds, [$user->id]))->get();

echo "Found students for bulk deletion: " . $students->count() . "\n";
foreach ($students as $s) {
    echo " - Will delete: {$s->id} - {$s->name} ({$s->email})\n";
}
