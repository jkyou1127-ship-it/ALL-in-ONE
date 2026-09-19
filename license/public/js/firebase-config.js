// ⚠️ Firebase 프로젝트 설정을 아래에 입력하세요.
// timer/obdcube와 같은 프로젝트를 가리켜야 통합 로그인(같은 계정)이 됩니다.
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAWJX2yC3xFFcbG9nhuwvxKWA9EAtwCDh4",
  authDomain: "all-in-one-bfc59.firebaseapp.com",
  projectId: "all-in-one-bfc59",
  storageBucket: "all-in-one-bfc59.firebasestorage.app",
  messagingSenderId: "354393080607",
  appId: "1:354393080607:web:73d5f8fae5baa9b85aa62a"
};

// 최초 관리자로 자동 지정될 이메일 (firestore.rules 의 isBootstrapAdminEmail 과 반드시 동일해야 합니다)
const ADMIN_BOOTSTRAP_EMAIL = "sycovy0706@naver.com";

firebase.initializeApp(FIREBASE_CONFIG);
const auth = firebase.auth();
const db = firebase.firestore();
