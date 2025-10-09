import React from 'react';
import {Text, StyleSheet, View} from 'react-native';
import {
    getNextWeekYearAndWeek,
    getNextWeekDateRange,
    formatDateMMDD,
    getCurrentWeekDateRange
} from '@/src/utils/dateUtils';

interface WeekInfoProps {
    style?: any;
    nextWeek: boolean;
}

export default function WeekInfo({
                                     style,
                                     nextWeek
                                 }: WeekInfoProps) {
    const {targetWeekOfYear} = getNextWeekYearAndWeek();

    const weekOfYear = nextWeek ? targetWeekOfYear : targetWeekOfYear - 1;
    const {startDate, endDate} = nextWeek ? getNextWeekDateRange() : getCurrentWeekDateRange();
    const duration = `(${formatDateMMDD(startDate)} ~ ${formatDateMMDD(endDate)})`;
    const weekInfo = `${weekOfYear}주차 `;

    return <View style={styles.container}>
        <Text style={[styles.weekInfoText, style]}>{weekInfo}</Text>
        <Text style={[styles.durationInfoText, style]}>{duration}</Text>
    </View>
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
    },
    weekInfoText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6B7280',
    },
    durationInfoText: {
        fontSize: 14,
        color: '#6B7280',
    }
});
