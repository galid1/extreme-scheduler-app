import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    NativeSyntheticEvent,
    NativeScrollEvent
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WeekInfo from '@/src/components/WeekInfo';
import { getCurrentWeek } from '@/src/utils/dateUtils';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DASHBOARD_MARGIN = 40;
const DASHBOARD_PADDING = 20;
const CARD_CONTAINER_WIDTH = SCREEN_WIDTH - DASHBOARD_MARGIN - (DASHBOARD_PADDING * 2);
const CARD_GAP = 12;
const WEEK_CARD_WIDTH = CARD_CONTAINER_WIDTH - CARD_GAP;

interface WeekSelectorProps {
    onViewSchedule: (weekNumber: number) => void;
}

export default function WeekSelector({ onViewSchedule }: WeekSelectorProps) {
    const realCurrentWeek = getCurrentWeek();
    const availableWeeks = [realCurrentWeek, realCurrentWeek + 1];
    const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
    const weekScrollRef = useRef<ScrollView>(null);

    const handleViewSchedule = () => {
        const selectedWeek = availableWeeks[selectedWeekIndex];
        onViewSchedule(selectedWeek);
    };

    return (
        <>
            {/* Week Selector */}
            <ScrollView
                ref={weekScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
                    const offsetX = event.nativeEvent.contentOffset.x;
                    const pageIndex = Math.round(offsetX / CARD_CONTAINER_WIDTH);
                    setSelectedWeekIndex(pageIndex);
                }}
                scrollEventThrottle={16}
                style={styles.weekSelector}
                snapToInterval={CARD_CONTAINER_WIDTH}
                decelerationRate="fast"
            >
                {availableWeeks.map((week, index) => (
                    <View key={week} style={[
                        styles.weekCard,
                        { width: WEEK_CARD_WIDTH },
                        index === 1 && styles.weekCardNextWeek
                    ]}>
                        <View style={styles.weekCardHeader}>
                            <Text style={[
                                styles.weekCardLabel,
                                index === 1 && styles.weekCardLabelNextWeek
                            ]}>
                                {index === 0 ? '이번 주' : '다음 주'}
                            </Text>
                        </View>
                        <WeekInfo style={styles.weekCardInfo} nextWeek={index === 1}/>
                    </View>
                ))}
            </ScrollView>

            {/* Page Indicator */}
            <View style={styles.weekIndicatorContainer}>
                {availableWeeks.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.weekIndicatorDot,
                            selectedWeekIndex === index && styles.weekIndicatorDotActive
                        ]}
                    />
                ))}
            </View>

            {/* Single Action Button */}
            <TouchableOpacity
                style={styles.viewScheduleButton}
                onPress={handleViewSchedule}
            >
                <Ionicons name="calendar-sharp" size={20} color="white"/>
                <Text style={styles.viewScheduleButtonText}>일정 보기</Text>
            </TouchableOpacity>
        </>
    );
}

const styles = StyleSheet.create({
    weekSelector: {
        marginTop: 16,
        marginBottom: 8,
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    weekCard: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 16,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    weekCardNextWeek: {
        backgroundColor: '#FEF3C7',
        borderColor: '#FCD34D',
    },
    weekCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    weekCardLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#3B82F6',
    },
    weekCardLabelNextWeek: {
        color: '#F59E0B',
    },
    weekCardInfo: {
        fontSize: 13,
        color: '#6B7280',
    },
    weekIndicatorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
    },
    weekIndicatorDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#D1D5DB',
    },
    weekIndicatorDotActive: {
        width: 20,
        backgroundColor: '#3B82F6',
    },
    viewScheduleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 12,
        gap: 8,
    },
    viewScheduleButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
});
