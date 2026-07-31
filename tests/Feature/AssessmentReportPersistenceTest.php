<?php

use App\Models\Assessment;
use App\Models\Participant;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('assessment report persists even after assessment is deleted', function () {
    $user = User::factory()->create();

    $assessment = Assessment::create([
        'user_id' => $user->id,
        'title' => 'Cybersecurity Basics Final',
        'subject' => 'IT Security',
    ]);

    $question = $assessment->questions()->create([
        'order' => 1,
        'type' => 'multiple_choice',
        'question_text' => 'What is SQL Injection?',
        'points' => 2,
    ]);

    $question->options()->create([
        'option_text' => 'A code injection technique',
        'is_correct' => true,
    ]);

    $room = Room::create([
        'user_id' => $user->id,
        'assessment_id' => $assessment->id,
        'assessment_title' => $assessment->title,
        'assessment_subject' => $assessment->subject,
        'code' => Room::generateUniqueCode(),
        'mode' => 'student_paced',
        'status' => 'completed',
        'questions_snapshot' => $assessment->questions()->with('options')->get()->toArray(),
    ]);

    $participant = $room->participants()->create([
        'name' => 'John Doe',
        'session_token' => 'token-12345',
        'score' => 2,
        'total_questions' => 1,
        'completed_at' => now(),
    ]);

    $participant->answers()->create([
        'question_id' => $question->id,
        'question_text' => $question->question_text,
        'question_type' => $question->type,
        'points' => 2,
        'is_correct' => true,
        'score_awarded' => 2,
    ]);

    // Delete the assessment
    $this->actingAs($user)
        ->delete(route('assessments.destroy', $assessment->id))
        ->assertRedirect(route('assessments.index'));

    // Assert assessment is deleted from DB
    $this->assertDatabaseMissing('assessments', ['id' => $assessment->id]);

    // Assert room, participant, and answers STILL EXIST in DB
    $this->assertDatabaseHas('rooms', ['id' => $room->id]);
    $this->assertDatabaseHas('participants', ['id' => $participant->id]);
    $this->assertDatabaseHas('participant_answers', ['participant_id' => $participant->id]);

    // Assert room report endpoint loads successfully with 200 OK
    $response = $this->actingAs($user)->get(route('reports.show', $room->id));
    $response->assertStatus(200);

    // Assert student script report endpoint loads successfully with 200 OK
    $scriptResponse = $this->actingAs($user)->get(route('reports.participant-script', [$room->id, $participant->id]));
    $scriptResponse->assertStatus(200);
});
