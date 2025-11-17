export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: "ADMIN" | "TEACHER";
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: "ADMIN" | "TEACHER";
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: "ADMIN" | "TEACHER";
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
