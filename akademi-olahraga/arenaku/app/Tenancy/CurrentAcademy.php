<?php

namespace App\Tenancy;

use App\Models\Academy;

class CurrentAcademy
{
    protected ?Academy $academy = null;

    public function set(?Academy $academy): void
    {
        $this->academy = $academy;
    }

    public function get(): ?Academy
    {
        return $this->academy;
    }

    public function id(): ?int
    {
        return $this->academy?->id;
    }

    public function check(): bool
    {
        return $this->academy !== null;
    }

    public function clear(): void
    {
        $this->academy = null;
    }
}
