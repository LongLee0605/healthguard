import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type {
  User,
  AuthResponse,
  SymptomLog,
  VitalSign,
  VitalChartData,
  VitalSignType,
  VitalSource,
  HealthDevice,
  ImportVitalsResult,
  AIAnalysis,
  Alert,
  MedicationReminder,
  MedicationTodayItem,
  MedicationAdherence,
  HealthGoal,
  SymptomTrend,
  DashboardStats,
  ActivityItem,
  HealthReport,
  WeeklyInsight,
  ChatMessage,
} from '@/types';
import { setToken, logout } from '@/store/slices/authSlice';

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  timeout: 90000,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as { auth: { token: string | null } }).auth.token;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

/** Auto-refresh: on 401 try /auth/refresh once, then retry original request */
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refreshToken = (api.getState() as { auth: { refreshToken: string | null } }).auth.refreshToken;
    if (refreshToken) {
      const refreshResult = await rawBaseQuery(
        { url: '/auth/refresh', method: 'POST', body: { refreshToken } },
        api,
        extraOptions,
      );

      if (refreshResult.data) {
        const newToken = (refreshResult.data as { accessToken: string }).accessToken;
        api.dispatch(setToken(newToken));
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        api.dispatch(logout());
      }
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  keepUnusedDataFor: 180,
  refetchOnFocus: false,
  refetchOnReconnect: true,
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Symptoms', 'Vitals', 'Charts', 'Alerts', 'Medications', 'Dashboard', 'Chat', 'AI', 'Report', 'Goals', 'Timeline', 'Insight', 'Devices'],
  endpoints: (builder) => ({
    // Auth
    login: builder.mutation<AuthResponse, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    register: builder.mutation<AuthResponse, { email: string; password: string; fullName: string }>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    getMe: builder.query<User, void>({
      query: () => '/users/me',
      providesTags: ['User'],
    }),
    updateProfile: builder.mutation<User, Partial<{
      fullName: string;
      dateOfBirth: string;
      gender: string;
      height: number;
      bloodType: string;
      allergies: string;
      chronicConditions: string;
      emergencyContact: string;
      emergencyPhone: string;
    }>>({
      query: (body) => ({ url: '/users/me', method: 'PATCH', body }),
      invalidatesTags: ['User'],
    }),
    changePassword: builder.mutation<{ success: boolean; message: string }, { currentPassword: string; newPassword: string }>({
      query: (body) => ({ url: '/auth/change-password', method: 'POST', body }),
    }),

    // Dashboard
    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => '/dashboard/stats',
      providesTags: ['Dashboard'],
    }),
    getActivity: builder.query<ActivityItem[], void>({
      query: () => '/dashboard/activity',
      providesTags: ['Dashboard'],
    }),
    getTimeline: builder.query<ActivityItem[], { days?: number; type?: string } | void>({
      query: (params) => {
        const days = params && 'days' in params && params.days ? params.days : 30;
        const type = params && 'type' in params && params.type ? params.type : '';
        return `/dashboard/timeline?days=${days}${type ? `&type=${type}` : ''}`;
      },
      providesTags: ['Timeline'],
    }),
    getHealthReport: builder.query<HealthReport, void>({
      query: () => '/dashboard/report',
      providesTags: ['Report'],
    }),
    getWeeklyInsight: builder.query<WeeklyInsight, void>({
      query: () => '/ai/weekly-insight',
      providesTags: ['Insight'],
      keepUnusedDataFor: 6 * 60 * 60,
    }),

    // Symptoms
    getSymptoms: builder.query<SymptomLog[], void>({
      query: () => '/symptoms',
      providesTags: ['Symptoms'],
    }),
    createSymptom: builder.mutation<SymptomLog, { description: string; severity: number; bodyPart?: string }>({
      query: (body) => ({ url: '/symptoms', method: 'POST', body }),
      invalidatesTags: ['Symptoms', 'Dashboard'],
    }),
    updateSymptom: builder.mutation<SymptomLog, { id: string; description?: string; severity?: number; bodyPart?: string }>({
      query: ({ id, ...body }) => ({ url: `/symptoms/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Symptoms', 'Dashboard'],
    }),
    deleteSymptom: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/symptoms/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Symptoms', 'Dashboard'],
    }),
    getSymptomTrends: builder.query<SymptomTrend[], number | void>({
      query: (days = 30) => `/symptoms/trends?days=${days}`,
      providesTags: ['Symptoms'],
    }),

    // Vitals
    getVitals: builder.query<VitalSign[], void>({
      query: () => '/vitals',
      providesTags: ['Vitals'],
    }),
    getVitalChart: builder.query<VitalChartData[], { type: VitalSignType; days?: number }>({
      query: ({ type, days = 30 }) => `/vitals/chart?type=${type}&days=${days}`,
      providesTags: (_result, _err, arg) => [{ type: 'Charts', id: `${arg.type}-${arg.days ?? 30}` }],
    }),
    createVital: builder.mutation<VitalSign, { type: string; value: number; valueSecondary?: number; note?: string }>({
      query: (body) => ({ url: '/vitals', method: 'POST', body }),
      invalidatesTags: ['Vitals', 'Charts', 'Dashboard', 'Alerts'],
    }),
    updateVital: builder.mutation<VitalSign, { id: string; type?: string; value?: number; valueSecondary?: number; note?: string }>({
      query: ({ id, ...body }) => ({ url: `/vitals/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Vitals', 'Charts', 'Dashboard'],
    }),
    deleteVital: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/vitals/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Vitals', 'Charts', 'Dashboard'],
    }),
    importVitals: builder.mutation<
      ImportVitalsResult,
      {
        source: string;
        deviceName?: string;
        deviceModel?: string;
        format?: string;
        payload?: string | unknown;
        readings?: Array<{
          type: string;
          value: number;
          valueSecondary?: number;
          recordedAt: string;
          externalId?: string;
          note?: string;
        }>;
      }
    >({
      query: (body) => ({ url: '/vitals/import', method: 'POST', body }),
      invalidatesTags: ['Vitals', 'Charts', 'Dashboard', 'Alerts', 'Devices'],
    }),
    getHealthDevices: builder.query<HealthDevice[], void>({
      query: () => '/vitals/devices',
      providesTags: ['Devices'],
    }),

    // AI
    analyzeSymptom: builder.mutation<AIAnalysis, { description: string; severity: number; bodyPart?: string }>({
      query: (body) => ({ url: '/ai/analyze', method: 'POST', body }),
      invalidatesTags: ['AI', 'Dashboard', 'Alerts'],
    }),
    getAiHistory: builder.query<AIAnalysis[], void>({
      query: () => '/ai/history',
      providesTags: ['AI'],
    }),

    // Chat
    getChatHistory: builder.query<ChatMessage[], void>({
      query: () => '/ai/chat',
      providesTags: ['Chat'],
    }),
    sendChatMessage: builder.mutation<ChatMessage, { message: string }>({
      query: (body) => ({ url: '/ai/chat', method: 'POST', body }),
      invalidatesTags: ['Chat'],
    }),
    clearChat: builder.mutation<{ success: boolean }, void>({
      query: () => ({ url: '/ai/chat', method: 'DELETE' }),
      invalidatesTags: ['Chat'],
    }),

    // Alerts
    getAlerts: builder.query<Alert[], { unreadOnly?: boolean } | void>({
      query: (params) => {
        const unreadOnly = params && 'unreadOnly' in params && params.unreadOnly;
        return `/alerts${unreadOnly ? '?unreadOnly=true' : ''}`;
      },
      providesTags: ['Alerts'],
    }),
    markAlertRead: builder.mutation<void, string>({
      query: (id) => ({ url: `/alerts/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Alerts', 'Dashboard'],
    }),
    markAllAlertsRead: builder.mutation<void, void>({
      query: () => ({ url: '/alerts/read-all', method: 'PATCH' }),
      invalidatesTags: ['Alerts', 'Dashboard'],
    }),

    // Medications
    getMedications: builder.query<MedicationReminder[], void>({
      query: () => '/medications',
      providesTags: ['Medications'],
    }),
    createMedication: builder.mutation<MedicationReminder, { medicationName: string; dosage: string; schedule: string }>({
      query: (body) => ({ url: '/medications', method: 'POST', body }),
      invalidatesTags: ['Medications', 'Dashboard'],
    }),
    updateMedication: builder.mutation<MedicationReminder, { id: string; isActive?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/medications/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Medications'],
    }),
    deleteMedication: builder.mutation<void, string>({
      query: (id) => ({ url: `/medications/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Medications', 'Dashboard'],
    }),
    getMedicationToday: builder.query<MedicationTodayItem[], void>({
      query: () => '/medications/today',
      providesTags: ['Medications'],
    }),
    getMedicationAdherence: builder.query<MedicationAdherence, number | void>({
      query: (days = 7) => `/medications/adherence?days=${days}`,
      providesTags: ['Medications'],
    }),
    logMedicationDose: builder.mutation<
      { id: string; status: string },
      { medicationId: string; scheduledTime: string; status: 'TAKEN' | 'MISSED' }
    >({
      query: ({ medicationId, ...body }) => ({
        url: `/medications/${medicationId}/log`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Medications', 'Dashboard', 'Timeline'],
    }),

    // Health goals
    getGoals: builder.query<HealthGoal[], void>({
      query: () => '/goals',
      providesTags: ['Goals'],
    }),
    seedGoals: builder.mutation<HealthGoal[], void>({
      query: () => ({ url: '/goals/seed', method: 'POST' }),
      invalidatesTags: ['Goals'],
    }),
    createGoal: builder.mutation<HealthGoal, { title: string; description?: string; targetCount?: number; unit?: string }>({
      query: (body) => ({ url: '/goals', method: 'POST', body }),
      invalidatesTags: ['Goals'],
    }),
    incrementGoal: builder.mutation<HealthGoal, string>({
      query: (id) => ({ url: `/goals/${id}/increment`, method: 'PATCH' }),
      invalidatesTags: ['Goals'],
    }),
    deleteGoal: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/goals/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Goals'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useGetDashboardStatsQuery,
  useGetActivityQuery,
  useGetTimelineQuery,
  useGetHealthReportQuery,
  useGetWeeklyInsightQuery,
  useGetSymptomsQuery,
  useCreateSymptomMutation,
  useUpdateSymptomMutation,
  useDeleteSymptomMutation,
  useGetVitalsQuery,
  useGetVitalChartQuery,
  useCreateVitalMutation,
  useUpdateVitalMutation,
  useDeleteVitalMutation,
  useImportVitalsMutation,
  useGetHealthDevicesQuery,
  useAnalyzeSymptomMutation,
  useGetAiHistoryQuery,
  useGetChatHistoryQuery,
  useSendChatMessageMutation,
  useClearChatMutation,
  useGetAlertsQuery,
  useMarkAlertReadMutation,
  useMarkAllAlertsReadMutation,
  useGetMedicationsQuery,
  useCreateMedicationMutation,
  useUpdateMedicationMutation,
  useDeleteMedicationMutation,
  useGetMedicationTodayQuery,
  useGetMedicationAdherenceQuery,
  useLogMedicationDoseMutation,
  useGetGoalsQuery,
  useSeedGoalsMutation,
  useCreateGoalMutation,
  useIncrementGoalMutation,
  useDeleteGoalMutation,
} = baseApi;

export const useGetSymptomTrendsQuery = baseApi.endpoints.getSymptomTrends.useQuery;
