/**
 * Member Service
 * 회원 관련 API 호출 서비스
 */

import apiClient from './client';
import {
    AssignedTrainerResponse,
    CreateAssignmentRequest,
    TrainerSearchResponse,
} from '../../types/api';

class MemberService {
  /**
   * 트레이너 검색 (회원용)
   * @param phoneNumber 트레이너 전화번호
   */
  async searchTrainer(phoneNumber: string): Promise<TrainerSearchResponse> {
    return apiClient.get<TrainerSearchResponse>(
      `/api/v1/members/trainer-search?phoneNumber=${encodeURIComponent(phoneNumber)}`
    );
  }

  async getAssignedTrainer(): Promise<AssignedTrainerResponse | null> {
    return apiClient.get<AssignedTrainerResponse | null>(
      `/api/v1/members/assigned-trainer`
    );
  }

  /**
   * 트레이너 배정 요청 (회원용)
   * @param trainerAccountId 트레이너 계정 ID
   */
  async requestTrainerAssignment(trainerAccountId: number): Promise<void> {
    const request: CreateAssignmentRequest = {
      trainerAccountId,
    };
    return apiClient.post<void>(
      '/api/v1/members/trainer-assignment-requests',
      request
    );
  }
}

export const memberService = new MemberService();
export default memberService;
