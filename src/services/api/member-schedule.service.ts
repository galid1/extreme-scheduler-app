/**
 * Member Schedule Service
 * 회원 스케줄 관련 API 호출 서비스
 */

import apiClient from './client';
import {
  GetFreeTimeScheduleResponse,
  RegisterScheduleRequest,
  UnRegisterMemberFreeTimeScheduleRequest,
  GetFixedAutoSchedulingResultResponse
} from '../../types/api';

class MemberScheduleService {
  /**
   * 회원 스케줄 조회
   */
  async getSchedule(): Promise<GetFreeTimeScheduleResponse> {
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
   * 자동 스케줄링 결과가 있는지 확인 (빈 리스트 여부)
   */
  async hasFixedAutoSchedulingResult(
    targetYear: number,
    targetWeekOfYear: number
  ): Promise<boolean> {
    const response = await this.getFixedAutoSchedulingResult(targetYear, targetWeekOfYear);
    return response.data && response.data.length > 0;
  }
}

export const memberScheduleService = new MemberScheduleService();
export default memberScheduleService;
