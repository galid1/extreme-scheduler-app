import {
    CreateTrainerNoticeApiRequest,
    TrainerNoticeListResponse,
    TrainerNoticeResponse,
    UpdateTrainerNoticeApiRequest,
} from '@/src/types/api';
import apiClient from './client';

class TrainerNoticeService {
    /**
     * 공지사항 생성
     */
    async createNotice(
        request: CreateTrainerNoticeApiRequest
    ): Promise<TrainerNoticeResponse> {
        return apiClient.post<TrainerNoticeResponse>(
            '/api/v1/trainers/notices',
            request
        );
    }

    /**
     * 공지사항 목록 조회 (페이지네이션 + fixed 필터)
     */
    async getNotices(
        fixed?: boolean,
        page: number = 0,
        size: number = 20
    ): Promise<TrainerNoticeListResponse> {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            size: size.toString()
        });

        if (fixed !== undefined) {
            queryParams.append('fixed', fixed.toString());
        }

        return apiClient.get<TrainerNoticeListResponse>(
            `/api/v1/trainers/notices?${queryParams}`
        );
    }

    /**
     * 공지사항 상세 조회
     */
    async getNoticeDetail(noticeId: number): Promise<TrainerNoticeResponse> {
        return apiClient.get<TrainerNoticeResponse>(
            `/api/v1/trainers/notices/${noticeId}`
        );
    }

    /**
     * 공지사항 수정 (제목, 내용만)
     */
    async updateNotice(
        noticeId: number,
        request: UpdateTrainerNoticeApiRequest
    ): Promise<TrainerNoticeResponse> {
        return apiClient.put<TrainerNoticeResponse>(
            `/api/v1/trainers/notices/${noticeId}`,
            request
        );
    }

    /**
     * 공지사항 고정/해제
     */
    async toggleNoticeFixed(
        noticeId: number,
        fixed: boolean
    ): Promise<TrainerNoticeResponse> {
        const queryParams = new URLSearchParams({
            fixed: fixed.toString()
        });

        return apiClient.patch<TrainerNoticeResponse>(
            `/api/v1/trainers/notices/${noticeId}/fixed?${queryParams}`
        );
    }

    /**
     * 공지사항 삭제
     */
    async deleteNotice(noticeId: number): Promise<void> {
        return apiClient.delete(`/api/v1/trainers/notices/${noticeId}`);
    }
}

export const trainerNoticeService = new TrainerNoticeService();
