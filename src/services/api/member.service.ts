/**
 * Member Service
 * 회원 관련 API 호출 서비스
 */

import apiClient from './client';
import { config } from '../../config/environment';
import { useAuthStore } from '../../store/useAuthStore';
import {
    AssignedTrainerResponse,
    CreateAssignmentRequest,
    TrainerSearchResponse,
    MemberTrainerAssignmentRequestDto,
    CancelTrainerAssignmentApiResponse,
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
   * 배정된 트레이너 정보 조회
   */
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

  /**
   * 내 트레이너 배정 요청 목록 조회
   * 서버가 List를 직접 반환 (Response로 감싸지 않음)
   */
  async getMyTrainerAssignmentRequests(): Promise<MemberTrainerAssignmentRequestDto[]> {
    const authToken = useAuthStore.getState().authToken;
    const url = `${config.API_URL}/api/v1/members/trainer-assignment-requests`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.message || `${response.status} ${response.statusText}`;
      throw new Error(`트레이너 배정 요청 목록 조회 실패: ${errorMessage}`);
    }

    // 서버가 List를 직접 반환
    return await response.json();
  }

  /**
   * 트레이너 배정 요청 취소
   * @param requestId 요청 ID
   */
  async cancelTrainerAssignmentRequest(requestId: number): Promise<CancelTrainerAssignmentApiResponse> {
    return apiClient.delete<CancelTrainerAssignmentApiResponse>(
      `/api/v1/members/trainer-assignment-requests/${requestId}`
    );
  }
}

export const memberService = new MemberService();
export default memberService;
