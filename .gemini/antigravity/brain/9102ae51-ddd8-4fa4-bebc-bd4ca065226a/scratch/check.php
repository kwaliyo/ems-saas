<?php

require 'C:/laragon/www/EMS-SAAS/vendor/autoload.php';
$app = require_once 'C:/laragon/www/EMS-SAAS/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\User::where('email', 'mj@gmail.com')->first(); // Muhammad Jaafar
echo "Logged in User: " . $user->name . " (ID: " . $user->id . ")\n";

$availableCourses = \App\Models\Course::with('instructor')->latest()->get();
echo "Available Courses Count: " . $availableCourses->count() . "\n";

$students = \App\Models\User::where('id', '!=', $user->id)
    ->where(function ($query) {
        $query->where('role', '!=', 'super_admin')
            ->orWhereHas('enrolledCourses')
            ->orWhereNotNull('created_by_user_id')
            ->orWhereNotNull('student_number');
    })
    ->with(['enrolledCourses'])
    ->latest()
    ->get();

echo "Students Directory Count: " . $students->count() . "\n";
foreach ($students as $s) {
    echo " - Student ID: {$s->id}, Name: {$s->name}, Enrolled Courses: " . implode(', ', $s->enrolledCourses->pluck('code')->toArray()) . "\n";
}
