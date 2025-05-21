import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useCart } from '@/hooks/useCart';
import { router } from 'expo-router';

function Badge({ count, color }: { count: number; color: string }) {
  if (count === 0) return null;
  return (
    <View
      style={{
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: color,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
}

export function CartButton() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const { items } = useCart();

  return (
    <TouchableOpacity
      onPress={() => router.push('/cart')}
      style={{ padding: 8 }}
    >
      <View>
        <Ionicons name="cart-outline" size={28} color={isDark ? '#fff' : '#000'} />
        <Badge count={items.length} color={tintColor} />
      </View>
    </TouchableOpacity>
  );
} 