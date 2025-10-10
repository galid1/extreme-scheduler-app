import {
    CreateTrainerNoticeApiRequest,
    TrainerNoticeResponse,
    TrainerNoticeListResponse,
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
        const response = await apiClient.post<{ data: TrainerNoticeResponse }>(
            '/api/v1/trainers/notices',
            request
        );
        return response.data;
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

        const response = await apiClient.get<{ data: TrainerNoticeListResponse }>(
            `/api/v1/trainers/notices?${queryParams}`
        );
        return response.data;
    }

    /**
     * 공지사항 상세 조회
     */
    async getNoticeDetail(noticeId: number): Promise<TrainerNoticeResponse> {
        const response = await apiClient.get<{ data: TrainerNoticeResponse }>(
            `/api/v1/trainers/notices/${noticeId}`
        );
        return response.data;
    }

    /**
     * 공지사항 수정 (제목, 내용만)
     */
    async updateNotice(
        noticeId: number,
        request: UpdateTrainerNoticeApiRequest
    ): Promise<TrainerNoticeResponse> {
        const response = await apiClient.put<{ data: TrainerNoticeResponse }>(
            `/api/v1/trainers/notices/${noticeId}`,
            request
        );
        return response.data;
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

        const response = await apiClient.patch<{ data: TrainerNoticeResponse }>(
            `/api/v1/trainers/notices/${noticeId}/fixed?${queryParams}`
        );
        return response.data;
    }

    /**
     * 공지사항 삭제
     */
    async deleteNotice(noticeId: number): Promise<void> {
        await apiClient.delete(`/api/v1/trainers/notices/${noticeId}`);
    }
}

export const trainerNoticeService = new TrainerNoticeService();
