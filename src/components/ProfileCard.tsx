import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AccountType } from '@/src/types/enums';

interface ProfileCardProps {
  name: string;
  profileImageUrl?: string;
  phoneNumber?: string;
  accountType?: AccountType;
  experience?: string;
  specialties?: string[];
  rating?: number;
  backgroundColor?: string;
  textColor?: string;
}

export default function ProfileCard({
  name,
  profileImageUrl,
  phoneNumber,
  accountType,
  experience,
  specialties,
  rating,
  backgroundColor = '#3B82F6',
  textColor = 'white',
}: ProfileCardProps) {
  const isTrainer = accountType === AccountType.TRAINER || experience || specialties || rating;
  console.log(`AAAAAAAAAAAAAAA: ${profileImageUrl}`)

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.profileHeader}>
        <View style={styles.profileIcon}>
          {profileImageUrl ? (
            <Image
              source={{ uri: profileImageUrl }}
              style={styles.profileImage}
            />
          ) : (
            <Ionicons name="person-circle" size={80} color={textColor} />
          )}
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.userName, { color: textColor }]}>{name}</Text>
          {phoneNumber && (
            <Text style={[styles.userPhone, { color: `${textColor}CC` }]}>
              {phoneNumber}
            </Text>
          )}
          {accountType && (
            <View style={styles.accountTypeBadge}>
              <Text style={[styles.accountTypeText, { color: textColor }]}>
                {accountType === AccountType.TRAINER ? '트레이너' : '회원'}
              </Text>
            </View>
          )}
          {rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={[styles.ratingText, { color: textColor }]}>{rating}</Text>
            </View>
          )}
        </View>
      </View>

      {isTrainer && experience && (
        <View style={styles.detailSection}>
          <Text style={[styles.detailLabel, { color: `${textColor}CC` }]}>경력</Text>
          <Text style={[styles.detailValue, { color: textColor }]}>{experience}</Text>
        </View>
      )}

      {isTrainer && specialties && specialties.length > 0 && (
        <View style={styles.specialtiesSection}>
          <Text style={[styles.detailLabel, { color: `${textColor}CC` }]}>전문 분야</Text>
          <View style={styles.specialtiesList}>
            {specialties.map((specialty, index) => (
              <View
                key={index}
                style={[styles.specialtyTag, { backgroundColor: `${textColor}1A` }]}
              >
                <Text style={[styles.specialtyText, { color: textColor }]}>
                  {specialty}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileIcon: {
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    marginBottom: 8,
  },
  accountTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: 4,
  },
  accountTypeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
  },
  specialtiesSection: {
    marginTop: 8,
  },
  specialtiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  specialtyTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  specialtyText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
