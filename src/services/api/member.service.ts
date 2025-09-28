/**
 * Member Service
 * 회원 관련 API 호출 서비스
 */

import apiClient from './client';
import {
  TrainerSearchResponse,
  CreateAssignmentRequest,
  AssignmentRequest,
  PageResponse,
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

  /**
   * 트레이너 배정 요청 (회원용)
   * @param trainerAccountId 트레이너 계정 ID
   */
  async requestTrainerAssignment(trainerAccountId: number): Promise<AssignmentRequest> {
    const request: CreateAssignmentRequest = {
      trainerAccountId,
    };
    return apiClient.post<AssignmentRequest>(
      '/api/v1/members/trainer-assignment-requests',
      request
    );
  }

  /**
   * 내 배정 요청 목록 조회 (회원용)
   * @param page 페이지 번호 (0부터 시작)
   * @param size 페이지 크기
   */
  async getMyAssignmentRequests(
    page: number = 0,
    size: number = 10
  ): Promise<PageResponse<AssignmentRequest>> {
    return apiClient.get<PageResponse<AssignmentRequest>>(
      `/api/v1/members/trainer-assignment-requests?page=${page}&size=${size}`
    );
  }
}

export const memberService = new MemberService();
export default memberService;
