import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';

export default function SearchingView({ onCancel }: { onCancel: () => void }) {
  return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      <ActivityIndicator size="large" color="#0284c7" />
      <Text className="text-xl font-bold text-gray-900 mt-6 mb-2">Finding your driver...</Text>
      <Text className="text-gray-500 text-center mb-10">Matching you with nearby drivers</Text>
      <TouchableOpacity onPress={onCancel} className="border border-gray-300 rounded-2xl px-8 py-3">
        <Text className="text-gray-700 font-medium">Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}
