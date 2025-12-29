import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
  CameraPosition,
} from 'react-native-vision-camera';
import {useTensorflowModel} from 'react-native-fast-tflite';
import {useResizePlugin} from 'vision-camera-resize-plugin';

function CameraComponent({navigation}: any) {
  // 1. 권한 및 장치 설정
  const {hasPermission, requestPermission} = useCameraPermission();
  const [position, setPosition] = useState<CameraPosition>('front'); // 기본값: 셀카 모드
  const device = useCameraDevice(position);

  // 2. 모델 로드 (경로 확인 필수!)
  const model = useTensorflowModel(
    require('../../src/assets/MobileFaceNet_new_latest_int8.tflite'),
  );
  const {resize} = useResizePlugin();

  // 3. 디버깅용: 모델이 로드되면 스펙을 로그에 출력
  useEffect(() => {
    if (model.state === 'loaded' && model.model != null) {
      console.log('✅ AI 모델 로드 성공!');
      console.log('------------------------------------------------');
      console.log('🔹 입력 데이터 구조(Inputs):', model.model.inputs);
      console.log('🔹 출력 데이터 구조(Outputs):', model.model.outputs);
      console.log('------------------------------------------------');
      // Tip: 로그에서 "dataType"이 "uint8"인지 "float32"인지 꼭 확인하세요!
    }
  }, [model.state]);

  // 4. 실시간 프레임 처리 (얼굴 인식 핵심 로직)
  const frameProcessor = useFrameProcessor(
    frame => {
      'worklet';

      if (model.model == null || model.state !== 'loaded') return;

      // 1. 일단 uint8(0 ~ 255)로 리사이징을 받습니다.
      const resized = resize(frame, {
        scale: {width: 112, height: 112},
        pixelFormat: 'rgb',
        dataType: 'uint8', // 여기서 int8을 바로 못 만드니 uint8로 받음
      });

      // 2. [핵심] uint8 -> int8 변환 (데이터 시프트)
      // 0~255 범위를 -128~127 범위로 이동시킵니다. (값 - 128)
      const int8Data = new Int8Array(resized.length); // int8 전용 그릇 만들기

      for (let i = 0; i < resized.length; i++) {
        // 예: 0 -> -128, 128 -> 0, 255 -> 127
        int8Data[i] = resized[i] - 128;
      }

      try {
        // 3. 변환된 int8 데이터(int8Data)를 모델에 넣습니다.
        const output = model.model.runSync([int8Data]);

        const embedding = output[0];

        // 로그 출력
        if (Math.random() < 0.05) {
          console.log(`✅ int8 모델 실행 성공! 벡터 길이: ${embedding.length}`);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`🚨 에러 발생: ${msg}`);
      }
    },
    [model],
  );

  // 5. 권한 요청
  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission]);

  // 6. 화면 렌더링
  if (!hasPermission)
    return (
      <View style={styles.center}>
        <Text style={styles.text}>권한이 필요합니다.</Text>
      </View>
    );
  if (device == null)
    return (
      <View style={styles.center}>
        <Text style={styles.text}>카메라 장치를 찾을 수 없습니다.</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      {/* 로딩 표시 */}
      {model.state === 'loading' && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#00ff00" />
          <Text style={styles.loadingText}>AI 모델 로딩 중...</Text>
        </View>
      )}

      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor} // Worklet 연결
        pixelFormat="yuv" // Android/iOS 호환성 최적화
      />

      {/* 하단 버튼 (뒤로가기, 카메라 전환) */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>닫기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => setPosition(p => (p === 'back' ? 'front' : 'back'))}>
          <Text style={styles.buttonText}>🔄 전환</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: 'black'},
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  text: {color: 'white', fontSize: 18},
  loadingOverlay: {
    position: 'absolute',
    top: 100,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {color: '#00ff00', marginTop: 10, fontWeight: 'bold'},
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
  },
  button: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    padding: 15,
    borderRadius: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonText: {color: 'white', fontWeight: 'bold'},
});

export default CameraComponent;
