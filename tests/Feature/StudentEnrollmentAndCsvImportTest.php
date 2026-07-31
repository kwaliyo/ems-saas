<?php

use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('instructor can manually enroll student with extended profile fields', function () {
    $instructor = User::factory()->create();
    $course = Course::create([
        'user_id' => $instructor->id,
        'code' => 'CS101',
        'title' => 'Intro to CS',
    ]);

    $response = $this->actingAs($instructor)
        ->post(route('courses.enroll', $course), [
            'student_number' => 'STU-2026-999',
            'first_name' => 'Alice',
            'middle_name' => 'Grace',
            'surname' => 'Hopper',
            'gender' => 'female',
            'date_of_birth' => '2000-05-15',
            'email' => 'alice.hopper@university.edu',
            'password' => 'secret123',
        ]);

    $response->assertRedirect();

    $student = User::where('email', 'alice.hopper@university.edu')->first();
    expect($student)->not->toBeNull()
        ->and($student->student_number)->toBe('STU-2026-999')
        ->and($student->first_name)->toBe('Alice')
        ->and($student->middle_name)->toBe('Grace')
        ->and($student->surname)->toBe('Hopper')
        ->and($student->gender)->toBe('female')
        ->and($student->name)->toBe('Alice Grace Hopper');

    expect($course->students()->where('users.id', $student->id)->exists())->toBeTrue();
});

test('instructor can import student roster csv with header mapping', function () {
    $instructor = User::factory()->create();
    $course = Course::create([
        'user_id' => $instructor->id,
        'code' => 'CS102',
        'title' => 'Data Structures',
    ]);

    $csvContent = "student_number,first_name,middle_name,surname,gender,date_of_birth,email,password\n" .
        "STU-001,John,Robert,Smith,male,2001-01-10,john.smith@univ.edu,pass123\n" .
        "STU-002,Mary,,Johnson,female,2002-04-20,mary.j@univ.edu,pass456\n";

    $file = UploadedFile::fake()->createWithContent('students.csv', $csvContent);

    $response = $this->actingAs($instructor)
        ->post(route('courses.import-students-csv', $course), [
            'csv_file' => $file,
        ]);

    $response->assertRedirect();

    $john = User::where('email', 'john.smith@univ.edu')->first();
    expect($john)->not->toBeNull()
        ->and($john->student_number)->toBe('STU-001')
        ->and($john->name)->toBe('John Robert Smith');

    $mary = User::where('email', 'mary.j@univ.edu')->first();
    expect($mary)->not->toBeNull()
        ->and($mary->student_number)->toBe('STU-002')
        ->and($mary->name)->toBe('Mary Johnson');

    expect($course->students()->count())->toBe(2);
});

test('instructor can import csv from students directory and attach courses', function () {
    $instructor = User::factory()->create();
    $course = Course::create([
        'user_id' => $instructor->id,
        'code' => 'CS103',
        'title' => 'Algorithms',
    ]);

    $csvContent = "STU-003,Carol,Anne,Danvers,female,1999-12-01,carol@univ.edu\n";

    $file = UploadedFile::fake()->createWithContent('roster.csv', $csvContent);

    $response = $this->actingAs($instructor)
        ->post(route('students.import-csv'), [
            'csv_file' => $file,
            'course_ids' => [$course->id],
        ]);

    $response->assertRedirect();

    $carol = User::where('email', 'carol@univ.edu')->first();
    expect($carol)->not->toBeNull()
        ->and($carol->student_number)->toBe('STU-003')
        ->and($carol->surname)->toBe('Danvers');

    expect($carol->enrolledCourses()->where('courses.id', $course->id)->exists())->toBeTrue();
});
