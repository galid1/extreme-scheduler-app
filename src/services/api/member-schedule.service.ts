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
  WeeklyScheduleRegistrationStatusResponse
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
  async registerSchedule(request: RegisterScheduleRequest): Promise<void> {
    await apiClient.post('/api/v1/members/schedules/register', request);
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
}

export const memberScheduleService = new MemberScheduleService();
export default memberScheduleService;
