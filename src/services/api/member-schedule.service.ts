/**
 * Member Schedule Service
 * 회원 스케줄 관련 API 호출 서비스
 */

import apiClient from './client';
import {
  RegisterScheduleRequest,
} from '../../types/api';

class MemberScheduleService {
  /**
   * 회원 스케줄 상태를 READY로 변경
   */
  async setScheduleReady(): Promise<void> {
    await apiClient.post('/api/v1/members/schedules/ready');
  }

  /**
   * 회원 스케줄 상태를 UNREADY로 변경
   */
  async setScheduleUnready(): Promise<void> {
    await apiClient.post('/api/v1/members/schedules/unready');
  }

  /**
   * 회원 스케줄 등록 (정기 + 일회성 통합)
   */
  async registerSchedule(request: RegisterScheduleRequest): Promise<void> {
    await apiClient.post('/api/v1/members/schedules/register', request);
  }
}

export const memberScheduleService = new MemberScheduleService();
export default memberScheduleService;