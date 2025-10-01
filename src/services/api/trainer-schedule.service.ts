/**
 * Trainer Schedule Service
 * 트레이너 스케줄 관련 API 호출 서비스
 */

import apiClient from './client';
import {
  RegisterScheduleRequest,
  UpdateScheduleTimeRequest,
  AutoSchedulingRequest,
  GetFreeTimeScheduleResponse,
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
  async executeAutoScheduling(request: AutoSchedulingRequest): Promise<void> {
    await apiClient.post('/api/v1/trainers/schedules/auto-scheduling', request);
  }
}

export const trainerScheduleService = new TrainerScheduleService();
export default trainerScheduleService;
