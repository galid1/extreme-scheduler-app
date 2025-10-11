import {
    MemberTrainerNoticeListResponse,
    TrainerNoticeResponse,
} from '@/src/types/api';
import apiClient from './client';

class MemberTrainerNoticeService {
    /**
     * 담당 트레이너의 공지사항 목록 조회 (회원용)
     */
    async getTrainerNotices(
        fixed?: boolean,
        page: number = 0,
        size: number = 20
    ): Promise<MemberTrainerNoticeListResponse> {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            size: size.toString()
        });

        if (fixed !== undefined) {
            queryParams.append('fixed', fixed.toString());
        }

        return apiClient.get<MemberTrainerNoticeListResponse>(
            `/api/v1/members/trainer/notices?${queryParams}`
        );
    }

    /**
     * 담당 트레이너의 공지사항 상세 조회 (회원용)
     */
    async getTrainerNoticeDetail(noticeId: number): Promise<TrainerNoticeResponse> {
        return apiClient.get<TrainerNoticeResponse>(
            `/api/v1/members/trainer/notices/${noticeId}`
        );
    }
}

export const memberTrainerNoticeService = new MemberTrainerNoticeService();
