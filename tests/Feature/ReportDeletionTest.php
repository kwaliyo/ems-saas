<?php

use App\Models\Assessment;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('instructor can delete an assessment report', function () {
    $user = User::factory()->create();

    $assessment = $user->assessments()->create([
        'title' => 'Sample Assessment',
        'subject' => 'Math',
    ]);

    $room = $user->rooms()->create([
        'assessment_id' => $assessment->id,
        'code' => 'DEL123',
        'mode' => 'student_paced',
        'status' => 'completed',
        'settings' => [],
    ]);

    $participant = $room->participants()->create([
        'name' => 'Alice Student',
        'session_token' => 'token123',
        'score' => 10,
    ]);

    $this->assertDatabaseHas('rooms', ['id' => $room->id]);
    $this->assertDatabaseHas('participants', ['id' => $participant->id]);

    $response = $this->actingAs($user)->delete(route('reports.destroy', $room->id));

    $response->assertRedirect(route('reports.index'));
    $this->assertDatabaseMissing('rooms', ['id' => $room->id]);
    $this->assertDatabaseMissing('participants', ['id' => $participant->id]);
});
