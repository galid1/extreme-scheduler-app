/**
 * Trainer Service
 * 트레이너 관련 API 호출 서비스
 */

import apiClient from './client';
import {
  TrainerAssignmentRequestListResponse,
  RejectAssignmentRequest,
  AddMemberToTrainerRequest,
  GetAssignedMembersResponse,
  GetAssignedMembersWithSchedulesResponse,
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
    status?: RequestStatus
  ): Promise<TrainerAssignmentRequestListResponse> {
    const params = status ? { status } : {};
    return apiClient.get<TrainerAssignmentRequestListResponse>(
      `/api/v1/trainers/assignment-requests`,
      { params }
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
   * 트레이너에게 배정된 회원 목록 조회 (스케줄 포함)
   * @param year 조회할 연도
   * @param weekOfYear 조회할 주차
   */
  async getAssignedMembers(
    year: number,
    weekOfYear: number
  ): Promise<GetAssignedMembersWithSchedulesResponse> {
    return apiClient.get<GetAssignedMembersWithSchedulesResponse>(
      `/api/v1/trainers/assigned-members?year=${year}&weekOfYear=${weekOfYear}`
    );
  }
}

export const trainerService = new TrainerService();
export default trainerService;
