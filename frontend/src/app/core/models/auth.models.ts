// src/app/core/models/auth.models.ts
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  country?: string;
  termsAccepted: boolean;
}

export interface AuthResponse {
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  mfaRequired: boolean;
  mfaToken?: string;
  user?: UserProfile;
}

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  provider: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  avatarUrl?: string;
  preferredCurrency: string;
  company?: string;
  jobTitle?: string;
  country?: string;
  lastLoginAt?: string;
  createdAt?: string;
}

export interface MfaVerifyRequest {
  mfaToken: string;
  code: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errorCode?: string;
}

export interface CourseDto {
  id: number;
  certificationType: string;
  title: string;
  description: string;
  price: number;
  earlyBirdPrice?: number;
  earlyBirdDeadline?: string;
  maxSeats: number;
  seatsRemaining: number;
  durationDays: number;
  format: string;
  zoomLink?: string;
  venue?: string;
  active: boolean;
  soldOut: boolean;
  startDate: string;
  endDate: string;
  targetAudience?: string;
  learningOutcomes?: string[];
  effectivePrice: number;
  earlyBirdActive: boolean;
}

export interface RegistrationDto {
  id: number;
  registrationRef: string;
  course: CourseDto;
  status: string;
  amount: number;
  currency: string;
  paymentStatus: string;
  couponCode?: string;
  discountAmount?: number;
  createdAt: string;
  confirmedAt?: string;
  stripeSessionId?: string;
}

export interface DashboardStats {
  totalRegistrations: number;
  revenueYtd: number;
  revenueThisMonth: number;
  upcomingCourses: number;
  waitlistTotal: number;
  certificatesIssued: number;
  monthlyRevenue: MonthlyRevenue[];
  enrollmentByCourse: CourseEnrollmentStat[];
}

export interface MonthlyRevenue { month: string; revenue: number; enrollments: number; }
export interface CourseEnrollmentStat { courseName: string; count: number; percentage: number; }
