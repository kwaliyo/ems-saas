<?php

require 'C:/laragon/www/EMS-SAAS/vendor/autoload.php';
$app = require_once 'C:/laragon/www/EMS-SAAS/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\User::where('email', 'mj@gmail.com')->first(); // Muhammad Jaafar

$taughtCourses = $user->taughtCourses()
    ->withCount(['modules', 'students'])
    ->with(['modules.assessments.rooms'])
    ->latest()
    ->get();

$allCourses = \App\Models\Course::with('instructor')
    ->withCount(['modules', 'students'])
    ->with(['modules.assessments.rooms'])
    ->latest()
    ->get();

if ($user->isSuperAdmin() || $taughtCourses->isEmpty() || $user->role === 'instructor') {
    $taughtCourses = $allCourses;
}

echo "Taught/Managed Courses Count: " . $taughtCourses->count() . "\n";
foreach ($taughtCourses as $c) {
    echo " - Course ID: {$c->id}, Code: {$c->code}, Title: {$c->title}, Modules: {$c->modules_count}, Students: {$c->students_count}, Owner: " . ($c->instructor?->name ?? 'System') . "\n";
}
