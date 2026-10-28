<?php

namespace Database\Seeders;

use App\Models\Skill;
use App\Models\SkillCategory;
use App\Models\Sport;
use Illuminate\Database\Seeder;

class SkillTemplateSeeder extends Seeder
{
    /**
     * @var array<string, array<string, array<int, string>>>
     */
    protected array $templates = [
        'badminton' => [
            'Teknik Dasar' => ['Grip', 'Stance', 'Servis', 'Footwork dasar'],
            'Pukulan' => ['Clear', 'Drop shot', 'Smash', 'Netting', 'Drive', 'Backhand'],
            'Footwork & Gerak' => ['Kecepatan langkah', 'Recovery', 'Kelincahan'],
            'Strategi' => ['Pola serangan', 'Pertahanan', 'Pembacaan permainan'],
            'Fisik' => ['Stamina', 'Kekuatan', 'Fleksibilitas'],
            'Mental & Disiplin' => ['Fokus', 'Sportivitas', 'Kedisiplinan latihan'],
        ],
        'renang' => [
            'Dasar Air' => ['Pernapasan', 'Floating', 'Streamline'],
            'Gaya' => ['Gaya bebas', 'Gaya punggung', 'Gaya dada', 'Gaya kupu-kupu'],
            'Teknik Lanjutan' => ['Turn & start', 'Ketahanan'],
        ],
        'taekwondo' => [
            'Dasar' => ['Kuda-kuda', 'Tendangan dasar', 'Poomsae'],
            'Pertandingan' => ['Sparring', 'Kekuatan', 'Disiplin'],
        ],
        'sepak-bola' => [
            'Teknik' => ['Controlling', 'Passing', 'Dribbling', 'Shooting'],
            'Taktik' => ['Positioning', 'Kerja sama tim'],
            'Fisik' => ['Fisik', 'Stamina'],
        ],
    ];

    public function run(): void
    {
        foreach (Sport::all() as $sport) {
            $categories = $this->templates[$sport->slug] ?? [];

            foreach ($categories as $categoryName => $skillNames) {
                $category = SkillCategory::create([
                    'sport_id' => $sport->id,
                    'name' => $categoryName,
                    'weight' => 1.00,
                ]);

                foreach ($skillNames as $index => $skillName) {
                    Skill::create([
                        'academy_id' => null,
                        'sport_id' => $sport->id,
                        'skill_category_id' => $category->id,
                        'name' => $skillName,
                        'sort_order' => $index,
                        'is_active' => true,
                    ]);
                }
            }
        }
    }
}
