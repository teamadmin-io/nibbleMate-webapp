export type AuthFormData = {
    email: string;
    password: string;
  };
  
  export type SessionInfo = {
    id: string;
    email: string;
    role?: string;
    aud?: string;
  };