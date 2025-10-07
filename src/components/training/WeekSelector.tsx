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

    const handleViewSchedule = (weekNumber: number) => {
        onViewSchedule(weekNumber);
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
                    <TouchableOpacity
                        key={week}
                        style={[
                            styles.weekCard,
                            { width: WEEK_CARD_WIDTH },
                            index === 1 && styles.weekCardNextWeek
                        ]}
                        onPress={() => handleViewSchedule(week)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.weekCardContent}>
                            <View style={styles.weekCardHeader}>
                                <View style={styles.weekCardTitleRow}>
                                    <Text style={[
                                        styles.weekCardLabel,
                                        index === 1 && styles.weekCardLabelNextWeek
                                    ]}>
                                        {index === 0 ? '이번 주' : '다음 주'}
                                    </Text>
                                </View>
                                <Ionicons
                                    name="chevron-forward"
                                    size={16}
                                    color={index === 1 ? '#F59E0B' : '#3B82F6'}
                                />
                            </View>
                            <WeekInfo style={styles.weekCardInfo} nextWeek={index === 1}/>
                        </View>
                    </TouchableOpacity>
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
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginRight: 12,
        borderWidth: 2,
        borderColor: '#E0E7FF',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    weekCardNextWeek: {
        backgroundColor: '#FFFFFF',
        borderColor: '#FCD34D',
        shadowColor: '#F59E0B',
    },
    weekCardContent: {
        gap: 12,
    },
    weekCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    weekCardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    weekCardLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
    },
    weekCardLabelNextWeek: {
        color: '#92400E',
    },
    weekCardInfo: {
        fontSize: 12,
        color: '#6B7280',
    },
    weekIndicatorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
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
});
