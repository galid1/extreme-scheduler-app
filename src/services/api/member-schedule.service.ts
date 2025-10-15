/**
 * Member Schedule Service
 * 회원 스케줄 관련 API 호출 서비스
 */

import apiClient from './client';
import {
  GetFreeTimeScheduleResponse,
  RegisterScheduleRequest,
  UnRegisterMemberFreeTimeScheduleRequest,
  GetFixedAutoSchedulingResultResponse,
  WeeklyScheduleRegistrationStatusResponse,
  RegisterMemberFreeTimeScheduleResponse,
  ScheduleModificationAvailabilityResponse,
  CancelAutoSchedulingApiResponse,
  GetCancelRequestsResponse,
  TrainerAutoSchedulingStatusResponse
} from '../../types/api';

class MemberScheduleService {
  /**
   * 회원 스케줄 조회
   */
  async getFreeSchedule(): Promise<GetFreeTimeScheduleResponse> {
    return apiClient.get<GetFreeTimeScheduleResponse>('/api/v1/members/schedules');
  }

  /**
   * 회원 스케줄 상태를 UNREGISTER로 변경
   */
  async unRegisterWeeklyFreeTimeSchedule(request: UnRegisterMemberFreeTimeScheduleRequest): Promise<void> {
    await apiClient.post('/api/v1/members/schedules/unregister', request);
  }

  /**
   * 회원 스케줄 등록 (정기 + 일회성 통합)
   */
  async registerSchedule(request: RegisterScheduleRequest): Promise<RegisterMemberFreeTimeScheduleResponse> {
    return apiClient.post<RegisterMemberFreeTimeScheduleResponse>('/api/v1/members/schedules/register', request);
  }

  /**
   * 자동 스케줄링 결과 조회
   */
  async getFixedAutoSchedulingResult(
    targetYear: number,
    targetWeekOfYear: number
  ): Promise<GetFixedAutoSchedulingResultResponse> {
    const queryParams = new URLSearchParams({
      targetYear: targetYear.toString(),
      targetWeekOfYear: targetWeekOfYear.toString()
    });
    return apiClient.get<GetFixedAutoSchedulingResultResponse>(
      `/api/v1/members/schedules/auto-scheduling-result?${queryParams}`
    );
  }

  /**
   * 주간 일정 등록 상태 확인
   */
  async checkWeeklyScheduleRegistration(
    targetYear: number,
    targetWeekOfYear: number
  ): Promise<WeeklyScheduleRegistrationStatusResponse> {
    const queryParams = new URLSearchParams({
      targetYear: targetYear.toString(),
      targetWeekOfYear: targetWeekOfYear.toString()
    });
    return apiClient.get<WeeklyScheduleRegistrationStatusResponse>(
      `/api/v1/members/schedules/registration-status?${queryParams}`
    );
  }

  /**
   * 일정 수정 가능 여부 확인
   */
  async checkScheduleModificationAvailability(
    targetYear: number,
    targetWeekOfYear: number
  ): Promise<ScheduleModificationAvailabilityResponse> {
    const queryParams = new URLSearchParams({
      targetYear: targetYear.toString(),
      targetWeekOfYear: targetWeekOfYear.toString()
    });
    return apiClient.get<ScheduleModificationAvailabilityResponse>(
      `/api/v1/members/schedules/modification-availability?${queryParams}`
    );
  }

  /**
   * 자동 스케줄링 취소 요청
   */
  async requestCancelAutoScheduling(
    autoSchedulingResultId: number
  ): Promise<CancelAutoSchedulingApiResponse> {
    return apiClient.delete<CancelAutoSchedulingApiResponse>(
      `/api/v1/members/schedules/auto-scheduling/${autoSchedulingResultId}/requests`
    );
  }

  /**
   * 취소 요청 목록 조회
   */
  async getCancelRequests(
    year: number,
    weekOfYear: number
  ): Promise<GetCancelRequestsResponse> {
    const queryParams = new URLSearchParams({
      year: year.toString(),
      weekOfYear: weekOfYear.toString()
    });
    return apiClient.get<GetCancelRequestsResponse>(
      `/api/v1/members/schedules/auto-scheduling/cancel-requests?${queryParams}`
    );
  }

  /**
   * 트레이너의 자동 스케줄링 완료 여부 확인
   */
  async checkTrainerAutoSchedulingStatus(
    targetYear: number,
    targetWeekOfYear: number
  ): Promise<TrainerAutoSchedulingStatusResponse> {
    const queryParams = new URLSearchParams({
      targetYear: targetYear.toString(),
      targetWeekOfYear: targetWeekOfYear.toString()
    });
    return apiClient.get<TrainerAutoSchedulingStatusResponse>(
      `/api/v1/members/schedules/trainer-auto-scheduling-status?${queryParams}`
    );
  }
}

export const memberScheduleService = new MemberScheduleService();
export default memberScheduleService;
