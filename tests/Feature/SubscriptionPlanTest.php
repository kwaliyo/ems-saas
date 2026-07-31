<?php

namespace Tests\Feature;

use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubscriptionPlanTest extends TestCase
{
    use RefreshDatabase;

    public function test_free_plan_blocks_candidate_joins_exceeding_25_seat_limit(): void
    {
        $instructor = User::factory()->create([
            'role' => 'instructor',
            'subscription_plan' => 'free',
        ]);

        $room = Room::create([
            'user_id' => $instructor->id,
            'assessment_title' => 'Biology Quiz',
            'assessment_subject' => 'BIO101',
            'code' => 'FREE25',
            'status' => 'active',
            'mode' => 'exam',
        ]);

        // Create 25 existing participants
        for ($i = 1; $i <= 25; $i++) {
            $room->participants()->create([
                'name' => "Candidate {$i}",
                'student_id_code' => "STU{$i}",
                'session_token' => "token-{$i}",
                'score' => 0,
            ]);
        }

        // Attempt 26th join
        $response = $this->post('/join', [
            'code' => 'FREE25',
            'student_id_code' => 'STU26',
        ]);

        $response->assertSessionHasErrors(['code']);
    }

    public function test_pro_plan_permits_more_than_25_candidates(): void
    {
        $instructor = User::factory()->create([
            'role' => 'instructor',
            'subscription_plan' => 'pro',
        ]);

        $room = Room::create([
            'user_id' => $instructor->id,
            'assessment_title' => 'Physics Midterm',
            'assessment_subject' => 'PHY201',
            'code' => 'PRO250',
            'status' => 'active',
            'mode' => 'exam',
        ]);

        // Create 25 existing participants
        for ($i = 1; $i <= 25; $i++) {
            $room->participants()->create([
                'name' => "Candidate {$i}",
                'student_id_code' => "STU{$i}",
                'session_token' => "token-{$i}",
                'score' => 0,
            ]);
        }

        // Attempt 26th join on Pro plan should succeed
        $response = $this->post('/join', [
            'code' => 'PRO250',
            'student_id_code' => 'STU26',
        ]);

        $response->assertRedirect();
        $this->assertEquals(26, $room->participants()->count());
    }

    public function test_instructor_can_view_billing_settings_and_upgrade_plan(): void
    {
        $instructor = User::factory()->create(['role' => 'instructor', 'subscription_plan' => 'free']);

        $response = $this->actingAs($instructor)->get(route('subscription.billing'));
        $response->assertOk()->assertInertia(fn ($page) => $page->component('settings/billing'));

        $upgradeResponse = $this->actingAs($instructor)->post(route('subscription.upgrade'), ['plan' => 'pro']);
        $upgradeResponse->assertRedirect();

        $this->assertEquals('pro', $instructor->fresh()->subscription_plan);
    }

    public function test_super_admin_can_view_subscriptions_telemetry_and_update_user_plan(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $instructor = User::factory()->create(['role' => 'instructor', 'subscription_plan' => 'free']);

        $response = $this->actingAs($admin)->get(route('admin.subscriptions.index'));
        $response->assertOk()->assertInertia(fn ($page) => $page->component('admin/Subscriptions'));

        $updateResponse = $this->actingAs($admin)->post(route('admin.users.update-plan', $instructor), ['plan' => 'institution']);
        $updateResponse->assertRedirect();

        $this->assertEquals('institution', $instructor->fresh()->subscription_plan);
    }
}
