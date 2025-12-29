import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  CameraPosition,
} from 'react-native-vision-camera';

function CameraComponent({navigation}: any) {
  // 1. 카메라 권한 상태 가져오기
  const {hasPermission, requestPermission} = useCameraPermission();

  // 2. 현재 카메라 위치 상태 관리 ('back' 또는 'front')
  const [position, setPosition] = useState<CameraPosition>('back');

  // 3. 현재 위치(position)에 맞는 카메라 장치 찾기
  // position 상태가 바뀌면 device도 자동으로 바뀝니다.
  const device = useCameraDevice(position);

  // 4. 카메라 제어용 Ref
  const camera = useRef<Camera>(null);

  // 권한 없을 때 요청
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);

  // 카메라 전환 함수 (전면 <-> 후면)
  const toggleCameraPosition = () => {
    setPosition(currentPosition =>
      currentPosition === 'back' ? 'front' : 'back',
    );
  };

  // 사진 촬영 함수
  const handleTakePhoto = async () => {
    if (camera.current) {
      try {
        const photo = await camera.current.takePhoto({
          flash: 'off',
          enableShutterSound: true,
        });
        Alert.alert('촬영 성공', `사진이 저장되었습니다.\n${photo.path}`);
        console.log(photo.path);
      } catch (error) {
        console.error('촬영 실패:', error);
        Alert.alert('에러', '사진 촬영 중 문제가 발생했습니다.');
      }
    }
  };

  // 렌더링 1: 권한 없음
  if (!hasPermission) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.text}>카메라 권한이 필요합니다.</Text>
        <TouchableOpacity onPress={() => Linking.openSettings()}>
          <Text style={styles.link}>설정으로 이동</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 렌더링 2: 장치 못 찾음
  if (device == null) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.text}>카메라 장치를 찾을 수 없습니다.</Text>
        <Text style={styles.subText}>(현재 위치: {position})</Text>
      </View>
    );
  }

  // 렌더링 3: 정상 작동
  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />

      {/* 하단 컨트롤 영역 */}
      <View style={styles.buttonContainer}>
        {/* 닫기 버튼 */}
        <TouchableOpacity
          style={styles.sideButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>닫기</Text>
        </TouchableOpacity>

        {/* 촬영 버튼 */}
        <TouchableOpacity
          style={styles.captureButton}
          onPress={handleTakePhoto}>
          <View style={styles.captureInner} />
        </TouchableOpacity>

        {/* 전환 버튼 (새로 추가됨) */}
        <TouchableOpacity
          style={styles.sideButton}
          onPress={toggleCameraPosition}>
          {/* 현재가 back이면 '셀카', front면 '후면' 표시 */}
          <Text style={styles.buttonText}>
            {position === 'back' ? '🔄 셀카' : '🔄 후면'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {color: 'white', fontSize: 18, marginBottom: 10},
  subText: {color: '#aaa', fontSize: 14},
  link: {color: '#007aff', fontSize: 18, fontWeight: 'bold', marginTop: 10},

  // 하단 버튼 컨테이너
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around', // 버튼 간격 균등 배치
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  // 촬영 버튼 스타일
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.5)', // 반투명 흰색 배경
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'white',
  },
  // 양옆 버튼 (닫기, 전환) 스타일
  sideButton: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.3)', // 잘 보이게 반투명 배경 추가
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CameraComponent;
