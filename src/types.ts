export type Role = 'admin' | 'teacher' | 'student';

export interface User {
  id: number;
  username: string;
  password?: string;
  role: Role;
  name: string;
  class_name?: string;
}

export interface Material {
  id: number;
  title: string;
  type: 'pdf' | 'video' | 'note';
  url: string;
  class_name: string;
  subject: string;
  uploaded_by: number;
  created_at: string;
}

export interface Homework {
  id: number;
  title: string;
  description: string;
  file_url: string;
  class_name: string;
  subject: string;
  teacher_id: number;
  created_at: string;
}

export interface Notice {
  id: number;
  content: string;
  created_at: string;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
}

export const CLASSES = ['LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'];
export const SUBJECTS = ['Eng', 'Hindi', 'Maths', 'Science/EVS', 'S. Studies', 'GK', 'M.V'];
