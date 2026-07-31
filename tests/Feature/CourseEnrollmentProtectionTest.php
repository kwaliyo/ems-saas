<?php

use App\Models\Assessment;
use App\Models\Course;
use App\Models\Module;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('student from another course cannot join assessment room of course they are not enrolled in', function () {
    $instructor = User::factory()->create();

    // Course 1 (Cybersecurity) with enrolled Student 1
    $course1 = Course::create([
        'user_id' => $instructor->id,
        'title' => 'Cybersecurity 101',
        'code' => 'CY101',
    ]);
    $student1 = User::factory()->create(['name' => 'Alice Cyber', 'email' => 'alice@cyber.com']);
    $course1->students()->attach($student1->id);

    // Course 2 (Physics) with enrolled Student 2
    $course2 = Course::create([
        'user_id' => $instructor->id,
        'title' => 'Physics 101',
        'code' => 'PHY101',
    ]);
    $student2 = User::factory()->create(['name' => 'Bob Physics', 'email' => 'bob@physics.com']);
    $course2->students()->attach($student2->id);

    // Create Module and Assessment Room for Course 1
    $module1 = $course1->modules()->create(['title' => 'Network Defense', 'code' => 'M1']);
    $assessment1 = $instructor->assessments()->create([
        'module_id' => $module1->id,
        'title' => 'Cyber Exam 1',
        'subject' => $course1->title,
    ]);
    $assessment1->questions()->create([
        'module_id' => $module1->id,
        'order' => 0,
        'type' => 'multiple_choice',
        'question_text' => 'What is a firewall?',
        'points' => 1,
    ]);

    $room1 = Room::create([
        'user_id' => $instructor->id,
        'assessment_id' => $assessment1->id,
        'assessment_title' => $assessment1->title,
        'assessment_subject' => $assessment1->subject,
        'code' => 'CYBER1',
        'mode' => 'student_paced',
        'status' => 'active',
        'started_at' => now(),
    ]);

    // Student 2 (from Physics) attempts to join Course 1 (Cybersecurity) exam room
    $response = $this->actingAs($student2)->post('/join', [
        'code' => 'CYBER1',
        'name' => 'Bob Physics',
    ]);

    // Access should be DENIED
    $response->assertSessionHasErrors(['code']);
    $this->assertDatabaseMissing('participants', [
        'room_id' => $room1->id,
        'name' => 'Bob Physics',
    ]);

    // Student 1 (enrolled in Cybersecurity) attempts to join Course 1 exam room
    $successResponse = $this->actingAs($student1)->post('/join', [
        'code' => 'CYBER1',
        'name' => 'Alice Cyber',
    ]);

    // Access should be GRANTED
    $successResponse->assertSessionHasNoErrors();
    $this->assertDatabaseHas('participants', [
        'room_id' => $room1->id,
        'name' => 'Alice Cyber',
    ]);
});
