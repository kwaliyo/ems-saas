<?php

namespace Tests\Feature;

use App\Models\SystemAnnouncement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SystemAnnouncementTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_update_system_announcement_broadcast(): void
    {
        $superAdmin = User::factory()->create([
            'role' => 'super_admin',
        ]);

        $response = $this->actingAs($superAdmin)->put('/settings/announcement', [
            'enabled' => true,
            'message' => '📢 Maintenance Tonight at 11PM WAT.',
            'type' => 'warning',
            'link_text' => 'Learn More',
            'link_url' => '/#pricing',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('system_announcements', [
            'message' => '📢 Maintenance Tonight at 11PM WAT.',
            'type' => 'warning',
            'enabled' => true,
        ]);

        $payload = SystemAnnouncement::getActivePayload();
        $this->assertTrue($payload['enabled']);
        $this->assertEquals('📢 Maintenance Tonight at 11PM WAT.', $payload['message']);
        $this->assertEquals('warning', $payload['type']);
    }

    public function test_regular_user_cannot_update_system_announcement(): void
    {
        $user = User::factory()->create([
            'role' => 'student',
        ]);

        $response = $this->actingAs($user)->put('/settings/announcement', [
            'enabled' => true,
            'message' => 'Unauthorized broadcast test',
            'type' => 'danger',
        ]);

        $response->assertStatus(403);
    }
}
