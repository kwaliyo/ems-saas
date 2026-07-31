<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnalyticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_view_analytics_page_without_errors(): void
    {
        $user = User::factory()->create();

        $course = Course::create([
            'user_id' => $user->id,
            'code' => 'CS101',
            'title' => 'Computer Science',
        ]);

        $response = $this->actingAs($user)->get(route('analytics.index'));

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('analytics/Index')
                ->has('courseAnalytics')
            );
    }
}
