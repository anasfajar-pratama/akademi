<?php

namespace App\Support;

class PhoneNumber
{
    /**
     * Normalize an Indonesian phone number to the 62xxxx form.
     */
    public static function normalize(?string $value): ?string
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $value);

        if ($digits === '') {
            return null;
        }

        if (str_starts_with($digits, '62')) {
            return $digits;
        }

        if (str_starts_with($digits, '0')) {
            return '62'.substr($digits, 1);
        }

        if (str_starts_with($digits, '8')) {
            return '62'.$digits;
        }

        return $digits;
    }

    /**
     * Display helper: 62812xxxxxxx -> 0812-xxxx-xxxx.
     */
    public static function display(?string $value): ?string
    {
        $normalized = self::normalize($value);

        if (! $normalized || ! str_starts_with($normalized, '62')) {
            return $value;
        }

        return '0'.substr($normalized, 2);
    }
}
