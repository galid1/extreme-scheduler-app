import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotificationStore } from '@/src/store/useNotificationStore';
import { NotificationDto } from '@/src/types/api';

type TabType = 'unread' | 'read';

export default function NotificationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('unread');

  const {
    unreadNotifications,
    readNotifications,
    unreadCount,
    isLoadingUnread,
    isLoadingRead,
    isRefreshingUnread,
    isRefreshingRead,
    fetchUnreadNotifications,
    fetchReadNotifications,
    markAsRead,
  } = useNotificationStore();

  // 초기 데이터 로드
  useEffect(() => {
    fetchUnreadNotifications(true);
  }, []);

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    if (activeTab === 'read' && readNotifications.length === 0) {
      fetchReadNotifications(true);
    }
  }, [activeTab]);

  const handleRefresh = () => {
    if (activeTab === 'unread') {
      fetchUnreadNotifications(true);
    } else {
      fetchReadNotifications(true);
    }
  };

  const handleLoadMore = () => {
    if (activeTab === 'unread') {
      fetchUnreadNotifications(false);
    } else {
      fetchReadNotifications(false);
    }
  };

  const handleNotificationPress = async (notification: NotificationDto) => {
    // 안읽은 알림인 경우 읽음 처리
    if (!notification.isRead) {
      try {
        await markAsRead(notification.notificationId);
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }

    // TODO: 알림 데이터에 따라 특정 화면으로 이동
    // const data = notification.data;
    // if (data.type === 'training_schedule') {
    //   router.push(`/training-schedule/${data.scheduleId}`);
    // }
  };

  const renderNotificationItem = ({ item }: { item: NotificationDto }) => {
    const isUnread = !item.isRead;
    const createdDate = new Date(item.createdAt);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));

    let timeText = '';
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60));
      timeText = `${diffInMinutes}분 전`;
    } else if (diffInHours < 24) {
      timeText = `${diffInHours}시간 전`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      timeText = `${diffInDays}일 전`;
    }

    return (
      <TouchableOpacity
        style={[styles.notificationItem, isUnread && styles.unreadItem]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={[styles.notificationTitle, isUnread && styles.unreadText]}>
              {item.title}
            </Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notificationBody} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.notificationTime}>{timeText}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => {
    const isLoading = activeTab === 'unread' ? isRefreshingUnread : isRefreshingRead;

    if (isLoading) {
      return null;
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
        <Text style={styles.emptyText}>
          {activeTab === 'unread' ? '새로운 알림이 없습니다' : '읽은 알림이 없습니다'}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    const isLoading = activeTab === 'unread' ? isLoadingUnread : isLoadingRead;

    if (!isLoading) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  };

  const currentNotifications = activeTab === 'unread' ? unreadNotifications : readNotifications;
  const isRefreshing = activeTab === 'unread' ? isRefreshingUnread : isRefreshingRead;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>알림</Text>
        <View style={styles.headerRight}>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* 탭 토글 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'unread' && styles.activeTab]}
          onPress={() => setActiveTab('unread')}
        >
          <Text style={[styles.tabText, activeTab === 'unread' && styles.activeTabText]}>
            안읽음 {unreadCount > 0 && `(${unreadCount})`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'read' && styles.activeTab]}
          onPress={() => setActiveTab('read')}
        >
          <Text style={[styles.tabText, activeTab === 'read' && styles.activeTabText]}>
            읽음
          </Text>
        </TouchableOpacity>
      </View>

      {/* 알림 리스트 */}
      <FlatList
        data={currentNotifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.notificationId.toString()}
        contentContainerStyle={currentNotifications.length === 0 ? styles.emptyListContent : styles.listContent}
        ListEmptyComponent={renderEmptyList}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  notificationItem: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  unreadItem: {
    backgroundColor: '#F0F9FF',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  unreadText: {
    fontWeight: '700',
    color: '#1F2937',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: 8,
  },
  notificationBody: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
