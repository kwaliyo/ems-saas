<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_regular_instructor_cannot_access_admin_dashboard(): void
    {
        $instructor = User::factory()->create(['role' => 'instructor']);

        $response = $this->actingAs($instructor)->get(route('admin.dashboard'));

        $response->assertStatus(403);
    }

    public function test_super_admin_can_access_admin_dashboard(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);

        $response = $this->actingAs($admin)->get(route('admin.dashboard'));

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/Dashboard')
                ->has('metrics')
                ->has('activeRooms')
                ->has('recentUsers')
            );
    }

    public function test_super_admin_can_view_users_list_and_toggle_role(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $instructor = User::factory()->create(['role' => 'instructor']);

        $response = $this->actingAs($admin)->get(route('admin.users.index'));
        $response->assertOk()->assertInertia(fn ($page) => $page->component('admin/Users'));

        $toggleResponse = $this->actingAs($admin)->post(route('admin.users.toggle-role', $instructor));
        $toggleResponse->assertRedirect();

        $this->assertEquals('super_admin', $instructor->fresh()->role);
    }

    public function test_super_admin_can_view_rooms_list_and_emergency_end_room(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $instructor = User::factory()->create(['role' => 'instructor']);

        $room = Room::create([
            'user_id' => $instructor->id,
            'assessment_title' => 'Midterm Exam',
            'assessment_subject' => 'CS101',
            'code' => 'ADMIN1',
            'status' => 'active',
            'mode' => 'exam',
        ]);

        $response = $this->actingAs($admin)->get(route('admin.rooms.index'));
        $response->assertOk()->assertInertia(fn ($page) => $page->component('admin/Rooms'));

        $endResponse = $this->actingAs($admin)->post(route('admin.rooms.end', $room));
        $endResponse->assertRedirect();

        $this->assertEquals('completed', $room->fresh()->status);
    }
}
