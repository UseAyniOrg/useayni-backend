export class MemberProfileDto {
  id: string;
  name: string;
  phone: string | null;
  ra: string | null;
  profile_picture_url?: string;
  birth_date: Date | null;
  admission_date: Date | null;
  biography?: string;
  banner_url?: string;
  curriculum_url?: string;
  youtube_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  github_url?: string;
  
  course?: {
    id: string;
    name: string;
  };

  city?: {
    id: string;
    name: string;
  };

  university?: {
    id: string;
    name: string;
  };

  sponsor?: {
    id: string;
    name: string;
    profile_picture_url?: string;
  };

  roles?: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}
