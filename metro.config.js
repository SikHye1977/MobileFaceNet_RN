// const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

// /**
//  * Metro configuration
//  * https://reactnative.dev/docs/metro
//  *
//  * @type {import('@react-native/metro-config').MetroConfig}
//  */
// const config = {};

// module.exports = mergeConfig(getDefaultConfig(__dirname), config);

const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);

// 1. 기존 자산(Asset) 확장자 리스트 가져오기
const {assetExts} = config.resolver;

// 2. 'tflite' 확장자를 리스트에 추가하기
config.resolver.assetExts = [...assetExts, 'tflite'];

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
