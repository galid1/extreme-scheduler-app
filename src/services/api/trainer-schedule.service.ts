/**
 * Trainer Schedule Service
 * 트레이너 스케줄 관련 API 호출 서비스
 */

import apiClient from './client';
import {
    RegisterScheduleRequest,
    AutoSchedulingRequest,
    GetFreeTimeScheduleResponse,
    TrainerWeeklyScheduleRegistrationStatusResponse,
    GetAutoSchedulingResultApiResponse,
    AutoSchedulingResponse,
    CancelAutoSchedulingResultApiResponse,
} from '../../types/api';

class TrainerScheduleService {
  /**
   * 트레이너 운영 가능 일정 조회
   */
  async getFreeSchedule(): Promise<GetFreeTimeScheduleResponse> {
    return apiClient.get<GetFreeTimeScheduleResponse>('/api/v1/trainers/schedules/free');
  }

  /**
   * 트레이너 스케줄 등록 (정기 + 일회성 통합)
   */
  async registerSchedule(request: RegisterScheduleRequest): Promise<void> {
    await apiClient.post('/api/v1/trainers/schedules', request);
  }

  /**
   * 자동 스케줄링 실행
   */
  async executeAutoScheduling(request: AutoSchedulingRequest): Promise<AutoSchedulingResponse> {
    return apiClient.post<AutoSchedulingResponse>('/api/v1/trainers/schedules/auto-scheduling', request);
  }

  /**
   * 특정 주차의 스케줄 등록 상태 확인
   */
  async checkWeeklyScheduleRegistration(
    targetYear: number,
    targetWeekOfYear: number
  ): Promise<TrainerWeeklyScheduleRegistrationStatusResponse> {
    return apiClient.get<TrainerWeeklyScheduleRegistrationStatusResponse>(
      `/api/v1/trainers/schedules/registration-status?targetYear=${targetYear}&targetWeekOfYear=${targetWeekOfYear}`
    );
  }

  /**
   * 자동 스케줄링 결과 조회
   * @param year 조회할 연도
   * @param weekOfYear 조회할 주차
   */
  async getAutoSchedulingResult(
    year: number,
    weekOfYear: number
  ): Promise<GetAutoSchedulingResultApiResponse> {
    return apiClient.get<GetAutoSchedulingResultApiResponse>(
      `/api/v1/trainers/schedules/auto-scheduling?year=${year}&weekOfYear=${weekOfYear}`
    );
  }

  /**
   * 자동 스케줄링 결과 삭제
   * @param year 삭제할 연도
   * @param weekOfYear 삭제할 주차
   */
  async cancelAutoSchedulingResult(
    year: number,
    weekOfYear: number
  ): Promise<CancelAutoSchedulingResultApiResponse> {
    return apiClient.delete<CancelAutoSchedulingResultApiResponse>(
      `/api/v1/trainers/schedules/auto-scheduling?year=${year}&weekOfYear=${weekOfYear}`
    );
  }

  /**
   * 자동 스케줄링 결과 확정
   * @param year 확정할 연도
   * @param weekOfYear 확정할 주차
   */
  async fixAutoScheduling(
    year: number,
    weekOfYear: number
  ): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>(
      '/api/v1/trainers/schedules/auto-scheduling/fix',
      { year, weekOfYear }
    );
  }

}

export const trainerScheduleService = new TrainerScheduleService();
export default trainerScheduleService;
