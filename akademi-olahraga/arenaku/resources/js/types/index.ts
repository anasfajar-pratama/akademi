export interface AuthUser {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    initials: string;
    is_super_admin: boolean;
    must_change_password: boolean;
}

export interface Membership {
    academy_id: number;
    academy_name: string | null;
    role: string;
    role_label: string;
}

export interface CurrentAcademy {
    id: number;
    name: string;
    slug: string;
    brand_color: string;
}

export interface Credential {
    name: string;
    role: string;
    role_label: string;
    email: string | null;
    phone: string | null;
    password: string | null;
    created: boolean;
    note?: string;
}

export interface DemoAccount {
    role: string;
    login: string;
    password: string;
    description: string;
}

export interface AcademyOption {
    id: number;
    name: string;
}

export interface PageProps {
    auth: {
        user: AuthUser | null;
        role: string | null;
        memberships: Membership[];
    };
    currentAcademy: CurrentAcademy | null;
    flash: {
        success?: string;
        error?: string;
        credentials?: Credential[];
    };
    demoAccounts: DemoAccount[];
    academies: AcademyOption[];
    [key: string]: unknown;
}

export type Role = 'super_admin' | 'admin' | 'coach' | 'parent' | 'member';
