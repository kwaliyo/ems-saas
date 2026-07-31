<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->foreignId('module_id')->nullable()->after('id')->constrained('modules')->nullOnDelete();
            $table->dropForeign(['assessment_id']);
            $table->foreignId('assessment_id')->nullable()->change();
            $table->foreign('assessment_id')->references('id')->on('assessments')->nullOnDelete();
        });

        // Backfill module_id for existing questions based on their assessment's module_id
        $assessments = DB::table('assessments')->whereNotNull('module_id')->get();
        foreach ($assessments as $a) {
            DB::table('questions')->where('assessment_id', $a->id)->update(['module_id' => $a->module_id]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->dropForeign(['module_id']);
            $table->dropColumn('module_id');
            $table->dropForeign(['assessment_id']);
            $table->foreignId('assessment_id')->nullable(false)->change();
            $table->foreign('assessment_id')->references('id')->on('assessments')->cascadeOnDelete();
        });
    }
};
