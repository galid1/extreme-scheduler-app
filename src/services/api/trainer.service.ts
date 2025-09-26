/**
 * Trainer Service
 * 트레이너 관련 API 호출 서비스
 */

import apiClient from './client';
import {
  AssignmentRequest,
  RejectAssignmentRequest,
  AddMemberToTrainerRequest,
  PageResponse,
  RequestStatus,
} from '../../types/api';

class TrainerService {
  /**
   * 트레이너에게 온 배정 요청 목록 조회
   * @param status 요청 상태 필터 (PENDING, ACCEPTED, REJECTED)
   * @param page 페이지 번호
   * @param size 페이지 크기
   */
  async getAssignmentRequests(
    status?: RequestStatus,
    page: number = 0,
    size: number = 10
  ): Promise<PageResponse<AssignmentRequest>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (status) params.append('status', status);

    return apiClient.get<PageResponse<AssignmentRequest>>(
      `/api/v1/trainers/assignment-requests?${params.toString()}`
    );
  }

  /**
   * 배정 요청 수락
   * @param requestId 요청 ID
   */
  async acceptAssignmentRequest(requestId: number): Promise<void> {
    await apiClient.put(`/api/v1/trainers/assignment-requests/${requestId}/accept`);
  }

  /**
   * 배정 요청 거절
   * @param requestId 요청 ID
   * @param rejectReason 거절 사유
   */
  async rejectAssignmentRequest(
    requestId: number,
    rejectReason: string
  ): Promise<void> {
    const request: RejectAssignmentRequest = {
      rejectReason,
    };
    await apiClient.put(
      `/api/v1/trainers/assignment-requests/${requestId}/reject`,
      request
    );
  }

  /**
   * 회원을 트레이너에게 직접 배정
   * @param memberAccountId 회원 계정 ID
   */
  async addMemberDirectly(memberAccountId: number): Promise<void> {
    const request: AddMemberToTrainerRequest = {
      memberAccountId,
    };
    await apiClient.post('/api/v1/trainers/members', request);
  }
}

export const trainerService = new TrainerService();
export default trainerService;